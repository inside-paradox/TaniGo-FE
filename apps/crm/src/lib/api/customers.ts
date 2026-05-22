import api from './axios'
import type {
  PelangganVIP,
  TagihanVIP,
  CatatPembayaranDto,
  CreatePelangganVIPDto,
  PaginatedResponse,
  TableParams,
} from '@/types'

export const customersApi = {
  getAll: async (
    params: TableParams & { status?: string; statusKredit?: string }
  ): Promise<PaginatedResponse<PelangganVIP>> => {
    const { data } = await api.get('/customers/vip', { params })
    return { data: data.data, meta: data.meta }
  },

  getById: async (id: string): Promise<PelangganVIP> => {
    const { data } = await api.get(`/customers/vip/${id}`)
    return data.data
  },

  create: async (payload: CreatePelangganVIPDto): Promise<PelangganVIP> => {
    const { data } = await api.post('/customers/vip', payload)
    return data.data
  },

  update: async (id: string, payload: Partial<CreatePelangganVIPDto>): Promise<PelangganVIP> => {
    const { data } = await api.patch(`/customers/vip/${id}`, payload)
    return data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/vip/${id}`)
  },

  getTagihan: async (
    pelangganId: string,
    params: TableParams
  ): Promise<PaginatedResponse<TagihanVIP>> => {
    const { data } = await api.get(`/customers/vip/${pelangganId}/tagihan`, { params })
    return { data: data.data, meta: data.meta }
  },

  catatPembayaran: async (payload: CatatPembayaranDto): Promise<void> => {
    await api.post(`/customers/vip/${payload.customerId}/pembayaran`, payload)
  },

  getRiwayatTransaksi: async (pelangganId: string, params: TableParams) => {
    const { data } = await api.get(`/customers/vip/${pelangganId}/transaksi`, { params })
    return { data: data.data, meta: data.meta }
  },
}
