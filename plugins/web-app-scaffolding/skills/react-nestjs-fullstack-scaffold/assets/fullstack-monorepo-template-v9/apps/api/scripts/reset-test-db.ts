import { existsSync, rmSync } from 'node:fs'

import { migrateDatabase, resolveDatabaseFile, seedDemoData } from './database-tools.js'

function assertSafeTestDatabase(file: string): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Refusing destructive reset unless NODE_ENV=test')
  }

  const databaseFile = resolveDatabaseFile(file)
  const lower = databaseFile.toLowerCase()
  if (!lower.includes('test') && !lower.includes('integration') && !lower.includes('e2e')) {
    throw new Error(`Refusing to reset database without a test marker: ${databaseFile}`)
  }
}

const file = process.env.DB_FILE_NAME
if (!file) throw new Error('DB_FILE_NAME is required for test reset')

assertSafeTestDatabase(file)
const databaseFile = resolveDatabaseFile(file)

for (const candidate of [databaseFile, `${databaseFile}-shm`, `${databaseFile}-wal`]) {
  if (existsSync(candidate)) rmSync(candidate)
}

migrateDatabase(file)
if (process.argv.includes('--seed')) seedDemoData(file)

console.log(`Reset test database: ${databaseFile}`)
