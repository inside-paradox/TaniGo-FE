import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ordersApi } from '@/lib/api'
import type { CreatePesananDto, TableParams } from '@/types'

export const ORDERS_KEY = 'orders'

export function useOrders(params: TableParams & {
  status?: string; sumber?: string; pelangganId?: string; kasirId?: string
  tanggalDari?: string; tanggalSampai?: string; hasRetur?: boolean
}) {
  return useQuery({
    queryKey: [ORDERS_KEY, params],
    queryFn: () => ordersApi.getAll(params),
    placeholderData: (prev) => prev,
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: [ORDERS_KEY, id],
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePesananDto) => ordersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] })
      toast.success('Pesanan berhasil dibuat')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal membuat pesanan')
    },
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, catatan }: { id: string; status: string; catatan?: string }) =>
      ordersApi.updateStatus(id, status, catatan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] })
      toast.success('Status pesanan berhasil diperbarui')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status')
    },
  })
}
