import 'dotenv/config'

import { Pool } from 'pg'

import { migrateDatabase, seedDemoData } from './database-tools.js'

const kind = process.env.DB_TEST_KIND === 'e2e' ? 'e2e' : 'integration'
const url = kind === 'e2e' ? process.env.E2E_DATABASE_URL : process.env.TEST_DATABASE_URL

function databaseIdentity(value: string): string {
  const parsed = new URL(value)
  if (!['postgresql:', 'postgres:'].includes(parsed.protocol))
    throw new Error('PostgreSQL URL required')
  return [
    parsed.hostname.toLowerCase(),
    parsed.port || '5432',
    decodeURIComponent(parsed.pathname),
  ].join(':')
}

function assertSafeTestDatabase(url: string | undefined): asserts url is string {
  if (process.env.NODE_ENV !== 'test')
    throw new Error('Refusing destructive reset unless NODE_ENV=test')
  if (!url) throw new Error('Dedicated test database URL is required')
  if (!process.env.DATABASE_URL)
    throw new Error('DATABASE_URL is required to guard the development database')
  if (databaseIdentity(url) === databaseIdentity(process.env.DATABASE_URL)) {
    throw new Error('Refusing to reset the development database')
  }
  const databaseName = new URL(url).pathname.slice(1).toLowerCase()
  if (!databaseName.includes('test') || !databaseName.includes(kind)) {
    throw new Error('Test database name must include both test and test kind markers')
  }
}

assertSafeTestDatabase(url)
const pool = new Pool({ connectionString: url })
try {
  // Test databases have their own DB names and never share this schema with dev/prod.
  await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE')
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE')
  await pool.query('CREATE SCHEMA public')
} finally {
  await pool.end()
}

await migrateDatabase(url)
if (process.argv.includes('--seed')) await seedDemoData(url)

console.log('Reset ' + kind + ' database: ' + new URL(url).pathname.slice(1))
