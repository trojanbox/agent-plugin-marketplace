import {
  API_ERROR_CODE,
  type ItemDetailDto,
  type ItemListItemDto,
  type ItemListQuery,
} from '@repo/contracts'
import { Injectable } from '@nestjs/common'

import { ApplicationError } from '../../../errors/application-error.js'
import { ItemsRepository } from '../repositories/items.repository.js'

@Injectable()
export class ItemsService {
  constructor(private readonly repository: ItemsRepository) {}

  list(input: ItemListQuery): {
    list: ItemListItemDto[]
    page: { totalRows: number; currentPage: number; pageSize: number }
  } {
    const result = this.repository.list(input)
    return {
      list: result.list.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
      page: {
        totalRows: result.totalRows,
        currentPage: input.currentPage,
        pageSize: input.pageSize,
      },
    }
  }

  detail(itemId: string): ItemDetailDto {
    const item = this.repository.findById(itemId)
    if (!item) {
      throw new ApplicationError('not_found', API_ERROR_CODE.ItemNotFound, 'Item not found', {
        numericCode: 20001,
      })
    }
    return { ...item, createdAt: item.createdAt.toISOString() }
  }
}
