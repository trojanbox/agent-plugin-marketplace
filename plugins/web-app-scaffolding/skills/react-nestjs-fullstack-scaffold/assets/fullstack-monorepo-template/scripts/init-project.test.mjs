import { strict as assert } from 'node:assert'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { initialize } from './init-project.mjs'

test('initializes a copied project once without overwriting existing data', async () => {
  const root = await mkdtemp(join(tmpdir(), 'scaffold-init-'))
  try {
    const put = async (path, value) => {
      const { dirname } = await import('node:path')
      await mkdir(dirname(join(root, path)), { recursive: true })
      await writeFile(join(root, path), value)
    }
    // Keep this test tied to the actual copyable template, not a simplified fixture.
    for (const path of [
      'package.json',
      'apps/web/index.html',
      'apps/api/.env.example',
      'apps/api/.env.test.example',
      'compose.yaml',
      'scripts/postgres/init-test-databases.sql',
      '.github/workflows/ci.yml',
      'README.md',
      'docs/testing-strategy.md',
      'packages/i18n/src/locales/zh-CN/common.json',
      'packages/i18n/src/locales/en-US/common.json',
    ]) {
      await put(path, await readFile(new URL('../' + path, import.meta.url), 'utf8'))
    }
    await initialize(root, 'new-product', 'New Product', 5543)
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
    assert.equal(pkg.name, 'new-product')
    assert.match(await readFile(join(root, 'apps/web/index.html'), 'utf8'), /New Product/)
    assert.match(await readFile(join(root, 'apps/api/.env'), 'utf8'), /new_product_dev/)
    assert.match(await readFile(join(root, 'apps/api/.env'), 'utf8'), /:5543/)
    assert.match(
      await readFile(join(root, 'apps/api/.env.test.example'), 'utf8'),
      /new_product_integration_test/,
    )
    assert.match(
      await readFile(join(root, '.github/workflows/ci.yml'), 'utf8'),
      /new_product_e2e_test/,
    )
    assert.match(
      await readFile(join(root, '.github/workflows/ci.yml'), 'utf8'),
      /127\.0\.0\.1:5432\/new_product_e2e_test/,
    )
    assert.match(await readFile(join(root, 'compose.yaml'), 'utf8'), /new_product_dev/)
    assert.match(await readFile(join(root, 'README.md'), 'utf8'), /new_product_dev/)
    assert.match(
      await readFile(join(root, 'scripts/postgres/init-test-databases.sql'), 'utf8'),
      /CREATE DATABASE "new_product_integration_test"/,
    )
    for (const locale of ['zh-CN', 'en-US']) {
      assert.equal(
        JSON.parse(
          await readFile(join(root, 'packages/i18n/src/locales', locale, 'common.json'), 'utf8'),
        ).appName,
        'New Product',
      )
    }
    await assert.rejects(initialize(root, 'again'), /already been initialized/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('refuses initialization when a local environment already exists', async () => {
  const root = await mkdtemp(join(tmpdir(), 'scaffold-env-safety-'))
  try {
    await mkdir(join(root, 'apps/api'), { recursive: true })
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ name: 'fullstack-monorepo-template' }),
    )
    await mkdir(join(root, 'apps/web'), { recursive: true })
    await writeFile(join(root, 'apps/web/index.html'), '<title>Fullstack Template</title>')
    await writeFile(join(root, 'apps/api/.env'), 'SECRET_PRESERVE=original\n')
    await assert.rejects(initialize(root, 'new-service'), /already exists/)
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
    assert.equal(pkg.name, 'fullstack-monorepo-template')
    assert.equal(await readFile(join(root, 'apps/api/.env'), 'utf8'), 'SECRET_PRESERVE=original\n')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects invalid project names before writing files', async () => {
  await assert.rejects(initialize('/nonexistent', '../wrong'), /npm-safe/)
  await assert.rejects(initialize('/nonexistent', 'a'.repeat(47)), /max 46/)
})
