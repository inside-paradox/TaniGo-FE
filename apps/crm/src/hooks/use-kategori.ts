import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { settingsApi, type KategoriProdukSetting } from '@/lib/api'

export const KATEGORI_KEY = 'kategori-produk'

export function useKategoriProduk() {
  return useQuery({
    queryKey: [KATEGORI_KEY],
    queryFn: settingsApi.getKategori,
    staleTime: 5 * 60 * 1000, // 5 menit
  })
}

export function useCreateKategori() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<KategoriProdukSetting, 'id'>) => settingsApi.createKategori(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KATEGORI_KEY] })
      toast.success('Kategori berhasil ditambahkan')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menambahkan kategori')
    },
  })
}

export function useUpdateKategori() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<KategoriProdukSetting, 'id'>> }) =>
      settingsApi.updateKategori(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KATEGORI_KEY] })
      toast.success('Kategori berhasil diperbarui')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui kategori')
    },
  })
}

export function useDeleteKategori() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => settingsApi.deleteKategori(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KATEGORI_KEY] })
      toast.success('Kategori berhasil dihapus')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus kategori. Pastikan tidak ada produk yang menggunakan kategori ini.')
    },
  })
}
