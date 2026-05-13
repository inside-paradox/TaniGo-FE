import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cabangApi } from '@/lib/api'
import type { CreateCabangDto, UpdateCabangDto, TipeCabang } from '@/types'

export const CABANG_KEY = 'cabang'

export function useCabangList(params?: { tipe?: TipeCabang; aktif?: boolean }) {
  return useQuery({
    queryKey: [CABANG_KEY, params],
    queryFn: () => cabangApi.getAll(params),
    placeholderData: (prev) => prev,
  })
}

export function useCabang(id: string) {
  return useQuery({
    queryKey: [CABANG_KEY, id],
    queryFn: () => cabangApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateCabang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCabangDto) => cabangApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CABANG_KEY] })
      toast.success('Cabang berhasil dibuat')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal membuat cabang')
    },
  })
}

export function useUpdateCabang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCabangDto }) =>
      cabangApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CABANG_KEY] })
      toast.success('Cabang berhasil diperbarui')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui cabang')
    },
  })
}

export function useToggleAktifCabang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, aktif }: { id: string; aktif: boolean }) =>
      cabangApi.toggleAktif(id, aktif),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [CABANG_KEY] })
      toast.success(vars.aktif ? 'Cabang diaktifkan' : 'Cabang dinonaktifkan')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal mengubah status cabang')
    },
  })
}
