import { redirect, type LoaderFunctionArgs } from 'react-router-dom'

import { ApiClientError } from '../../../infrastructure/http/api.client'
import { ItemService } from '../services/item.service'

export async function itemsLoader({ request }: LoaderFunctionArgs) {
  try {
    return { items: await ItemService.list({ signal: request.signal }) }
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) throw redirect('/login')
    throw error
  }
}
