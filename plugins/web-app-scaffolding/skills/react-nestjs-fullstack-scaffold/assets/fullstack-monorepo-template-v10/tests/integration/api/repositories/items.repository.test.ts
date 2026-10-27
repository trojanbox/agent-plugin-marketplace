import { randomUUID } from 'node:crypto'

import { Test } from '@nestjs/testing'
import { eq, sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'

import { ItemsRepository } from '../../../../apps/api/src/modules/catalog/repositories/items.repository.js'
import { DatabaseService } from '../../../../apps/api/src/modules/infrastructure/database/database.service.js'
import { items } from '../../../../apps/api/src/modules/infrastructure/database/schema/item.schema.js'
import { InfrastructureModule } from '../../../../apps/api/src/modules/infrastructure/infrastructure.module.js'

describe('ItemsRepository', () => {
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [InfrastructureModule] }).compile()
    const database = moduleRef.get(DatabaseService)
    await database.db.delete(items)
    await moduleRef.close()
  })

  it('reads list and detail from real PostgreSQL + Drizzle schema', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [InfrastructureModule],
      providers: [ItemsRepository],
    }).compile()

    const database = moduleRef.get(DatabaseService)
    const repository = moduleRef.get(ItemsRepository)

    await database.db.insert(items).values([
      {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Newest',
        summary: 'A',
        content: 'A content',
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        title: 'Older',
        summary: 'B',
        content: 'B content',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ])

    const page = await repository.list({ currentPage: 1, pageSize: 1 })
    expect(page.totalRows).toBe(2)
    expect(page.list[0]?.title).toBe('Newest')
    expect((await repository.findById('22222222-2222-4222-8222-222222222222'))?.content).toBe(
      'B content',
    )

    await moduleRef.close()
  })

  it('has millisecond UTC timestamps, SQL update triggers and soft-delete filtering', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [InfrastructureModule],
      providers: [ItemsRepository],
    }).compile()
    try {
      const database = moduleRef.get(DatabaseService)
      const repository = moduleRef.get(ItemsRepository)
      const id = randomUUID()
      const initialTime = new Date('2020-01-01T00:00:00.123Z')
      const [created] = await database.db
        .insert(items)
        .values({
          id,
          title: 'Before',
          summary: 'Summary',
          content: 'Detail',
          createdAt: initialTime,
          updatedAt: initialTime,
        })
        .returning()

      expect(created?.createdAt.toISOString()).toBe('2020-01-01T00:00:00.123Z')
      expect(created?.updatedAt.toISOString()).toBe('2020-01-01T00:00:00.123Z')
      expect(created?.deletedAt).toBeNull()

      // This raw SQL update must refresh updated_at independently of any ORM hook.
      await database.db.execute(sql`UPDATE ${items} SET title = 'After' WHERE ${items.id} = ${id}`)
      const [afterUpdate] = await database.db.select().from(items).where(eq(items.id, id))
      expect(afterUpdate?.createdAt.toISOString()).toBe('2020-01-01T00:00:00.123Z')
      expect(afterUpdate?.updatedAt.getTime()).toBeGreaterThan(initialTime.getTime())

      await database.db.update(items).set({ deletedAt: new Date() }).where(eq(items.id, id))
      const page = await repository.list({ currentPage: 1, pageSize: 20 })
      expect(page.list).toHaveLength(0)
      expect(page.totalRows).toBe(0)
      expect(await repository.findById(id)).toBeUndefined()
      const [afterDelete] = await database.db.select().from(items).where(eq(items.id, id))
      expect(afterDelete?.deletedAt).toBeInstanceOf(Date)
    } finally {
      await moduleRef.close()
    }
  })
})
