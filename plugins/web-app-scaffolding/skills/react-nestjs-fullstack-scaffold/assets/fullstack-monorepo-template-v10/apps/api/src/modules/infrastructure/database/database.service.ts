import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { requiredDatabaseUrl } from '../../../config/app.config.js'
import * as schema from './schema/index.js'

function createDatabase(pool: Pool) {
  return drizzle(pool, { schema })
}

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool
  readonly db: ReturnType<typeof createDatabase>

  constructor() {
    this.pool = new Pool({ connectionString: requiredDatabaseUrl() })
    this.db = createDatabase(this.pool)
  }

  async ping(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1')
      return true
    } catch {
      return false
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end()
  }
}
