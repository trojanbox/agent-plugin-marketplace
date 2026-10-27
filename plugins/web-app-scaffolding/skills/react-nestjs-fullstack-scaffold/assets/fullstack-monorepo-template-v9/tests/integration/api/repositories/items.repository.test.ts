import { Test } from '@nestjs/testing'
import { beforeEach, describe, expect, it } from 'vitest'

import { ItemsRepository } from '../../../../apps/api/src/modules/catalog/repositories/items.repository.js'
import { DatabaseService } from '../../../../apps/api/src/modules/infrastructure/database/database.service.js'
import { items } from '../../../../apps/api/src/modules/infrastructure/database/schema/item.schema.js'
import { InfrastructureModule } from '../../../../apps/api/src/modules/infrastructure/infrastructure.module.js'

describe('ItemsRepository', () => {
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [InfrastructureModule] }).compile()
    const database = moduleRef.get(DatabaseService)
    database.db.delete(items).run()
    await moduleRef.close()
  })

  it('reads list and detail from real SQLite + Drizzle schema', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [InfrastructureModule],
      providers: [ItemsRepository],
    }).compile()

    const database = moduleRef.get(DatabaseService)
    const repository = moduleRef.get(ItemsRepository)

    database.db
      .insert(items)
      .values([
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
      .run()

    const page = repository.list({ currentPage: 1, pageSize: 1 })
    expect(page.totalRows).toBe(2)
    expect(page.list[0]?.title).toBe('Newest')
    expect(repository.findById('22222222-2222-4222-8222-222222222222')?.content).toBe('B content')

    await moduleRef.close()
  })
})
