import { Injectable } from '@nestjs/common'
import { and, eq, gt, isNull } from 'drizzle-orm'

import { DatabaseService } from '../../infrastructure/database/database.service.js'
import { authSessions, users } from '../../infrastructure/database/schema/index.js'

@Injectable()
export class AuthRepository {
  constructor(private readonly database: DatabaseService) {}

  async findUserByEmail(email: string) {
    const [user] = await this.database.db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1)
    return user
  }

  async createUser(input: { id: string; email: string; passwordHash: string; createdAt: Date }) {
    const [user] = await this.database.db
      .insert(users)
      .values({ ...input, isActive: true })
      .onConflictDoNothing({ target: users.email })
      .returning()
    return user
  }

  async createSession(input: {
    id: string
    userId: string
    tokenHash: string
    csrfTokenHash: string
    createdAt: Date
    expiresAt: Date
  }): Promise<void> {
    await this.database.db.insert(authSessions).values(input)
  }

  async findActiveSessionByTokenHash(tokenHash: string, now: Date) {
    const [session] = await this.database.db
      .select({
        sessionId: authSessions.id,
        csrfTokenHash: authSessions.csrfTokenHash,
        userId: users.id,
        email: users.email,
        userCreatedAt: users.createdAt,
      })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.userId, users.id))
      .where(
        and(
          eq(authSessions.tokenHash, tokenHash),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, now),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .limit(1)
    return session
  }

  async revokeSession(sessionId: string, revokedAt: Date): Promise<void> {
    await this.database.db
      .update(authSessions)
      .set({ revokedAt })
      .where(eq(authSessions.id, sessionId))
  }
}
