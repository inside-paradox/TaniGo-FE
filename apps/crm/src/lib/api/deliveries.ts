import api from './axios'
import type { Pengiriman, CreatePengirimanDto, BiayaPengiriman, PaginatedResponse, TableParams } from '@/types'

export const deliveriesApi = {
  getAll: async (
    params: TableParams & { status?: string; driverId?: string; tanggalDari?: string; tanggalSampai?: string }
  ): Promise<PaginatedResponse<Pengiriman>> => {
    const { data } = await api.get('/deliveries', { params })
    return data.data
  },

  getById: async (id: string): Promise<Pengiriman> => {
    const { data } = await api.get(`/deliveries/${id}`)
    return data.data
  },

  create: async (payload: CreatePengirimanDto): Promise<Pengiriman> => {
    const { data } = await api.post('/deliveries', payload)
    return data.data
  },

  updateStatus: async (
    id: string,
    status: string,
    payload?: { alasanGagal?: string; catatanHasil?: string }
  ): Promise<Pengiriman> => {
    const { data } = await api.patch(`/deliveries/${id}/status`, { status, ...payload })
    return data.data
  },

  updateBiaya: async (id: string, biaya: Omit<BiayaPengiriman, 'total'>): Promise<Pengiriman> => {
    const { data } = await api.patch(`/deliveries/${id}/biaya`, biaya)
    return data.data
  },

  uploadBukti: async (id: string, foto: File): Promise<Pengiriman> => {
    const formData = new FormData()
    formData.append('foto', foto)
    const { data } = await api.post(`/deliveries/${id}/bukti`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },
}
