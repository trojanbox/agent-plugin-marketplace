import { Injectable } from '@nestjs/common'
import { count, desc, eq } from 'drizzle-orm'

import { DatabaseService } from '../../infrastructure/database/database.service.js'
import { items } from '../../infrastructure/database/schema/index.js'

@Injectable()
export class ItemsRepository {
  constructor(private readonly database: DatabaseService) {}

  list(input: { currentPage: number; pageSize: number }) {
    const offset = (input.currentPage - 1) * input.pageSize
    const list = this.database.db
      .select({
        id: items.id,
        title: items.title,
        summary: items.summary,
        createdAt: items.createdAt,
      })
      .from(items)
      .orderBy(desc(items.createdAt), desc(items.id))
      .limit(input.pageSize)
      .offset(offset)
      .all()

    const totalRows = this.database.db.select({ total: count() }).from(items).get()?.total ?? 0
    return { list, totalRows }
  }

  findById(itemId: string) {
    return this.database.db.select().from(items).where(eq(items.id, itemId)).limit(1).get()
  }
}
