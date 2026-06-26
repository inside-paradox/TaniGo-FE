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
    return { data: data.data, meta: data.meta }
  },

  getById: async (id: string): Promise<TransferStok> => {
    const { data } = await api.get(`/transfer-stok/${id}`)
    return data.data
  },

  /**
   * Jumlah dokumen yang butuh perhatian user (badge sidebar), dihitung server-side
   * berdasarkan role. Mengembalikan `null` bila backend belum menyediakan endpoint
   * (mis. mode demo / belum dideploy) — pemanggil wajib fallback ke perhitungan klien.
   */
  getBadgeCount: async (): Promise<number | null> => {
    const { data } = await api.get('/transfer-stok/badge-count')
    const count = data?.data?.count
    return typeof count === 'number' ? count : null
  },

  /** Menandai semua dokumen actionable user sebagai sudah dibaca (best-effort). */
  acknowledge: async (): Promise<void> => {
    await api.post('/transfer-stok/acknowledge')
  },

  create: async (payload: CreateTransferStokDto): Promise<TransferStok> => {
    const { data } = await api.post('/transfer-stok', payload)
    return data.data
  },

  approve: async (id: string, payload: ApproveTransferStokDto): Promise<TransferStok> => {
    const mapped = {
      ...payload,
      items: payload.items.map((item) => ({ itemId: item.itemId, qtyDisetujui: item.qtyDisetujui })),
    }
    const { data } = await api.patch(`/transfer-stok/${id}/approve`, mapped)
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
    const mapped = {
      ...payload,
      items: payload.items.map((item) => ({
        itemId: item.itemId,
        qtyDiterima: item.qtyDiterima,
        statusPenerimaan: item.statusPenerimaan,
      })),
    }
    const { data } = await api.patch(`/transfer-stok/${id}/terima`, mapped)
    return data.data
  },
}
