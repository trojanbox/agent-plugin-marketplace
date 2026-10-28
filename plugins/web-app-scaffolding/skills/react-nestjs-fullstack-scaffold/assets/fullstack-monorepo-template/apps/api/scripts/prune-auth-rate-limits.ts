import 'dotenv/config'
import { lt } from 'drizzle-orm'
import { Pool } from 'pg'

import { requiredDatabaseUrl } from '../src/config/app.config.js'
import { authRateLimits } from '../src/modules/infrastructure/database/schema/auth.schema.js'
import { drizzle } from 'drizzle-orm/node-postgres'

const pool = new Pool({ connectionString: requiredDatabaseUrl() })
try {
  const db = drizzle(pool)
  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000)
  await db.delete(authRateLimits).where(lt(authRateLimits.windowEndsAt, threshold))
  console.log('Pruned expired authentication rate-limit keys')
} finally {
  await pool.end()
}
