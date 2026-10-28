import 'dotenv/config'
import { isIP } from 'node:net'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().url().optional(),
  TEST_DATABASE_URL: z.string().url().optional(),
  E2E_DATABASE_URL: z.string().url().optional(),
  DB_TEST_KIND: z.enum(['integration', 'e2e']).default('integration'),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(100).max(60000).default(5000),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
  DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(100).max(120000).default(15000),
  TRUSTED_PROXY_IPS: z.string().default(''),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(168),
})

const env = envSchema.parse(process.env)
const trustedProxyIps = env.TRUSTED_PROXY_IPS.split(',')
  .map((ip) => ip.trim())
  .filter(Boolean)
if (trustedProxyIps.some((ip) => isIP(ip) === 0)) {
  throw new Error('TRUSTED_PROXY_IPS requires an IP allowlist, not arbitrary headers')
}
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
  trustedProxyIps,
  dbPoolMax: env.DB_POOL_MAX,
  dbConnectionTimeoutMs: env.DB_CONNECTION_TIMEOUT_MS,
  dbIdleTimeoutMs: env.DB_IDLE_TIMEOUT_MS,
  dbStatementTimeoutMs: env.DB_STATEMENT_TIMEOUT_MS,
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
