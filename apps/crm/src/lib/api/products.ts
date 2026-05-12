import api from './axios'
import type { Produk, CreateProdukDto, UpdateProdukDto, PaginatedResponse, TableParams, ProdukFilter } from '@/types'

export const productsApi = {
  getAll: async (params: TableParams & ProdukFilter): Promise<PaginatedResponse<Produk>> => {
    const { data } = await api.get('/products', { params })
    return data.data
  },

  getById: async (id: string): Promise<Produk> => {
    const { data } = await api.get(`/products/${id}`)
    return data.data
  },

  create: async (payload: CreateProdukDto): Promise<Produk> => {
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (value instanceof File) {
          formData.append(key, value)
        } else {
          formData.append(key, String(value))
        }
      }
    })
    const { data } = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },

  update: async (id: string, payload: UpdateProdukDto): Promise<Produk> => {
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (value instanceof File) {
          formData.append(key, value)
        } else {
          formData.append(key, String(value))
        }
      }
    })
    const { data } = await api.patch(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`)
  },

  generateSku: async (): Promise<string> => {
    const { data } = await api.get('/products/generate-sku')
    return data.data.sku
  },
}
