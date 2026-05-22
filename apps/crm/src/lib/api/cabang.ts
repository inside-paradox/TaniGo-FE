import api from './axios'
import type { Cabang, CreateCabangDto, UpdateCabangDto, PaginatedResponse, TipeCabang } from '@/types'

export const cabangApi = {
  getAll: async (params?: { tipe?: TipeCabang; aktif?: boolean }): Promise<PaginatedResponse<Cabang>> => {
    const { data } = await api.get('/cabang', { params })
    return { data: data.data, meta: data.meta }
  },

  getById: async (id: string): Promise<Cabang> => {
    const { data } = await api.get(`/cabang/${id}`)
    return data.data
  },

  create: async (payload: CreateCabangDto): Promise<Cabang> => {
    const { data } = await api.post('/cabang', payload)
    return data.data
  },

  update: async (id: string, payload: UpdateCabangDto): Promise<Cabang> => {
    const { data } = await api.patch(`/cabang/${id}`, payload)
    return data.data
  },

  toggleAktif: async (id: string, aktif: boolean): Promise<Cabang> => {
    const { data } = await api.patch(`/cabang/${id}`, { aktif })
    return data.data
  },
}
