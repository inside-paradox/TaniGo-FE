'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Search, Send } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCreateStokOpname, useSubmitStokOpname } from '@/hooks/use-stok-opname'
import { useProducts } from '@/hooks/use-products'
import { useCabangInventory } from '@/hooks/use-inventory'
import { useAuthStore } from '@/store/auth-store'
import type { Produk } from '@/types'

interface ItemRow {
  produk: Produk
  stokSistem: number
  stokFisik: string
}

function selisih(stokSistem: number, stokFisikStr: string) {
  const fisik = parseInt(stokFisikStr, 10)
  if (isNaN(fisik)) return null
  return fisik - stokSistem
}

function SelisihCell({ diff }: { diff: number | null }) {
  if (diff === null) return <span className="text-gray-300">—</span>
  if (diff === 0) return <span className="text-gray-400">0</span>
  return (
    <span className={`font-semibold ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
      {diff > 0 ? '+' : ''}{diff}
    </span>
  )
}

export default function StokOpnameBaruPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  // Lembar opname harus memuat SELURUH katalog — produk di luar `limit` tidak
  // muncul sebagai baris, jadi tidak pernah ikut dihitung & direkonsiliasi tanpa
  // peringatan apa pun. Stopgap sampai diganti fetch-all (loop halaman via meta.total).
  const { data: produkData, isLoading: produkLoading } = useProducts({ page: 1, limit: 300 })
  const { data: inventoryData, isLoading: inventoryLoading } = useCabangInventory(user?.cabangId ?? undefined)
  const produkList = produkData?.data ?? []

  const [rows, setRows] = useState<ItemRow[]>([])
  const [catatan, setCatatan] = useState('')
  const [search, setSearch] = useState('')

  const isLoading = produkLoading || inventoryLoading

  const inventoryMap = useMemo(() => {
    const map: Record<string, number> = {}
    inventoryData?.forEach((inv) => { map[inv.produkId] = inv.stok })
    return map
  }, [inventoryData])

  useEffect(() => {
    if (produkList.length > 0 && !inventoryLoading) {
      setRows(produkList.map((p) => ({
        produk: p,
        stokSistem: inventoryMap[p.id] ?? 0,
        stokFisik: '',
      })))
    }
  }, [produkList.length, inventoryData])

  const { mutateAsync: create, isPending: isCreating } = useCreateStokOpname()
  const { mutateAsync: submit, isPending: isSubmitting } = useSubmitStokOpname()

  const filledRows = useMemo(
    () => rows.filter((r) => r.stokFisik !== ''),
    [rows]
  )

  const visibleRows = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(
      (r) => r.produk.nama.toLowerCase().includes(q) || r.produk.sku.toLowerCase().includes(q) || r.produk.kategori.toLowerCase().includes(q)
    )
  }, [rows, search])

  const summary = useMemo(() => {
    let lebih = 0, kurang = 0, sesuai = 0
    filledRows.forEach((r) => {
      const d = selisih(r.stokSistem, r.stokFisik)
      if (d === null) return
      if (d > 0) lebih++
      else if (d < 0) kurang++
      else sesuai++
    })
    return { lebih, kurang, sesuai }
  }, [filledRows])

  const updateRow = (produkId: string, val: string) => {
    setRows((prev) => prev.map((r) => r.produk.id === produkId ? { ...r, stokFisik: val } : r))
  }

  const buildDto = () => ({
    items: filledRows.map((r) => ({
      produkId: r.produk.id,
      stokSistem: r.stokSistem,
      stokFisik: parseInt(r.stokFisik, 10),
    })),
    catatan: catatan || undefined,
  })

  const handleSaveDraft = async () => {
    if (filledRows.length === 0) return
    await create(buildDto())
    router.push('/stok-opname')
  }

  const handleSubmit = async () => {
    if (filledRows.length === 0) return
    const opname = await create(buildDto())
    await submit(opname.id)
    router.push('/stok-opname')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Stok Opname"
        subtitle="Input jumlah stok fisik aktual untuk setiap produk"
      />

      {/* Summary bar */}
      {filledRows.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm">
            <span className="text-gray-500">Dihitung: </span>
            <span className="font-semibold">{filledRows.length} produk</span>
          </div>
          {summary.kurang > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm">
              <span className="text-red-700 font-semibold">−{summary.kurang} kurang</span>
            </div>
          )}
          {summary.lebih > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm">
              <span className="text-green-700 font-semibold">+{summary.lebih} lebih</span>
            </div>
          )}
          {summary.sesuai > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm">
              <span className="text-gray-600">{summary.sesuai} sesuai</span>
            </div>
          )}
        </div>
      )}

      {/* Product table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Daftar Produk</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                Kosongkan kolom "Stok Fisik" untuk produk yang tidak dihitung.
              </p>
            </div>
            <div className="relative w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Cari nama, SKU, kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-gray-400">Memuat produk...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3 text-center">Stok Sistem</th>
                    <th className="px-4 py-3 text-center w-36">Stok Fisik</th>
                    <th className="px-4 py-3 text-center w-24">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {visibleRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                        Tidak ada produk yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                  {visibleRows.map((row) => {
                    const diff = selisih(row.stokSistem, row.stokFisik)
                    const hasValue = row.stokFisik !== ''
                    return (
                      <tr
                        key={row.produk.id}
                        className={`transition-colors ${hasValue ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{row.produk.nama}</p>
                          <p className="text-xs text-gray-400">{row.produk.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.produk.kategori}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-gray-700">{row.stokSistem}</span>
                          <span className="ml-1 text-xs text-gray-400">{row.produk.satuan}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            placeholder="—"
                            value={row.stokFisik}
                            onChange={(e) => updateRow(row.produk.id, e.target.value)}
                            className="text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <SelisihCell diff={diff} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Catatan */}
      <Card>
        <CardContent className="p-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Catatan (opsional)</label>
          <Textarea
            placeholder="Contoh: Opname awal setelah migrasi sistem..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => router.push('/stok-opname')}>
          <ArrowLeft className="h-4 w-4" />
          Batal
        </Button>
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          loading={isCreating}
          disabled={filledRows.length === 0 || isSubmitting}
        >
          <Save className="h-4 w-4" />
          Simpan Draft
        </Button>
        <Button
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={filledRows.length === 0 || isCreating}
        >
          <Send className="h-4 w-4" />
          Ajukan & Update Stok
        </Button>
      </div>
    </div>
  )
}
