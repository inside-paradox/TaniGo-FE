import api from './axios'
import type { Pesanan, CreatePesananDto, PaginatedResponse, TableParams } from '@/types'

export const ordersApi = {
  getAll: async (
    params: TableParams & { status?: string; sumber?: string; pelangganId?: string; kasirId?: string; tanggalDari?: string; tanggalSampai?: string }
  ): Promise<PaginatedResponse<Pesanan>> => {
    const { data } = await api.get('/orders', { params })
    return { data: data.data, meta: data.meta }
  },

  getById: async (id: string): Promise<Pesanan> => {
    const { data } = await api.get(`/orders/${id}`)
    return data.data
  },

  create: async (payload: CreatePesananDto): Promise<Pesanan> => {
    const { data } = await api.post('/orders', payload)
    return data.data
  },

  updateStatus: async (id: string, status: string, catatan?: string): Promise<Pesanan> => {
    const { data } = await api.patch(`/orders/${id}/status`, { status, catatan })
    return data.data
  },

  cetakStruk: async (id: string): Promise<Blob> => {
    const { data } = await api.get(`/orders/${id}/struk`, { responseType: 'blob' })
    return data
  },

  cetakSuratJalan: async (id: string): Promise<Blob> => {
    const { data } = await api.get(`/orders/${id}/surat-jalan`, { responseType: 'blob' })
    return data
  },

  prosesRetur: async (
    id: string,
    payload: { items: { produkId: string; qty: number }[]; alasan: string }
  ): Promise<Pesanan> => {
    const { data } = await api.post(`/orders/${id}/retur`, payload)
    return data.data
  },
}
