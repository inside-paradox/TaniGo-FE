'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { penyesuaianStokSchema, type PenyesuaianStokFormData } from '@/lib/validations/inventory'
import { usePenyesuaianStok } from '@/hooks/use-inventory'
import { useProducts } from '@/hooks/use-products'

const ALASAN_OPTIONS = [
  { value: 'Koreksi', label: 'Koreksi Stok' },
  { value: 'Rusak', label: 'Barang Rusak' },
  { value: 'Hilang', label: 'Barang Hilang' },
  { value: 'Sampel', label: 'Sampel / Tester' },
  { value: 'Lainnya', label: 'Lainnya' },
]

interface PenyesuaianStokModalProps {
  open: boolean
  onClose: () => void
  produkId?: string
}

export function PenyesuaianStokModal({ open, onClose, produkId }: PenyesuaianStokModalProps) {
  const mutation = usePenyesuaianStok()
  const { data: produkList } = useProducts({ page: 1, limit: 200 })

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<PenyesuaianStokFormData>({
    resolver: zodResolver(penyesuaianStokSchema),
    defaultValues: { jumlah: 0 },
  })

  const jumlah = watch('jumlah')

  useEffect(() => {
    if (open) {
      reset({ produkId: produkId ?? '', jumlah: 0 })
    }
  }, [open, produkId, reset])

  const onSubmit = async (values: PenyesuaianStokFormData) => {
    await mutation.mutateAsync(values)
    onClose()
  }

  const produkOptions =
    produkList?.data.map((p) => ({
      value: p.id,
      label: `${p.nama} (${p.sku}) — Stok: ${p.stok} ${p.satuan}`,
    })) ?? []

  const isPositive = jumlah > 0
  const isNegative = jumlah < 0

  return (
    <Modal open={open} onClose={onClose} title="Penyesuaian Stok Manual" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Pilih Produk */}
        <Controller
          control={control}
          name="produkId"
          render={({ field }) => (
            <Select
              label="Produk"
              required
              options={produkOptions}
              placeholder="Pilih produk..."
              error={errors.produkId?.message}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        {/* Jumlah Penyesuaian */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Jumlah Penyesuaian <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              placeholder="Contoh: +10 atau -5"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              {...register('jumlah', { valueAsNumber: true })}
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {isPositive && <TrendingUp className="h-4 w-4 text-green-500" />}
              {isNegative && <TrendingDown className="h-4 w-4 text-red-500" />}
            </div>
          </div>
          {errors.jumlah && (
            <p className="mt-1 text-xs text-red-500">{errors.jumlah.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Positif untuk menambah stok, negatif untuk mengurangi stok
          </p>
          {jumlah !== 0 && (
            <div
              className={`mt-2 rounded-lg px-3 py-2 text-sm font-medium ${
                isPositive
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {isPositive ? `Tambah ${jumlah} unit` : `Kurangi ${Math.abs(jumlah)} unit`}
            </div>
          )}
        </div>

        {/* Alasan */}
        <Controller
          control={control}
          name="alasan"
          render={({ field }) => (
            <Select
              label="Alasan Penyesuaian"
              required
              options={ALASAN_OPTIONS}
              placeholder="Pilih alasan..."
              error={errors.alasan?.message}
              value={field.value ?? ''}
              onChange={field.onChange}
            />
          )}
        />

        {/* Catatan */}
        <Textarea
          label="Catatan"
          placeholder="Tambahkan catatan jika diperlukan..."
          {...register('catatan')}
        />

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Batal
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Simpan Penyesuaian
          </Button>
        </div>
      </form>
    </Modal>
  )
}
