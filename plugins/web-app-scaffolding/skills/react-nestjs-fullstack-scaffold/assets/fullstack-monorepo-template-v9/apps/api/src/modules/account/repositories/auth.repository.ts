import { Injectable } from '@nestjs/common'
import { and, eq, gt, isNull } from 'drizzle-orm'

import { DatabaseService } from '../../infrastructure/database/database.service.js'
import { authSessions, users } from '../../infrastructure/database/schema/index.js'

@Injectable()
export class AuthRepository {
  constructor(private readonly database: DatabaseService) {}

  findUserByEmail(email: string) {
    return this.database.db.select().from(users).where(eq(users.email, email)).limit(1).get()
  }

  createUser(input: { id: string; email: string; passwordHash: string; createdAt: Date }) {
    return this.database.db
      .insert(users)
      .values({ ...input, isActive: true })
      .onConflictDoNothing({ target: users.email })
      .returning()
      .get()
  }

  createSession(input: {
    id: string
    userId: string
    tokenHash: string
    csrfTokenHash: string
    createdAt: Date
    expiresAt: Date
  }): void {
    this.database.db.insert(authSessions).values(input).run()
  }

  findActiveSessionByTokenHash(tokenHash: string, now: Date) {
    return this.database.db
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
        ),
      )
      .limit(1)
      .get()
  }

  revokeSession(sessionId: string, revokedAt: Date): void {
    this.database.db
      .update(authSessions)
      .set({ revokedAt })
      .where(eq(authSessions.id, sessionId))
      .run()
  }
}
