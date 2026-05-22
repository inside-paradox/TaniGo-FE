'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { InputNominal } from '@/components/ui/input-nominal'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, RefreshCw, X } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { produkSchema, type ProdukFormData } from '@/lib/validations/product'
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products'
import { useKategoriProduk } from '@/hooks/use-kategori'
import { productsApi } from '@/lib/api'
import type { Produk } from '@/types'

const SATUAN_OPTIONS = [
  { value: 'pcs', label: 'pcs' },
  { value: 'kg', label: 'kg' },
  { value: 'liter', label: 'liter' },
  { value: 'karung', label: 'karung' },
  { value: 'gram', label: 'gram' },
  { value: 'ml', label: 'ml' },
  { value: 'custom', label: 'Lainnya (ketik manual)' },
]

interface ProdukFormProps {
  open: boolean
  onClose: () => void
  produk?: Produk | null
}

export function ProdukForm({ open, onClose, produk }: ProdukFormProps) {
  const isEdit = !!produk
  const [fotoPreview, setFotoPreview] = useState<string | null>(produk?.foto ?? null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [satuanCustom, setSatuanCustom] = useState(false)
  const [loadingSku, setLoadingSku] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const { data: kategoriList = [] } = useKategoriProduk()
  const kategoriOptions = kategoriList.map((k) => ({ value: k.id, label: k.nama }))

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProdukFormData>({
    resolver: zodResolver(produkSchema),
    defaultValues: {
      statusAktif: true,
      thresholdStok: 10,
      stok: 0,
      hargaBeli: 0,
      hargaJual: 0,
    },
  })

  const satuanValue = watch('satuan')

  // Populate form saat edit
  useEffect(() => {
    if (produk && open) {
      const isCustomSatuan = !SATUAN_OPTIONS.slice(0, -1).some(
        (opt) => opt.value === produk.satuan
      )
      setSatuanCustom(isCustomSatuan)
      reset({
        nama: produk.nama,
        sku: produk.sku,
        kategoriId: produk.kategoriId ?? '',
        satuan: isCustomSatuan ? 'custom' : produk.satuan,
        hargaBeli: produk.hargaBeli,
        hargaJual: produk.hargaJual,
        stok: produk.stok,
        tanggalKedaluwarsa: produk.tanggalKedaluwarsa ?? undefined,
        thresholdStok: produk.thresholdStok,
        statusAktif: produk.statusAktif,
      })
      setFotoPreview(produk.foto ?? null)
      setFotoFile(null)
    } else if (!open) {
      reset({
        statusAktif: true,
        thresholdStok: 10,
        stok: 0,
        hargaBeli: 0,
        hargaJual: 0,
      })
      setFotoPreview(null)
      setFotoFile(null)
      setSatuanCustom(false)
    }
  }, [produk, open, reset])

  // Auto custom satuan ketika dipilih
  useEffect(() => {
    if (satuanValue === 'custom') {
      setSatuanCustom(true)
      setValue('satuan', '')
    } else {
      setSatuanCustom(false)
    }
  }, [satuanValue, setValue])

  const handleGenerateSku = async () => {
    setLoadingSku(true)
    try {
      const sku = await productsApi.generateSku()
      setValue('sku', sku)
    } catch {
      // ignore
    } finally {
      setLoadingSku(false)
    }
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveFoto = () => {
    setFotoPreview(null)
    setFotoFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (values: ProdukFormData) => {
    const payload = {
      ...values,
      foto: fotoFile,
    }

    if (isEdit && produk) {
      await updateMutation.mutateAsync({ id: produk.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    onClose()
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Nama Produk */}
          <div className="sm:col-span-2">
            <Input
              label="Nama Produk"
              required
              placeholder="Contoh: Pupuk Urea 50kg"
              error={errors.nama?.message}
              {...register('nama')}
            />
          </div>

          {/* SKU */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              SKU
            </label>
            <div className="flex gap-2">
              <input
                placeholder="Kosongkan untuk auto-generate"
                className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                {...register('sku')}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Generate SKU otomatis"
                loading={loadingSku}
                onClick={handleGenerateSku}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Kategori */}
          <Controller
            control={control}
            name="kategoriId"
            render={({ field }) => (
              <Select
                label="Kategori"
                required
                options={kategoriOptions}
                placeholder="Pilih kategori"
                error={errors.kategoriId?.message}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />

          {/* Satuan */}
          <div>
            {!satuanCustom ? (
              <Controller
                control={control}
                name="satuan"
                render={({ field }) => (
                  <Select
                    label="Satuan Jual"
                    required
                    options={SATUAN_OPTIONS}
                    placeholder="Pilih satuan"
                    error={errors.satuan?.message}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
            ) : (
              <div>
                <Input
                  label="Satuan Jual (Custom)"
                  required
                  placeholder="Contoh: dus, botol, pack"
                  error={errors.satuan?.message}
                  {...register('satuan')}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSatuanCustom(false)
                    setValue('satuan', 'pcs')
                  }}
                  className="mt-1 text-xs text-green-600 hover:underline"
                >
                  Pilih dari daftar
                </button>
              </div>
            )}
          </div>

          {/* Harga Beli */}
          <Controller
            name="hargaBeli"
            control={control}
            render={({ field }) => (
              <InputNominal
                label="Harga Beli (Rp)"
                required
                value={field.value ?? 0}
                onChange={field.onChange}
                error={errors.hargaBeli?.message}
              />
            )}
          />

          {/* Harga Jual */}
          <Controller
            name="hargaJual"
            control={control}
            render={({ field }) => (
              <InputNominal
                label="Harga Jual (Rp)"
                required
                value={field.value ?? 0}
                onChange={field.onChange}
                error={errors.hargaJual?.message}
              />
            )}
          />

          {/* Stok Awal */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {isEdit ? 'Stok Saat Ini' : 'Stok Awal'} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              {...register('stok', { valueAsNumber: true })}
            />
            {errors.stok && (
              <p className="mt-1 text-xs text-red-500">{errors.stok.message}</p>
            )}
          </div>

          {/* Threshold Stok */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ambang Batas Stok Menipis <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="10"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              {...register('thresholdStok', { valueAsNumber: true })}
            />
            {errors.thresholdStok && (
              <p className="mt-1 text-xs text-red-500">{errors.thresholdStok.message}</p>
            )}
          </div>

          {/* Tanggal Kedaluwarsa */}
          <Input
            label="Tanggal Kedaluwarsa"
            type="date"
            helperText="Kosongkan jika tidak berlaku"
            error={errors.tanggalKedaluwarsa?.message}
            {...register('tanggalKedaluwarsa')}
          />

          {/* Status Aktif */}
          <div className="flex items-center gap-3 self-end pb-2">
            <Controller
              control={control}
              name="statusAktif"
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                    <div
                      className={`h-6 w-11 rounded-full transition-colors ${
                        field.value ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    />
                    <div
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        field.value ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Produk Aktif
                  </span>
                </label>
              )}
            />
          </div>
        </div>

        {/* Foto Produk */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Foto Produk</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFotoChange}
          />
          {fotoPreview ? (
            <div className="relative w-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fotoPreview}
                alt="Preview produk"
                className="h-32 w-32 rounded-xl border border-gray-200 object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveFoto}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-500"
            >
              <ImagePlus className="h-8 w-8" />
              <span className="text-xs">Upload foto</span>
            </button>
          )}
          {fotoPreview && !fotoFile && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs text-green-600 hover:underline"
            >
              Ganti foto
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button type="submit" loading={isLoading}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
