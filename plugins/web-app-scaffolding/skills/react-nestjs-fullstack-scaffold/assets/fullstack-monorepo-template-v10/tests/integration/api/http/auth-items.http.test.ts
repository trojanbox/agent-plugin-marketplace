import { randomUUID } from 'node:crypto'

import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { DatabaseService } from '../../../../apps/api/src/modules/infrastructure/database/database.service.js'
import { eq } from 'drizzle-orm'
import { users } from '../../../../apps/api/src/modules/infrastructure/database/schema/auth.schema.js'
import { items } from '../../../../apps/api/src/modules/infrastructure/database/schema/item.schema.js'
import { cookieValue } from '../../../support/api/cookies.js'
import { createTestApp } from '../../../support/api/test-app.js'

describe('HTTP integration', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await createTestApp()
    const database = app.get(DatabaseService)
    await database.db.delete(items)
    await database.db.insert(items).values({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'HTTP integration item',
      summary: 'Summary',
      content: 'Content',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    })
  })

  afterEach(async () => {
    await app.close()
  })

  it('covers register → session → list → detail → logout with real HTTP pipeline', async () => {
    const agent = request.agent(app.getHttpServer())
    const email = `integration-${randomUUID()}@example.com`

    const register = await agent
      .post('/api/v1/auth/register')
      .send({ email, password: 'a-strong-integration-password' })
      .expect(201)

    expect(register.body.code).toBe(0)
    const csrf = cookieValue(register.headers['set-cookie'], 'csrf_token')
    if (!csrf) {
      throw new Error('CSRF cookie missing after registration')
    }

    await agent
      .get('/api/v1/auth/session')
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.user.email).toBe(email)
      })

    await agent
      .get('/api/v1/items')
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.list).toHaveLength(1)
        expect(body.data.page.totalRows).toBe(1)
      })

    await agent
      .get('/api/v1/items/11111111-1111-4111-8111-111111111111')
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.title).toBe('HTTP integration item')
      })

    await agent.post('/api/v1/auth/logout').set('X-CSRF-Token', csrf).expect(200)

    await agent.get('/api/v1/auth/session').expect(401)
  })

  it('keeps health public while protected resources default to authenticated', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200)
    await request(app.getHttpServer()).get('/api/v1/ready').expect(200)
    await request(app.getHttpServer()).get('/api/v1/items').expect(401)
  })

  it('returns the shared validation envelope for invalid input', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'invalid', password: 'short' })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.code).toBe('VALIDATION_ERROR')
      })
  })

  it('rejects sessions and sign-in for a soft-deleted account', async () => {
    const agent = request.agent(app.getHttpServer())
    const email = 'deleted-' + randomUUID() + '@example.com'
    await agent
      .post('/api/v1/auth/register')
      .send({ email, password: 'a-strong-integration-password' })
      .expect(201)

    const database = app.get(DatabaseService)
    await database.db.update(users).set({ deletedAt: new Date() }).where(eq(users.email, email))
    await agent.get('/api/v1/auth/session').expect(401)
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'a-strong-integration-password' })
      .expect(401)
  })
})
