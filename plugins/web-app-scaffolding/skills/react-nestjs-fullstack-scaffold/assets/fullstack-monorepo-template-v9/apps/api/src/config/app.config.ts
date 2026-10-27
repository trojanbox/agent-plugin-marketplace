import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DB_FILE_NAME: z.string().min(1).default('./data/app.db'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(168),
})

const env = envSchema.parse(process.env)

export const appConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  databaseFile: env.DB_FILE_NAME,
  sessionTtlMs: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
  sessionCookieName: env.NODE_ENV === 'production' ? '__Host-session' : 'session',
  secureCookie: env.NODE_ENV === 'production',
} as const
