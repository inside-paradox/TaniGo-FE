'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, ArrowLeft, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Combobox,
  Textarea,
} from '@/components/ui'
import { useCreateTransferStok } from '@/hooks/use-transfer-stok'
import { useProducts } from '@/hooks/use-products'
import type { Produk } from '@/types'

// Satuan umum produk pertanian
const SATUAN_OPTIONS = [
  'kg', 'gram', 'liter', 'ml', 'buah', 'pak', 'karung',
  'dus', 'botol', 'sachet', 'roll', 'lembar', 'set', 'unit',
]

// Mock gudang — ganti dengan API ketika endpoint tersedia
interface Gudang {
  id: string
  nama: string
  lokasi: string
}

const GUDANG_OPTIONS: Gudang[] = [
  { id: 'gudang-1', nama: 'Gudang Pusat', lokasi: 'Jakarta' },
  { id: 'gudang-2', nama: 'Gudang Utara', lokasi: 'Bogor' },
  { id: 'gudang-3', nama: 'Gudang Selatan', lokasi: 'Depok' },
]

interface ItemBaris {
  _key: number
  produkId: string
  produkNama: string
  produkSku: string
  satuan: string
  qtyDiminta: number
}

let _counter = 0

export default function BuatTransferStokPage() {
  const router = useRouter()
  const { mutateAsync: create, isPending } = useCreateTransferStok()
  const { data: produksData } = useProducts({ page: 1, limit: 200 })

  const produkList: Produk[] = useMemo(() => produksData?.data ?? [], [produksData])

  const [gudangId, setGudangId] = useState('')
  const [items, setItems] = useState<ItemBaris[]>([
    { _key: _counter++, produkId: '', produkNama: '', produkSku: '', satuan: '', qtyDiminta: 1 },
  ])
  const [catatan, setCatatan] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function addItem() {
    setItems((prev) => [
      ...prev,
      { _key: _counter++, produkId: '', produkNama: '', produkSku: '', satuan: '', qtyDiminta: 1 },
    ])
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((i) => i._key !== key))
  }

  function handlePilihProduk(key: number, produkId: string) {
    const produk = produkList.find((p) => p.id === produkId)
    setItems((prev) =>
      prev.map((i) =>
        i._key === key
          ? {
              ...i,
              produkId: produk?.id ?? '',
              produkNama: produk?.nama ?? '',
              produkSku: produk?.sku ?? '',
              satuan: produk?.satuan ?? '',
            }
          : i
      )
    )
  }

  function handleSatuan(key: number, satuan: string) {
    setItems((prev) => prev.map((i) => (i._key === key ? { ...i, satuan } : i)))
  }

  function handleQty(key: number, qty: number) {
    setItems((prev) =>
      prev.map((i) => (i._key === key ? { ...i, qtyDiminta: Math.max(1, qty) } : i))
    )
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!gudangId) errs.gudang = 'Pilih gudang tujuan'
    if (items.length === 0) errs.items = 'Minimal 1 item harus ditambahkan'
    items.forEach((item, idx) => {
      if (!item.produkId) errs[`item_${idx}_produk`] = 'Pilih produk'
      if (!item.satuan) errs[`item_${idx}_satuan`] = 'Pilih satuan'
      if (item.qtyDiminta < 1) errs[`item_${idx}_qty`] = 'Qty minimal 1'
    })
    const duplikat = items
      .map((i) => i.produkId)
      .filter((id, idx, arr) => id && arr.indexOf(id) !== idx)
    if (duplikat.length > 0) errs.items = 'Produk tidak boleh duplikat'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await create({
      gudangId,
      items: items.map((i) => ({ produkId: i.produkId, qtyDiminta: i.qtyDiminta, satuan: i.satuan })),
      catatan: catatan || undefined,
    })
    router.push('/transfer-stok')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Permintaan Stok"
        subtitle="Permintaan stok ke gudang akan diproses sebagai invoice"
        actions={
          <Button variant="outline" onClick={() => router.push('/transfer-stok')}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pilih Gudang */}
        <Card>
          <CardHeader><CardTitle>Gudang Tujuan</CardTitle></CardHeader>
          <CardContent>
            <Combobox<Gudang>
              options={GUDANG_OPTIONS}
              value={gudangId}
              onChange={setGudangId}
              getOptionValue={(g) => g.id}
              getOptionLabel={(g) => g.nama}
              filterFn={(g, q) =>
                g.nama.toLowerCase().includes(q.toLowerCase()) ||
                g.lokasi.toLowerCase().includes(q.toLowerCase())
              }
              renderOption={(g) => (
                <div className="flex items-center justify-between">
                  <span>{g.nama}</span>
                  <span className="text-xs text-gray-400">{g.lokasi}</span>
                </div>
              )}
              placeholder="Pilih gudang tujuan..."
              error={errors.gudang}
            />
          </CardContent>
        </Card>

        {/* Daftar Item */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daftar Item yang Diminta</CardTitle>
              <Button type="button" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" />
                Tambah Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {errors.items && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errors.items}
              </div>
            )}

            <div className="hidden grid-cols-12 gap-2 pb-2 text-xs font-medium uppercase text-gray-500 sm:grid">
              <div className="col-span-5">Produk</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-3">Satuan</div>
              <div className="col-span-2" />
            </div>

            <div className="space-y-3 divide-y divide-gray-100">
              {items.map((item, idx) => (
                <div
                  key={item._key}
                  className="grid grid-cols-12 items-start gap-2 pt-3 first:pt-0"
                >
                  {/* Produk */}
                  <div className="col-span-12 sm:col-span-5">
                    <Combobox<Produk>
                      options={produkList.filter((p) => p.statusAktif)}
                      value={item.produkId}
                      onChange={(id) => handlePilihProduk(item._key, id)}
                      getOptionValue={(p) => p.id}
                      getOptionLabel={(p) => p.nama}
                      filterFn={(p, q) =>
                        p.nama.toLowerCase().includes(q.toLowerCase()) ||
                        p.sku.toLowerCase().includes(q.toLowerCase())
                      }
                      renderOption={(p) => (
                        <div className="flex items-center justify-between">
                          <div>
                            <span>{p.nama}</span>
                            <span className="ml-2 text-xs text-gray-500">{p.sku}</span>
                          </div>
                          <span className="ml-4 shrink-0 text-xs text-gray-500">
                            Stok {p.stok} {p.satuan}
                          </span>
                        </div>
                      )}
                      placeholder="Cari produk..."
                      error={errors[`item_${idx}_produk`]}
                    />
                  </div>

                  {/* Qty */}
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      min={1}
                      value={item.qtyDiminta}
                      onChange={(e) => handleQty(item._key, Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-center text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    {errors[`item_${idx}_qty`] && (
                      <p className="mt-1 text-xs text-red-500">{errors[`item_${idx}_qty`]}</p>
                    )}
                  </div>

                  {/* Satuan */}
                  <div className="col-span-4 sm:col-span-3">
                    <select
                      value={item.satuan}
                      onChange={(e) => handleSatuan(item._key, e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="" disabled>Pilih satuan</option>
                      {SATUAN_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors[`item_${idx}_satuan`] && (
                      <p className="mt-1 text-xs text-red-500">{errors[`item_${idx}_satuan`]}</p>
                    )}
                  </div>

                  {/* Hapus */}
                  <div className="col-span-4 sm:col-span-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(item._key)}
                      disabled={items.length === 1}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Catatan (opsional)</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              placeholder="Catatan tambahan untuk gudang..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/transfer-stok')} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" loading={isPending}>
            Kirim Permintaan
          </Button>
        </div>
      </form>
    </div>
  )
}
