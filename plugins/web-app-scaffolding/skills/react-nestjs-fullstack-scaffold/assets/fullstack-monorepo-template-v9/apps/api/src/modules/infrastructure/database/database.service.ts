import { mkdirSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import { appConfig } from '../../../config/app.config.js'
import * as schema from './schema/index.js'

type SqliteDatabase = InstanceType<typeof Database>

const apiRoot = fileURLToPath(new URL('../../../../', import.meta.url))

function resolveDatabaseFile(file: string): string {
  return isAbsolute(file) ? file : resolve(apiRoot, file)
}

function createDatabase(client: SqliteDatabase) {
  return drizzle(client, { schema })
}

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly sqlite: SqliteDatabase
  readonly db: ReturnType<typeof createDatabase>

  constructor() {
    const databaseFile = resolveDatabaseFile(appConfig.databaseFile)
    mkdirSync(dirname(databaseFile), { recursive: true })
    this.sqlite = new Database(databaseFile)
    this.sqlite.pragma('foreign_keys = ON')
    this.sqlite.pragma('journal_mode = WAL')
    this.db = createDatabase(this.sqlite)
  }

  ping(): boolean {
    const row = this.sqlite.prepare('select 1 as ok').get() as { ok?: number } | undefined
    return row?.ok === 1
  }

  onModuleDestroy(): void {
    this.sqlite.close()
  }
}
