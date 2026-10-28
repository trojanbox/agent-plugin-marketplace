import { Test } from '@nestjs/testing'
import { describe, expect, it, vi } from 'vitest'

import { ApplicationError } from '../../../errors/application-error.js'
import { DatabaseService } from '../../infrastructure/database/database.service.js'
import { AuthRepository } from '../repositories/auth.repository.js'
import { hashOpaqueToken } from '../security/auth.crypto.js'
import { AuthService, type AuthPrincipal } from './auth.service.js'

describe('AuthService', () => {
  it('maps an active session to an authenticated principal', async () => {
    const repository = {
      findActiveSessionByTokenHash: vi.fn().mockResolvedValue({
        sessionId: 'session-1',
        csrfTokenHash: hashOpaqueToken('csrf-token'),
        userId: '11111111-1111-4111-8111-111111111111',
        email: 'user@example.com',
        userCreatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repository },
        {
          provide: DatabaseService,
          useValue: { transaction: (fn: () => Promise<unknown>) => fn() },
        },
      ],
    }).compile()

    const service = moduleRef.get(AuthService)
    const principal = await service.authenticate('session-token')

    expect(repository.findActiveSessionByTokenHash).toHaveBeenCalledOnce()
    expect(principal.user).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      email: 'user@example.com',
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    await moduleRef.close()
  })

  it('rejects an invalid CSRF token', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: {} },
        {
          provide: DatabaseService,
          useValue: { transaction: (fn: () => Promise<unknown>) => fn() },
        },
      ],
    }).compile()

    const service = moduleRef.get(AuthService)
    const principal: AuthPrincipal = {
      sessionId: 'session-1',
      csrfTokenHash: hashOpaqueToken('expected'),
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'user@example.com',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    }

    expect(() => service.verifyCsrfToken(principal, 'wrong')).toThrow(ApplicationError)
    await moduleRef.close()
  })
})
