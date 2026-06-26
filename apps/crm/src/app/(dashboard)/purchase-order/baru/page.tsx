'use client'

import { Suspense, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { Trash2, Plus, ArrowLeft, Package, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Textarea,
} from '@/components/ui'
import { Combobox } from '@/components/ui/combobox'
import { InputNominal } from '@/components/ui/input-nominal'
import { Skeleton } from '@/components/ui/skeleton'
import { useSuppliers } from '@/hooks/use-inventory'
import { useProducts } from '@/hooks/use-products'
import { useCreatePO, useUpdatePO, usePurchaseOrder } from '@/hooks/use-purchase-orders'
import { formatRupiah } from '@/lib/utils'
import type { CreatePODto, PurchaseOrder } from '@/types'

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

// ─── Form utama (create & edit draft) ────────────────────────────────────────
// State diinisialisasi dari prop `initialPO` (bukan via effect) agar bebas dari
// aturan lint setState-in-effect; pemanggil me-remount via `key` saat data siap.
function POForm({ initialPO }: { initialPO?: PurchaseOrder }) {
  const router = useRouter()
  const isEdit = !!initialPO
  const { mutateAsync: createPO, isPending: isCreating } = useCreatePO()
  const { mutateAsync: updatePO, isPending: isUpdating } = useUpdatePO()
  const isPending = isCreating || isUpdating

  const { data: suppliersData } = useSuppliers({ page: 1, limit: 100 })
  const { data: productsData } = useProducts({ page: 1, limit: 200 })

  const suppliers = suppliersData?.data ?? []
  const products = productsData?.data ?? []

  const [items, setItems] = useState<ItemRow[]>(() =>
    initialPO
      ? initialPO.items.map((it) => ({
          _key: ++_rowCounter,
          produkId: it.produkId,
          qtyPesan: it.qtyPesan,
          hargaBeli: it.hargaBeli,
        }))
      : [{ _key: 0, produkId: '', qtyPesan: 1, hargaBeli: 0 }]
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const {
    register,
    handleSubmit,
    watch,
    control,
  } = useForm<FormValues>({
    defaultValues: {
      supplierId: initialPO?.supplierId ?? '',
      catatan: initialPO?.catatan ?? '',
      estimasiTanggalTiba: initialPO?.estimasiTanggalTiba?.slice(0, 10) ?? '',
      ongkosKirim: initialPO?.biayaTambahan.ongkosKirim ?? 0,
      biayaBongkarMuat: initialPO?.biayaTambahan.biayaBongkarMuat ?? 0,
      upahKurir: initialPO?.biayaTambahan.upahKurir ?? 0,
      lainnya: initialPO?.biayaTambahan.lainnya ?? 0,
      keteranganLainnya: initialPO?.biayaTambahan.keteranganLainnya ?? '',
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

  // HPP per unit hanya akurat jika PO berisi 1 jenis item.
  // Jika >1 item, satu angka global menyebabkan subsidi silang antar SKU
  // (barang murah jadi overvalued, barang mahal jadi undervalued).
  // Solusi: distribusikan biaya tambahan (landed cost) secara proporsional
  // berdasarkan nilai item masing-masing.
  //   proportion_i   = (qty_i × hargaBeli_i) / totalHargaBarang
  //   hppPerUnit_i   = hargaBeli_i × (1 + totalBiayaTambahan / totalHargaBarang)
  const hppPerUnitSingle = totalQty > 0 ? totalKeseluruhan / totalQty : 0
  const hppPerUnitItems = items.map((item) => {
    if (totalHargaBarang === 0 || item.hargaBeli === 0) return 0
    return Math.round(item.hargaBeli * (1 + totalBiayaTambahan / totalHargaBarang))
  })

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

    if (isEdit && initialPO) {
      await updatePO({ id: initialPO.id, data: payload })
      router.push(`/purchase-order/${initialPO.id}`)
    } else {
      await createPO(payload)
      router.push('/purchase-order')
    }
  })

  const watchLainnya = watch('lainnya')
  const cancelHref = isEdit && initialPO ? `/purchase-order/${initialPO.id}` : '/purchase-order'

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit Draft Purchase Order' : 'Buat Purchase Order Baru'}
        subtitle={
          isEdit
            ? 'Ubah item & biaya draft. Nomor resmi tetap belum diterbitkan sampai dikirim ke supplier.'
            : 'Isi detail PO untuk dikirimkan ke supplier'
        }
        actions={
          <Button variant="outline" onClick={() => router.push(cancelHref)}>
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
                    <Controller
                      name="supplierId"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          label="Supplier"
                          required
                          placeholder="Cari supplier..."
                          options={suppliers}
                          value={field.value}
                          onChange={field.onChange}
                          getOptionValue={(s) => s.id}
                          getOptionLabel={(s) => s.nama}
                          error={errors.supplierId}
                        />
                      )}
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
                  <div className="col-span-3">Produk</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Harga Beli</div>
                  <div className="col-span-2 text-right">HPP/Unit</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                  <div className="col-span-1" />
                </div>

                <div className="space-y-3 divide-y divide-gray-100">
                  {items.map((item, idx) => {
                    const subtotal = item.qtyPesan * item.hargaBeli
                    const hpp = hppPerUnitItems[idx] ?? 0
                    return (
                      <div
                        key={item._key}
                        className="pt-3 first:pt-0 sm:grid sm:grid-cols-12 sm:items-start sm:gap-2"
                      >
                        {/* Produk */}
                        <div className="col-span-3 mb-2 sm:mb-0">
                          <Combobox
                            placeholder="Cari produk..."
                            options={products}
                            value={item.produkId}
                            onChange={(v) => updateItem(item._key, 'produkId', v)}
                            getOptionValue={(p) => p.id}
                            getOptionLabel={(p) => `[${p.sku}] ${p.nama}`}
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
                            onFocus={(e) => e.target.select()}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-right text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="Qty"
                          />
                          {errors[`item_${idx}_qty`] && (
                            <p className="mt-1 text-xs text-red-500">{errors[`item_${idx}_qty`]}</p>
                          )}
                        </div>

                        {/* Harga Beli */}
                        <div className="col-span-2 mb-2 sm:mb-0">
                          <InputNominal
                            value={item.hargaBeli}
                            onChange={(v) => updateItem(item._key, 'hargaBeli', v)}
                            error={errors[`item_${idx}_harga`]}
                            placeholder="Harga Beli"
                          />
                        </div>

                        {/* HPP/Unit (read-only, terkalkulasi otomatis) */}
                        <div className="col-span-2 mb-2 flex items-center justify-end sm:mb-0 sm:h-10">
                          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            {hpp > 0 ? formatRupiah(hpp) : '—'}
                          </span>
                        </div>

                        {/* Subtotal */}
                        <div className="col-span-2 flex items-center justify-end sm:h-10">
                          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
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

                  {/* HPP per Unit */}
                  {items.length === 1 ? (
                    // 1 jenis item — aman tampilkan satu angka global
                    <div className="mt-2 rounded-xl bg-green-50 border border-green-200 p-4">
                      <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">
                        HPP per Unit
                      </p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatRupiah(hppPerUnitSingle)}
                      </p>
                      <p className="mt-1 text-xs text-green-500">
                        Total Keseluruhan ÷ Total Qty
                      </p>
                    </div>
                  ) : (
                    // >1 jenis item — HPP global tidak akurat, tampilkan per item
                    <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 p-4">
                      <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">
                        HPP per Unit
                      </p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        PO berisi {items.length} jenis item. HPP per unit ditampilkan di kolom <strong>HPP/Unit</strong> masing-masing item (sudah termasuk alokasi biaya tambahan proporsional).
                      </p>
                    </div>
                  )}
                </dl>

                {/* Tombol aksi */}
                <div className="mt-6 space-y-2">
                  <Button type="submit" className="w-full" loading={isPending}>
                    {isEdit ? 'Simpan Perubahan' : 'Simpan sebagai Draft'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(cancelHref)}
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

// ─── Loader: ambil draft saat mode edit, lalu mount form dengan key ──────────
function BuatPOContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id') ?? ''
  const { data: po, isLoading } = usePurchaseOrder(editId)

  if (editId && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  // Hanya draft yang boleh diedit; selain itu kembalikan ke detail.
  if (editId && (!po || po.status !== 'Draft')) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-24 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">
          {po ? 'Hanya PO berstatus Draft yang dapat diedit' : 'Purchase Order tidak ditemukan'}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => router.push(editId ? `/purchase-order/${editId}` : '/purchase-order')}
        >
          Kembali
        </Button>
      </div>
    )
  }

  return <POForm key={editId || 'new'} initialPO={editId ? po : undefined} />
}

export default function BuatPOPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      }
    >
      <BuatPOContent />
    </Suspense>
  )
}
