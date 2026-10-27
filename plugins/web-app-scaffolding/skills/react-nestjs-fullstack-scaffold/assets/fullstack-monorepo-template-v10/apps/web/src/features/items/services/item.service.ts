import type {
  ItemDetailDto,
  ItemDetailResponse,
  ItemListItemDto,
  ItemListResponse,
} from '@repo/contracts'

import { ApiClient } from '../../../infrastructure/http/api.client'

export class ItemService {
  protected constructor() {}

  static async list(options?: { signal?: AbortSignal }): Promise<ItemListItemDto[]> {
    const response = await ApiClient.get<ItemListResponse>(
      '/items?currentPage=1&pageSize=20',
      options,
    )
    return response.data.list
  }

  static async detail(itemId: string, options?: { signal?: AbortSignal }): Promise<ItemDetailDto> {
    const response = await ApiClient.get<ItemDetailResponse>(`/items/${itemId}`, options)
    return response.data
  }
}
