import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { transferStokApi } from '@/lib/api'
import type { CreateTransferStokDto, ApproveTransferStokDto, TerimaTransferStokDto, TableParams } from '@/types'

export const TRANSFER_STOK_KEY = 'transfer-stok'

export function useTransferStokList(params: TableParams & { status?: string }) {
  return useQuery({
    queryKey: [TRANSFER_STOK_KEY, params],
    queryFn: () => transferStokApi.getAll(params),
    placeholderData: (prev) => prev,
  })
}

export function useTransferStok(id: string) {
  return useQuery({
    queryKey: [TRANSFER_STOK_KEY, id],
    queryFn: () => transferStokApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateTransferStok() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTransferStokDto) => transferStokApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRANSFER_STOK_KEY] })
      toast.success('Permintaan stok berhasil dibuat')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal membuat permintaan stok')
    },
  })
}

export function useApproveTransferStok() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApproveTransferStokDto }) =>
      transferStokApi.approve(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRANSFER_STOK_KEY] })
      toast.success('Transfer stok disetujui')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menyetujui transfer')
    },
  })
}

export function useTolakTransferStok() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, catatan }: { id: string; catatan?: string }) =>
      transferStokApi.tolak(id, catatan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRANSFER_STOK_KEY] })
      toast.success('Transfer stok ditolak')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menolak transfer')
    },
  })
}

export function useKirimTransferStok() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transferStokApi.kirim(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRANSFER_STOK_KEY] })
      toast.success('Transfer stok dikirim')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal mengirim transfer')
    },
  })
}

export function useTerimaTransferStok() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TerimaTransferStokDto }) =>
      transferStokApi.terima(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRANSFER_STOK_KEY] })
      toast.success('Stok berhasil diterima')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal mengkonfirmasi penerimaan')
    },
  })
}
