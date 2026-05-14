import type { POSInventoryItem } from '@/lib/demo/inventory'
import { api } from './axios'

export interface ProductSearchParams {
  search?: string
  cabangId?: string
  limit?: number
}

/**
 * Fetch branch inventory from the backend.
 * The API returns CabangInventory enriched with hargaJual (from the product catalog join).
 */
export async function fetchCabangInventory(cabangId: string): Promise<POSInventoryItem[]> {
  const { data } = await api.get<{ data: POSInventoryItem[] }>('/cabang-inventory', {
    params: { cabangId },
  })
  return data.data
}
