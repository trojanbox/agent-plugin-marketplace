import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().url().optional(),
  TEST_DATABASE_URL: z.string().url().optional(),
  E2E_DATABASE_URL: z.string().url().optional(),
  DB_TEST_KIND: z.enum(['integration', 'e2e']).default('integration'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(168),
})

const env = envSchema.parse(process.env)
const databaseUrl =
  env.NODE_ENV === 'test'
    ? env.DB_TEST_KIND === 'e2e'
      ? env.E2E_DATABASE_URL
      : env.TEST_DATABASE_URL
    : env.DATABASE_URL

function databaseIdentity(value: string): string {
  const url = new URL(value)
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('Only PostgreSQL connection URLs are supported')
  }
  return [url.hostname.toLowerCase(), url.port || '5432', decodeURIComponent(url.pathname)].join(
    ':',
  )
}

if (env.NODE_ENV === 'test' && databaseUrl) {
  if (!/test/i.test(new URL(databaseUrl).pathname)) {
    throw new Error('Test database name must contain a test marker')
  }
  if (env.DATABASE_URL && databaseIdentity(databaseUrl) === databaseIdentity(env.DATABASE_URL)) {
    throw new Error('Test database must not match DATABASE_URL')
  }
}
if (databaseUrl) databaseIdentity(databaseUrl)

export const appConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  databaseUrl,
  sessionTtlMs: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
  sessionCookieName: env.NODE_ENV === 'production' ? '__Host-session' : 'session',
  secureCookie: env.NODE_ENV === 'production',
} as const

export function requiredDatabaseUrl(): string {
  if (!appConfig.databaseUrl) {
    throw new Error('DATABASE_URL or a dedicated test database URL is required')
  }
  return appConfig.databaseUrl
}
