import { randomUUID } from 'node:crypto'

import {
  API_ERROR_CODE,
  type LoginRequest,
  type RegisterRequest,
  type UserDto,
} from '@repo/contracts'
import { Injectable } from '@nestjs/common'

import { appConfig } from '../../../config/app.config.js'
import { ApplicationError } from '../../../errors/application-error.js'
import {
  hashOpaqueToken,
  hashPassword,
  randomOpaqueToken,
  runDummyPasswordDerivation,
  verifyPassword,
} from '../security/auth.crypto.js'
import { AuthRepository } from '../repositories/auth.repository.js'

export type AuthPrincipal = {
  sessionId: string
  csrfTokenHash: string
  user: UserDto
}

export type CreatedSession = AuthPrincipal & {
  sessionToken: string
  csrfToken: string
}

@Injectable()
export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async register(input: RegisterRequest): Promise<CreatedSession> {
    const now = new Date()
    const user = this.repository.createUser({
      id: randomUUID(),
      email: input.email,
      passwordHash: await hashPassword(input.password),
      createdAt: now,
    })

    if (!user) {
      throw new ApplicationError(
        'conflict',
        API_ERROR_CODE.EmailAlreadyExists,
        'Email already exists',
        { numericCode: 10002 },
      )
    }

    return this.createSession({ id: user.id, email: user.email, createdAt: user.createdAt })
  }

  async login(input: LoginRequest): Promise<CreatedSession> {
    const user = this.repository.findUserByEmail(input.email)
    if (!user) {
      await runDummyPasswordDerivation(input.password)
      throw this.invalidCredentials()
    }

    const valid = await verifyPassword(input.password, user.passwordHash)
    if (!valid || !user.isActive) throw this.invalidCredentials()

    return this.createSession({ id: user.id, email: user.email, createdAt: user.createdAt })
  }

  authenticate(sessionToken: string): AuthPrincipal {
    const row = this.repository.findActiveSessionByTokenHash(
      hashOpaqueToken(sessionToken),
      new Date(),
    )
    if (!row) {
      throw new ApplicationError(
        'unauthenticated',
        API_ERROR_CODE.Unauthenticated,
        'Authentication required',
        { numericCode: 10003 },
      )
    }

    return {
      sessionId: row.sessionId,
      csrfTokenHash: row.csrfTokenHash,
      user: {
        id: row.userId,
        email: row.email,
        createdAt: row.userCreatedAt.toISOString(),
      },
    }
  }

  verifyCsrfToken(principal: AuthPrincipal, csrfToken: string | undefined): void {
    if (!csrfToken || hashOpaqueToken(csrfToken) !== principal.csrfTokenHash) {
      throw new ApplicationError(
        'forbidden',
        API_ERROR_CODE.InvalidCsrfToken,
        'Invalid CSRF token',
        { numericCode: 10004 },
      )
    }
  }

  logout(sessionId: string): void {
    this.repository.revokeSession(sessionId, new Date())
  }

  private createSession(user: { id: string; email: string; createdAt: Date }): CreatedSession {
    const sessionToken = randomOpaqueToken()
    const csrfToken = randomOpaqueToken()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + appConfig.sessionTtlMs)
    const sessionId = randomUUID()

    this.repository.createSession({
      id: sessionId,
      userId: user.id,
      tokenHash: hashOpaqueToken(sessionToken),
      csrfTokenHash: hashOpaqueToken(csrfToken),
      createdAt: now,
      expiresAt,
    })

    return {
      sessionId,
      sessionToken,
      csrfToken,
      csrfTokenHash: hashOpaqueToken(csrfToken),
      user: { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() },
    }
  }

  private invalidCredentials(): ApplicationError {
    return new ApplicationError(
      'unauthenticated',
      API_ERROR_CODE.InvalidCredentials,
      'Email or password is invalid',
      { numericCode: 10001 },
    )
  }
}
