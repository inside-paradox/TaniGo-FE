import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { customersApi } from '@/lib/api'
import type { CreatePelangganVIPDto, CatatPembayaranDto, TableParams } from '@/types'

export const CUSTOMERS_KEY = 'customers'

export function useRingkasanPiutang() {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, 'ringkasan'],
    queryFn: () => customersApi.getRingkasan(),
    staleTime: 30_000,
  })
}

export function usePelangganVIP(params: TableParams & { status?: string; statusKredit?: string; statusTagihan?: string }) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, params],
    queryFn: () => customersApi.getAll(params),
    placeholderData: (prev) => prev,
  })
}

export function usePelanggan(id: string) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, id],
    queryFn: () => customersApi.getById(id),
    enabled: !!id,
  })
}

export function useTagihanPelanggan(pelangganId: string, params: TableParams) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, pelangganId, 'tagihan', params],
    queryFn: () => customersApi.getTagihan(pelangganId, params),
    enabled: !!pelangganId,
    placeholderData: (prev) => prev,
  })
}

export function useCreatePelangganVIP() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePelangganVIPDto) => customersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
      toast.success('Pelanggan VIP berhasil ditambahkan')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menambahkan pelanggan')
    },
  })
}

export function useUpdatePelangganVIP() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePelangganVIPDto> }) =>
      customersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
      toast.success('Data pelanggan berhasil diperbarui')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui pelanggan')
    },
  })
}

export function useDeletePelangganVIP() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
      toast.success('Pelanggan berhasil dihapus')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus pelanggan')
    },
  })
}

export function useCatatPembayaranVIP() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CatatPembayaranDto) => customersApi.catatPembayaran(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
      toast.success('Pembayaran berhasil dicatat')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal mencatat pembayaran')
    },
  })
}
