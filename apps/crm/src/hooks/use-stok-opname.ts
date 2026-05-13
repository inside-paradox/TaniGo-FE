import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { stokOpnameApi } from '@/lib/api'
import type { CreateStokOpnameDto, TableParams } from '@/types'

export const STOK_OPNAME_KEY = 'stok-opname'

export function useStokOpnameList(params: TableParams & { status?: string }) {
  return useQuery({
    queryKey: [STOK_OPNAME_KEY, params],
    queryFn: () => stokOpnameApi.getAll(params),
    placeholderData: (prev) => prev,
  })
}

export function useStokOpname(id: string) {
  return useQuery({
    queryKey: [STOK_OPNAME_KEY, id],
    queryFn: () => stokOpnameApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateStokOpname() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateStokOpnameDto) => stokOpnameApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STOK_OPNAME_KEY] })
      toast.success('Stok opname berhasil disimpan sebagai draft')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal membuat stok opname')
    },
  })
}

export function useSubmitStokOpname() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => stokOpnameApi.submit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STOK_OPNAME_KEY] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Stok opname diajukan. Stok telah diperbarui.')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal mengajukan stok opname')
    },
  })
}

export function useApproveStokOpname() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => stokOpnameApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STOK_OPNAME_KEY] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Stok opname disetujui. Stok cabang telah diperbarui.')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menyetujui stok opname')
    },
  })
}

export function useDeleteStokOpname() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => stokOpnameApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STOK_OPNAME_KEY] })
      toast.success('Draft stok opname dihapus')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus stok opname')
    },
  })
}
