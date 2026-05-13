import api from './axios'
import type {
  TransferStok,
  CreateTransferStokDto,
  ApproveTransferStokDto,
  TerimaTransferStokDto,
  PaginatedResponse,
  TableParams,
} from '@/types'

export const transferStokApi = {
  getAll: async (
    params: TableParams & { status?: string }
  ): Promise<PaginatedResponse<TransferStok>> => {
    const { data } = await api.get('/transfer-stok', { params })
    return data.data
  },

  getById: async (id: string): Promise<TransferStok> => {
    const { data } = await api.get(`/transfer-stok/${id}`)
    return data.data
  },

  create: async (payload: CreateTransferStokDto): Promise<TransferStok> => {
    const { data } = await api.post('/transfer-stok', payload)
    return data.data
  },

  approve: async (id: string, payload: ApproveTransferStokDto): Promise<TransferStok> => {
    const { data } = await api.patch(`/transfer-stok/${id}/approve`, payload)
    return data.data
  },

  tolak: async (id: string, catatan?: string): Promise<TransferStok> => {
    const { data } = await api.patch(`/transfer-stok/${id}/tolak`, { catatan })
    return data.data
  },

  kirim: async (id: string): Promise<TransferStok> => {
    const { data } = await api.patch(`/transfer-stok/${id}/kirim`)
    return data.data
  },

  terima: async (id: string, payload: TerimaTransferStokDto): Promise<TransferStok> => {
    const { data } = await api.patch(`/transfer-stok/${id}/terima`, payload)
    return data.data
  },
}
