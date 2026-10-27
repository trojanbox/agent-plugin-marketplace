import {
  itemIdSchema,
  itemListQuerySchema,
  type ItemDetailResponse,
  type ItemListQuery,
  type ItemListResponse,
} from '@repo/contracts'
import { Controller, Get, Param, Query } from '@nestjs/common'

import { success } from '../../../http/api-response.js'
import { ItemsService } from '../services/items.service.js'

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  list(@Query({ schema: itemListQuerySchema }) query: ItemListQuery): ItemListResponse {
    return success(this.itemsService.list(query))
  }

  @Get(':itemId')
  detail(@Param('itemId', { schema: itemIdSchema }) itemId: string): ItemDetailResponse {
    return success(this.itemsService.detail(itemId))
  }
}
