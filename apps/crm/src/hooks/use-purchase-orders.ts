import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { purchaseOrdersApi } from '@/lib/api'
import type { CreatePODto, TableParams } from '@/types'

export const PO_KEY = 'purchase-orders'

export function usePurchaseOrders(params: TableParams & { status?: string; supplierId?: string }) {
  return useQuery({
    queryKey: [PO_KEY, params],
    queryFn: () => purchaseOrdersApi.getAll(params),
    placeholderData: (prev) => prev,
  })
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: [PO_KEY, id],
    queryFn: () => purchaseOrdersApi.getById(id),
    enabled: !!id,
  })
}

export function usePembayaranPO(id: string) {
  return useQuery({
    queryKey: [PO_KEY, id, 'pembayaran'],
    queryFn: () => purchaseOrdersApi.getPembayaran(id),
    enabled: !!id,
  })
}

export function useCreatePO() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePODto) => purchaseOrdersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PO_KEY] })
      toast.success('Purchase Order berhasil dibuat')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal membuat Purchase Order')
    },
  })
}

export function useKirimPO() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.kirimKeSupplier(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PO_KEY] })
      toast.success('PO berhasil dikirim ke supplier')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal mengirim PO')
    },
  })
}

export function useGoodsReceipt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: { itemId: string; qtyDiterima: number }[] }) =>
      purchaseOrdersApi.goodsReceipt(id, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PO_KEY] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Penerimaan barang berhasil dicatat. Stok otomatis diperbarui.')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal mencatat penerimaan barang')
    },
  })
}

export function useBatalkanPO() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, alasan }: { id: string; alasan: string }) =>
      purchaseOrdersApi.batalkan(id, alasan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PO_KEY] })
      toast.success('PO berhasil dibatalkan')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal membatalkan PO')
    },
  })
}

export function useCatatPembayaranPO() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: { nominal: number; tanggal: string; metode: 'Transfer' | 'Tunai' | 'Cek'; catatan?: string }
    }) => purchaseOrdersApi.catatPembayaran(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PO_KEY] })
      toast.success('Pembayaran berhasil dicatat')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal mencatat pembayaran')
    },
  })
}
