import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baseName = 'fullstack-monorepo-template'

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
  const ciPath = resolve(projectRoot, '.github/workflows/ci.yml')
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
    ciPath,
    readmePath,
    testingDocPath,
  ]
  const contents = await Promise.all(files.map((path) => readFile(path, 'utf8')))
  const expectedMarkers = [
    ['fullstack_dev', 'fullstack_integration_test', 'fullstack_e2e_test', 'REDIS_URL'],
    ['fullstack_dev', 'fullstack_integration_test', 'fullstack_e2e_test', 'TEST_REDIS_URL'],
    ['fullstack_dev', 'redis:7.4-alpine'],
    ['fullstack_integration_test', 'fullstack_e2e_test'],
    ['fullstack_dev', 'fullstack_integration_test', 'fullstack_e2e_test'],
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
  const transform = (content, localPort = true) => {
    const renamed = content
      .replaceAll('fullstack_integration_test', dbPrefix + '_integration_test')
      .replaceAll('fullstack_e2e_test', dbPrefix + '_e2e_test')
      .replaceAll('fullstack_dev', dbPrefix + '_dev')
    return localPort
      ? renamed
          .replaceAll('127.0.0.1:5432', '127.0.0.1:' + dbPort)
          .replaceAll('127.0.0.1:6379', '127.0.0.1:' + redisPort)
      : renamed
  }

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
    await writeFile(files[i], transform(contents[i], files[i] !== ciPath))
  }
  await writeFile(envPath, transform(contents[0]), { flag: 'wx' })
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
