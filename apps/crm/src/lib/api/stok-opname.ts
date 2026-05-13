import api from './axios'
import type { StokOpname, CreateStokOpnameDto, PaginatedResponse, TableParams } from '@/types'

export const stokOpnameApi = {
  getAll: async (
    params: TableParams & { status?: string }
  ): Promise<PaginatedResponse<StokOpname>> => {
    const { data } = await api.get('/stok-opname', { params })
    return data.data
  },

  getById: async (id: string): Promise<StokOpname> => {
    const { data } = await api.get(`/stok-opname/${id}`)
    return data.data
  },

  create: async (payload: CreateStokOpnameDto): Promise<StokOpname> => {
    const { data } = await api.post('/stok-opname', payload)
    return data.data
  },

  submit: async (id: string): Promise<StokOpname> => {
    const { data } = await api.post(`/stok-opname/${id}/submit`)
    return data.data
  },

  approve: async (id: string): Promise<StokOpname> => {
    const { data } = await api.post(`/stok-opname/${id}/approve`)
    return data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/stok-opname/${id}`)
  },
}
