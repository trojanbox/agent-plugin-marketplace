import { Injectable } from '@nestjs/common'
import { sql } from 'drizzle-orm'

import { DatabaseService } from '../../infrastructure/database/database.service.js'
import { authRateLimits } from '../../infrastructure/database/schema/index.js'

@Injectable()
export class AuthRateLimitRepository {
  constructor(private readonly database: DatabaseService) {}

  async consume(key: string, windowMs: number): Promise<{ attempts: number; windowEndsAt: Date }> {
    const [row] = await this.database.db
      .insert(authRateLimits)
      .values({ key, attempts: 1, windowEndsAt: new Date(Date.now() + windowMs) })
      .onConflictDoUpdate({
        target: authRateLimits.key,
        set: {
          attempts: sql.raw(
            'CASE WHEN auth_rate_limits.window_ends_at <= NOW() THEN 1 ELSE auth_rate_limits.attempts + 1 END',
          ),
          windowEndsAt: sql.raw(
            'CASE WHEN auth_rate_limits.window_ends_at <= NOW() THEN EXCLUDED.window_ends_at ELSE auth_rate_limits.window_ends_at END',
          ),
        },
      })
      .returning({ attempts: authRateLimits.attempts, windowEndsAt: authRateLimits.windowEndsAt })
    if (!row) throw new Error('Rate limit row missing')
    return row
  }
}
