import type { Produk, PaginatedResponse } from '@tanigo/types'
import { api } from './axios'

export interface ProductSearchParams {
  search?: string
  category?: string
  page?: number
  limit?: number
}

export async function fetchProducts(params: ProductSearchParams = {}): Promise<PaginatedResponse<Produk>> {
  const { data } = await api.get<{ data: PaginatedResponse<Produk> }>('/api/products', { params })
  return data.data
}

export async function fetchProduct(id: string): Promise<Produk> {
  const { data } = await api.get<{ data: Produk }>(`/api/products/${id}`)
  return data.data
}
