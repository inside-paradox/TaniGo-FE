import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { notifikasiApi } from '@/lib/api'
import type { CreateNotifikasiDto } from '@/types'

export const NOTIFICATIONS_KEY = 'notifications'

export function useNotifications() {
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY],
    queryFn: () => notifikasiApi.getAll(),
    refetchInterval: 30000,
  })
}

export function useMarkAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notifikasiApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] })
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menandai notifikasi sebagai dibaca')
    },
  })
}

export function useMarkAllAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notifikasiApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] })
      toast.success('Semua notifikasi ditandai sebagai dibaca')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menandai semua notifikasi')
    },
  })
}

export function useCreateNotifikasi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateNotifikasiDto) => notifikasiApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] })
      toast.success('Notifikasi berhasil dikirim')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal membuat notifikasi')
    },
  })
}

export function useDeleteNotifikasi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notifikasiApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] })
      toast.success('Notifikasi dihapus')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus notifikasi')
    },
  })
}
