import api from './axios'
import type { PurchaseOrder, CreatePODto, PembayaranPO, PaginatedResponse, TableParams } from '@/types'

export const purchaseOrdersApi = {
  getAll: async (
    params: TableParams & { status?: string; supplierId?: string }
  ): Promise<PaginatedResponse<PurchaseOrder>> => {
    const { data } = await api.get('/purchase-orders', { params })
    return { data: data.data, meta: data.meta }
  },

  getById: async (id: string): Promise<PurchaseOrder> => {
    const { data } = await api.get(`/purchase-orders/${id}`)
    return data.data
  },

  create: async (payload: CreatePODto): Promise<PurchaseOrder> => {
    const { data } = await api.post('/purchase-orders', payload)
    return data.data
  },

  kirimKeSupplier: async (id: string): Promise<PurchaseOrder> => {
    const { data } = await api.post(`/purchase-orders/${id}/kirim`)
    return data.data
  },

  goodsReceipt: async (
    id: string,
    items: { itemId: string; qtyDiterima: number }[]
  ): Promise<PurchaseOrder> => {
    const { data } = await api.post(`/purchase-orders/${id}/goods-receipt`, { items })
    return data.data
  },

  batalkan: async (id: string, alasan: string): Promise<PurchaseOrder> => {
    const { data } = await api.post(`/purchase-orders/${id}/batalkan`, { alasan })
    return data.data
  },

  catatPembayaran: async (
    id: string,
    payload: Omit<PembayaranPO, 'id' | 'purchaseOrderId'>
  ): Promise<PembayaranPO> => {
    const { data } = await api.post(`/purchase-orders/${id}/pembayaran`, payload)
    return data.data
  },

  getPembayaran: async (id: string): Promise<PembayaranPO[]> => {
    const { data } = await api.get(`/purchase-orders/${id}/pembayaran`)
    return data.data
  },
}
