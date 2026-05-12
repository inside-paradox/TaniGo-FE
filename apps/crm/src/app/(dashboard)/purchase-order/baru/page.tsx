'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { Trash2, Plus, ArrowLeft, Package } from 'lucide-react'
import { PageHeader } from '@/components/shared'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Textarea,
  Select,
} from '@/components/ui'
import { InputNominal } from '@/components/ui/input-nominal'
import { useSuppliers } from '@/hooks/use-inventory'
import { useProducts } from '@/hooks/use-products'
import { useCreatePO } from '@/hooks/use-purchase-orders'
import { formatRupiah } from '@/lib/utils'
import type { CreatePODto } from '@/types'

interface ItemRow {
  _key: number
  produkId: string
  qtyPesan: number
  hargaBeli: number
}

interface FormValues {
  supplierId: string
  catatan: string
  estimasiTanggalTiba: string
  ongkosKirim: number
  biayaBongkarMuat: number
  upahKurir: number
  lainnya: number
  keteranganLainnya: string
}

let _rowCounter = 1

export default function BuatPOPage() {
  const router = useRouter()
  const { mutateAsync: createPO, isPending } = useCreatePO()

  const { data: suppliersData } = useSuppliers({ page: 1, limit: 100 })
  const { data: productsData } = useProducts({ page: 1, limit: 200 })

  const suppliers = suppliersData?.data ?? []
  const products = productsData?.data ?? []

  const [items, setItems] = useState<ItemRow[]>([
    { _key: 0, produkId: '', qtyPesan: 1, hargaBeli: 0 },
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const {
    register,
    handleSubmit,
    watch,
    control,
  } = useForm<FormValues>({
    defaultValues: {
      supplierId: '',
      catatan: '',
      estimasiTanggalTiba: '',
      ongkosKirim: 0,
      biayaBongkarMuat: 0,
      upahKurir: 0,
      lainnya: 0,
      keteranganLainnya: '',
    },
  })

  const watchedBiaya = watch(['ongkosKirim', 'biayaBongkarMuat', 'upahKurir', 'lainnya'])

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { _key: ++_rowCounter, produkId: '', qtyPesan: 1, hargaBeli: 0 },
    ])
  }, [])

  const removeItem = useCallback((key: number) => {
    setItems((prev) => prev.filter((r) => r._key !== key))
  }, [])

  const updateItem = useCallback(
    <K extends keyof Omit<ItemRow, '_key'>>(key: number, field: K, value: ItemRow[K]) => {
      setItems((prev) =>
        prev.map((r) => {
          if (r._key !== key) return r
          const updated = { ...r, [field]: value }
          // auto-fill hargaBeli when product is selected
          if (field === 'produkId') {
            const produk = products.find((p) => p.id === (value as string))
            if (produk) updated.hargaBeli = produk.hargaBeli
          }
          return updated
        })
      )
    },
    [products]
  )

  // ---- Kalkulasi ----
  const totalHargaBarang = items.reduce((acc, item) => acc + item.qtyPesan * item.hargaBeli, 0)
  const totalBiayaTambahan =
    Number(watchedBiaya[0] || 0) +
    Number(watchedBiaya[1] || 0) +
    Number(watchedBiaya[2] || 0) +
    Number(watchedBiaya[3] || 0)
  const totalKeseluruhan = totalHargaBarang + totalBiayaTambahan
  const totalQty = items.reduce((acc, item) => acc + item.qtyPesan, 0)
  const hppPerUnit = totalQty > 0 ? totalKeseluruhan / totalQty : 0

  // ---- Validasi & Submit ----
  const validate = (data: FormValues): boolean => {
    const errs: Record<string, string> = {}
    if (!data.supplierId) errs.supplierId = 'Supplier wajib dipilih'
    if (items.length === 0) errs.items = 'Minimal 1 item harus ditambahkan'
    items.forEach((item, idx) => {
      if (!item.produkId) errs[`item_${idx}_produk`] = 'Produk wajib dipilih'
      if (item.qtyPesan <= 0) errs[`item_${idx}_qty`] = 'Qty harus lebih dari 0'
      if (item.hargaBeli <= 0) errs[`item_${idx}_harga`] = 'Harga beli harus lebih dari 0'
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = handleSubmit(async (data) => {
    if (!validate(data)) return

    const payload: CreatePODto = {
      supplierId: data.supplierId,
      items: items.map((item) => ({
        produkId: item.produkId,
        qtyPesan: Number(item.qtyPesan),
        hargaBeli: Number(item.hargaBeli),
      })),
      biayaTambahan: {
        ongkosKirim: Number(data.ongkosKirim) || 0,
        biayaBongkarMuat: Number(data.biayaBongkarMuat) || 0,
        upahKurir: Number(data.upahKurir) || 0,
        lainnya: Number(data.lainnya) || 0,
        keteranganLainnya: data.keteranganLainnya || undefined,
      },
      catatan: data.catatan || undefined,
      estimasiTanggalTiba: data.estimasiTanggalTiba || undefined,
    }

    await createPO(payload)
    router.push('/purchase-order')
  })

  const watchLainnya = watch('lainnya')
  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.nama }))
  const productOptions = products.map((p) => ({
    value: p.id,
    label: `[${p.sku}] ${p.nama}`,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Purchase Order Baru"
        subtitle="Isi detail PO untuk dikirimkan ke supplier"
        actions={
          <Button variant="outline" onClick={() => router.push('/purchase-order')}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        }
      />

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ============ KOLOM KIRI (form utama) ============ */}
          <div className="space-y-6 lg:col-span-2">

            {/* Supplier & Info Umum */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Umum</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Select
                      label="Supplier"
                      required
                      placeholder="— Pilih Supplier —"
                      options={supplierOptions}
                      error={errors.supplierId}
                      {...register('supplierId')}
                    />
                  </div>
                  <Input
                    label="Estimasi Tanggal Tiba"
                    type="date"
                    {...register('estimasiTanggalTiba')}
                  />
                  <div className="sm:col-span-2">
                    <Textarea
                      label="Catatan"
                      placeholder="Catatan tambahan untuk PO ini (opsional)"
                      rows={3}
                      {...register('catatan')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daftar Item */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Daftar Item</CardTitle>
                  <Button type="button" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4" />
                    Tambah Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {errors.items && (
                  <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {errors.items}
                  </p>
                )}

                {/* Header tabel */}
                <div className="hidden grid-cols-12 gap-2 pb-2 text-xs font-medium uppercase text-gray-500 sm:grid">
                  <div className="col-span-5">Produk</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-3 text-right">Harga Beli</div>
                  <div className="col-span-1 text-right">Subtotal</div>
                  <div className="col-span-1" />
                </div>

                <div className="space-y-3 divide-y divide-gray-100">
                  {items.map((item, idx) => {
                    const subtotal = item.qtyPesan * item.hargaBeli
                    return (
                      <div
                        key={item._key}
                        className="pt-3 first:pt-0 sm:grid sm:grid-cols-12 sm:items-start sm:gap-2"
                      >
                        {/* Produk */}
                        <div className="col-span-5 mb-2 sm:mb-0">
                          <Select
                            placeholder="— Pilih Produk —"
                            options={productOptions}
                            value={item.produkId}
                            onChange={(e) => updateItem(item._key, 'produkId', e.target.value)}
                            error={errors[`item_${idx}_produk`]}
                          />
                        </div>

                        {/* Qty */}
                        <div className="col-span-2 mb-2 sm:mb-0">
                          <input
                            type="number"
                            min={1}
                            value={item.qtyPesan}
                            onChange={(e) =>
                              updateItem(item._key, 'qtyPesan', Number(e.target.value))
                            }
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-right text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="Qty"
                          />
                          {errors[`item_${idx}_qty`] && (
                            <p className="mt-1 text-xs text-red-500">{errors[`item_${idx}_qty`]}</p>
                          )}
                        </div>

                        {/* Harga Beli */}
                        <div className="col-span-3 mb-2 sm:mb-0">
                          <InputNominal
                            value={item.hargaBeli}
                            onChange={(v) => updateItem(item._key, 'hargaBeli', v)}
                            error={errors[`item_${idx}_harga`]}
                            placeholder="Harga Beli"
                          />
                        </div>

                        {/* Subtotal */}
                        <div className="col-span-1 flex items-center justify-end">
                          <span className="text-sm font-medium text-gray-700">
                            {formatRupiah(subtotal)}
                          </span>
                        </div>

                        {/* Hapus */}
                        <div className="col-span-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => removeItem(item._key)}
                            disabled={items.length === 1}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                            title="Hapus item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Total harga barang */}
                <div className="mt-4 border-t border-gray-200 pt-3 flex justify-end">
                  <div className="text-sm text-gray-600">
                    <span>Total Harga Barang: </span>
                    <span className="font-semibold text-gray-900">
                      {formatRupiah(totalHargaBarang)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Biaya Tambahan */}
            <Card>
              <CardHeader>
                <CardTitle>Biaya Tambahan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller name="ongkosKirim" control={control} render={({ field }) => (
                    <InputNominal label="Ongkos Kirim (Rp)" value={field.value ?? 0} onChange={field.onChange} />
                  )} />
                  <Controller name="biayaBongkarMuat" control={control} render={({ field }) => (
                    <InputNominal label="Biaya Bongkar Muat (Rp)" value={field.value ?? 0} onChange={field.onChange} />
                  )} />
                  <Controller name="upahKurir" control={control} render={({ field }) => (
                    <InputNominal label="Upah Kurir (Rp)" value={field.value ?? 0} onChange={field.onChange} />
                  )} />
                  <Controller name="lainnya" control={control} render={({ field }) => (
                    <InputNominal label="Biaya Lain-lain (Rp)" value={field.value ?? 0} onChange={field.onChange} />
                  )} />
                  {Number(watchLainnya) > 0 && (
                    <div className="sm:col-span-2">
                      <Input
                        label="Keterangan Biaya Lain-lain"
                        placeholder="Jelaskan biaya lain-lain..."
                        {...register('keteranganLainnya')}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ============ KOLOM KANAN (ringkasan) ============ */}
          <div className="space-y-4 lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  Ringkasan Kalkulasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <dt>Total Qty</dt>
                    <dd className="font-medium text-gray-900">{totalQty} unit</dd>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <dt>Total Harga Barang</dt>
                    <dd className="font-medium text-gray-900">{formatRupiah(totalHargaBarang)}</dd>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <dt>Total Biaya Tambahan</dt>
                    <dd className="font-medium text-gray-900">{formatRupiah(totalBiayaTambahan)}</dd>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between text-gray-800">
                    <dt className="font-semibold">Total Keseluruhan</dt>
                    <dd className="font-bold text-gray-900">{formatRupiah(totalKeseluruhan)}</dd>
                  </div>

                  {/* HPP per Unit — highlighted */}
                  <div className="mt-2 rounded-xl bg-green-50 border border-green-200 p-4">
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">
                      HPP per Unit
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatRupiah(hppPerUnit)}
                    </p>
                    <p className="mt-1 text-xs text-green-500">
                      Total Keseluruhan ÷ Total Qty
                    </p>
                  </div>
                </dl>

                {/* Tombol aksi */}
                <div className="mt-6 space-y-2">
                  <Button type="submit" className="w-full" loading={isPending}>
                    Simpan sebagai Draft
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/purchase-order')}
                    disabled={isPending}
                  >
                    Batal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
