import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deliveriesApi } from '@/lib/api'
import type { CreatePengirimanDto, BiayaPengiriman, SubmitChecklistPengirimanDto, TableParams } from '@/types'

export const DELIVERIES_KEY = 'deliveries'

export function useDeliveries(params: TableParams & {
  status?: string; driverId?: string; tanggalDari?: string; tanggalSampai?: string
}) {
  return useQuery({
    queryKey: [DELIVERIES_KEY, params],
    queryFn: () => deliveriesApi.getAll(params),
    placeholderData: (prev) => prev,
  })
}

export function useAvailableOrdersForDelivery(params?: { search?: string }) {
  return useQuery({
    queryKey: [DELIVERIES_KEY, 'available-orders', params],
    queryFn: () => deliveriesApi.getAvailableOrders(params),
  })
}

export function useDelivery(id: string) {
  return useQuery({
    queryKey: [DELIVERIES_KEY, id],
    queryFn: () => deliveriesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateDelivery() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePengirimanDto) => deliveriesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DELIVERIES_KEY] })
      toast.success('Jadwal pengiriman berhasil dibuat')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal membuat jadwal pengiriman')
    },
  })
}

export function useUpdateDeliveryStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, payload }: {
      id: string; status: string
      payload?: { alasanGagal?: string; catatanHasil?: string }
    }) => deliveriesApi.updateStatus(id, status, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DELIVERIES_KEY] })
      toast.success('Status pengiriman berhasil diperbarui')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status pengiriman')
    },
  })
}

export function useSubmitChecklistPengiriman() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SubmitChecklistPengirimanDto }) =>
      deliveriesApi.submitChecklist(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DELIVERIES_KEY] })
      toast.success('Checklist pengiriman berhasil disimpan')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan checklist')
    },
  })
}

export function useUpdateBiayaPengiriman() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, biaya }: { id: string; biaya: Omit<BiayaPengiriman, 'total'> }) =>
      deliveriesApi.updateBiaya(id, biaya),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DELIVERIES_KEY] })
      toast.success('Biaya pengiriman berhasil disimpan')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan biaya')
    },
  })
}
