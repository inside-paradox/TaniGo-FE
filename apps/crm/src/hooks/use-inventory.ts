import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { inventoryApi } from '@/lib/api'
import type { PenyesuaianStokDto, CreateSupplierDto, TableParams } from '@/types'

export const INVENTORY_KEY = 'inventory'
export const SUPPLIERS_KEY = 'suppliers'

export function useDashboardInventori() {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'dashboard'],
    queryFn: () => inventoryApi.getDashboard(),
  })
}

export function usePergerakanStok(
  params: TableParams & { produkId?: string; jenis?: string }
) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'pergerakan', params],
    queryFn: () => inventoryApi.getPergerakan(params),
    placeholderData: (prev) => prev,
  })
}

export function usePenyesuaianStok() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PenyesuaianStokDto) => inventoryApi.penyesuaianStok(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INVENTORY_KEY] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Stok berhasil disesuaikan')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menyesuaikan stok')
    },
  })
}

export function useSuppliers(params: TableParams) {
  return useQuery({
    queryKey: [SUPPLIERS_KEY, params],
    queryFn: () => inventoryApi.getSuppliers(params),
    placeholderData: (prev) => prev,
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSupplierDto) => inventoryApi.createSupplier(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] })
      toast.success('Supplier berhasil ditambahkan')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menambahkan supplier')
    },
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSupplierDto> }) =>
      inventoryApi.updateSupplier(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] })
      toast.success('Supplier berhasil diperbarui')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui supplier')
    },
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => inventoryApi.deleteSupplier(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] })
      toast.success('Supplier berhasil dihapus')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus supplier')
    },
  })
}
