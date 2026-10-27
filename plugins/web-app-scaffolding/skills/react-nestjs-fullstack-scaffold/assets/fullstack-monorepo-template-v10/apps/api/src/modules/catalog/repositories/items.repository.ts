import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, isNull } from 'drizzle-orm'

import { DatabaseService } from '../../infrastructure/database/database.service.js'
import { items } from '../../infrastructure/database/schema/index.js'

@Injectable()
export class ItemsRepository {
  constructor(private readonly database: DatabaseService) {}

  async list(input: { currentPage: number; pageSize: number }) {
    const offset = (input.currentPage - 1) * input.pageSize
    const active = isNull(items.deletedAt)
    const list = await this.database.db
      .select({
        id: items.id,
        title: items.title,
        summary: items.summary,
        createdAt: items.createdAt,
      })
      .from(items)
      .where(active)
      .orderBy(desc(items.createdAt), desc(items.id))
      .limit(input.pageSize)
      .offset(offset)

    const [summary] = await this.database.db.select({ total: count() }).from(items).where(active)
    return { list, totalRows: summary?.total ?? 0 }
  }

  async findById(itemId: string) {
    const [item] = await this.database.db
      .select({
        id: items.id,
        title: items.title,
        summary: items.summary,
        content: items.content,
        createdAt: items.createdAt,
      })
      .from(items)
      .where(and(eq(items.id, itemId), isNull(items.deletedAt)))
      .limit(1)
    return item
  }
}
