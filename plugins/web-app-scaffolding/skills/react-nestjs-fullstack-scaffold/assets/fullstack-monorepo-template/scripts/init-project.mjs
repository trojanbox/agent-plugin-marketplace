import { existsSync } from 'node:fs'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baseName = 'fullstack-monorepo-template'

const readmeTemplateSections = [
  ['pnpm scaffold:init my-project --display-name "My Project"\n', ''],
  [
    'API 启动时不会自动执行 Migration。新项目请先运行 `pnpm scaffold:init`，自动生成名称、界面标题、独立数据库名称和 .env；多个项目共用一台机器时可以指定 `--db-port 5543 --redis-port 6380`。示例 app/app 凭据只用于本地开发；生产必须使用独立账号和机密。',
    'API 启动时不会自动执行 Migration。首次启动前先运行 `pnpm db:setup` 完成迁移与种子数据；名称、界面标题、独立数据库名称和 `.env` 已由初始化步骤生成。示例 app/app 凭据只用于本地开发；生产必须使用独立账号和机密。',
  ],
  [
    '复制模板后的唯一初始化命令：\n`pnpm scaffold:init <project-name> [--display-name "Name"] [--db-port 5432] [--redis-port 6379]`。项目名称最多 46 个小写 npm 安全字符，以兼容 PostgreSQL 的标识符长度；重复初始化会被拒绝，不覆盖已有 `.env`。初始化成功后，该命令、模板自检脚本以及 README/AGENTS 中的模板说明会自动从新项目移除。',
    '项目名称、界面标题、数据库名称与 `.env` 已由初始化步骤生成；数据库迁移与种子数据由 `pnpm db:setup` 执行。',
  ],
  [
    '## 作为新项目模板\n\n复制后优先替换项目名称、`@repo/*` 包名、示例 `items` 领域、示例文案和 Design Token。保留现有架构、认证、Migration、测试和文档管理边界，直到真实业务需求要求调整。',
    '## 复杂度边界',
  ],
]

const agentsTemplateSections = [
  ['- 模板唯一来源为本目录；复制后使用 scaffold:init 生成新项目的名称、数据库和环境配置。\n', ''],
]

const baselineMessage = 'Template documentation no longer matches the expected baseline: '

async function replaceSections(path, replacements) {
  let content = await readFile(path, 'utf8')
  for (const [from, to] of replacements) {
    if (!content.includes(from)) {
      throw new Error(baselineMessage + path)
    }
    content = content.replace(from, to)
  }
  await writeFile(path, content)
}

export async function removeScaffolding(projectRoot) {
  for (const file of ['scripts/init-project.mjs', 'scripts/init-project.test.mjs']) {
    await rm(resolve(projectRoot, file), { force: true })
  }
  const packagePath = resolve(projectRoot, 'package.json')
  const pkg = JSON.parse(await readFile(packagePath, 'utf8'))
  delete pkg.scripts['scaffold:init']
  delete pkg.scripts['test:scaffold']
  pkg.scripts.verify = pkg.scripts.verify.replace(' && pnpm test:scaffold', '')
  if (pkg.scripts.verify.includes('test:scaffold')) {
    throw new Error(baselineMessage + packagePath)
  }
  await writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n')
  await replaceSections(resolve(projectRoot, 'README.md'), readmeTemplateSections)
  await replaceSections(resolve(projectRoot, 'AGENTS.md'), agentsTemplateSections)
}

export async function initialize(
  projectRoot,
  name,
  displayName = name,
  dbPort = 5432,
  redisPort = 6379,
) {
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name) || name.length > 46) {
    throw new Error(
      'Project name must be a lowercase npm-safe name (max 46 chars for PostgreSQL database identifiers)',
    )
  }
  if (!displayName || displayName.length > 80 || /[<>\r\n]/.test(displayName)) {
    throw new Error('Invalid display name')
  }
  if (!Number.isInteger(dbPort) || dbPort < 1024 || dbPort > 65535) {
    throw new Error('Database port must be between 1024 and 65535')
  }
  if (!Number.isInteger(redisPort) || redisPort < 1024 || redisPort > 65535) {
    throw new Error('Redis port must be between 1024 and 65535')
  }
  const packagePath = resolve(projectRoot, 'package.json')
  const titlePath = resolve(projectRoot, 'apps/web/index.html')
  const envPath = resolve(projectRoot, 'apps/api/.env')
  const envExamplePath = resolve(projectRoot, 'apps/api/.env.example')
  const testEnvExamplePath = resolve(projectRoot, 'apps/api/.env.test.example')
  const composePath = resolve(projectRoot, 'compose.yaml')
  const sqlPath = resolve(projectRoot, 'scripts/postgres/init-test-databases.sql')
  const readmePath = resolve(projectRoot, 'README.md')
  const testingDocPath = resolve(projectRoot, 'docs/testing-strategy.md')
  const pkg = JSON.parse(await readFile(packagePath, 'utf8'))
  const html = await readFile(titlePath, 'utf8')
  if (pkg.name !== baseName || !html.includes('<title>Fullstack Template</title>')) {
    throw new Error('Template has already been initialized or does not match the expected baseline')
  }
  if (existsSync(envPath)) {
    throw new Error(
      'Refusing to initialize while apps/api/.env already exists; preserve or relocate it first',
    )
  }
  const files = [
    envExamplePath,
    testEnvExamplePath,
    composePath,
    sqlPath,
    readmePath,
    testingDocPath,
  ]
  const contents = await Promise.all(files.map((path) => readFile(path, 'utf8')))
  const expectedMarkers = [
    ['fullstack_dev', 'fullstack_integration_test', 'fullstack_e2e_test', 'REDIS_URL'],
    ['fullstack_dev', 'fullstack_integration_test', 'fullstack_e2e_test', 'TEST_REDIS_URL'],
    ['fullstack_dev', 'redis:7.4-alpine'],
    ['fullstack_integration_test', 'fullstack_e2e_test'],
    ['fullstack_dev'],
    ['fullstack_dev'],
  ]
  if (
    contents.some((content, index) =>
      expectedMarkers[index].some((marker) => !content.includes(marker)),
    )
  ) {
    throw new Error('Template database configuration does not match the expected baseline')
  }
  const translations = []
  for (const locale of ['en-US', 'zh-CN']) {
    const path = resolve(projectRoot, 'packages/i18n/src/locales', locale, 'common.json')
    const values = JSON.parse(await readFile(path, 'utf8'))
    translations.push({ path, values })
  }
  const dbPrefix = name.replace(/[^a-z0-9_]/g, '_')
  const transform = (content) =>
    content
      .replaceAll('fullstack_integration_test', dbPrefix + '_integration_test')
      .replaceAll('fullstack_e2e_test', dbPrefix + '_e2e_test')
      .replaceAll('fullstack_dev', dbPrefix + '_dev')
      .replaceAll('127.0.0.1:5432', '127.0.0.1:' + dbPort)
      .replaceAll('127.0.0.1:6379', '127.0.0.1:' + redisPort)

  pkg.name = name
  await writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n')
  await writeFile(
    titlePath,
    html.replace('<title>Fullstack Template</title>', '<title>' + displayName + '</title>'),
  )
  for (const { path, values } of translations) {
    values.appName = displayName
    await writeFile(path, JSON.stringify(values, null, 2) + '\n')
  }
  for (let i = 0; i < files.length; i++) {
    await writeFile(files[i], transform(contents[i]))
  }
  await writeFile(envPath, transform(contents[0]), { flag: 'wx' })
  await removeScaffolding(projectRoot)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [name, ...args] = process.argv.slice(2)
  const opts = {}
  let valid = !!name && args.length % 2 === 0
  for (let i = 0; i < args.length; i += 2) {
    if (
      !['--display-name', '--db-port', '--redis-port'].includes(args[i]) ||
      !args[i + 1] ||
      opts[args[i]] !== undefined
    ) {
      valid = false
    } else {
      opts[args[i]] = args[i + 1]
    }
  }
  if (!valid) {
    console.error(
      'Usage: pnpm scaffold:init <project-name> [--display-name "Display Name"] [--db-port 5432] [--redis-port 6379]',
    )
    process.exitCode = 1
  } else {
    try {
      await initialize(
        root,
        name,
        opts['--display-name'] ?? name,
        opts['--db-port'] ? Number(opts['--db-port']) : 5432,
        opts['--redis-port'] ? Number(opts['--redis-port']) : 6379,
      )
      console.log('Project initialized: ' + name)
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Initialization failed')
      process.exitCode = 1
    }
  }
}
