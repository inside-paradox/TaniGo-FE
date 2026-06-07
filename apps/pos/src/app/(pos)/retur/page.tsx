'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import { Search, RotateCcw, CheckCircle, ChevronLeft } from 'lucide-react'
import { formatRupiah } from '@tanigo/utils'
import { fetchTransaksi, createRetur } from '@/lib/api/transactions'
import type { Transaksi, ItemTransaksi, CreateReturDto } from '@/types/pos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type MetodeRefund = 'Tunai' | 'Transfer'

interface SelectedItem {
  itemTransaksiId: string
  qty: number
  max: number
}

export default function ReturPage() {
  const [trxId, setTrxId] = useState('')
  const [transaksi, setTransaksi] = useState<Transaksi | null>(null)
  const [selected, setSelected] = useState<Record<string, SelectedItem>>({})
  const [metodeRefund, setMetodeRefund] = useState<MetodeRefund>('Tunai')
  const [step, setStep] = useState<'search' | 'select' | 'success'>('search')
  const [hasil, setHasil] = useState<{ totalRefund: number; nomorStruk: string } | null>(null)

  // Fetch transaction
  const { mutate: cariTransaksi, isPending: cariLoading } = useMutation({
    mutationFn: () => fetchTransaksi(trxId.trim()),
    onSuccess: (data) => {
      // Guard: must be a valid transaksi with an items array.
      // An API returning an empty object or missing items would otherwise
      // crash on render when we call .every()/.map() on items.
      if (!data || !Array.isArray(data.items)) {
        toast.error('Transaksi tidak ditemukan')
        return
      }
      setTransaksi(data)
      setSelected({})
      setStep('select')
    },
    onError: () => toast.error('Transaksi tidak ditemukan'),
  })

  // Submit retur
  const { mutate: submitRetur, isPending: submitLoading } = useMutation({
    mutationFn: (dto: CreateReturDto) => createRetur(transaksi!.id, dto),
    onSuccess: (data) => {
      setHasil({ totalRefund: data.totalRefund, nomorStruk: data.nomorStruk })
      setStep('success')
      toast.success('Retur berhasil diproses')
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && (!err.response || err.response.status >= 500)) {
        toast.error('Gagal memproses retur. Silakan periksa koneksi internet Anda atau coba beberapa saat lagi.')
        return
      }
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : null
      toast.error(msg ?? 'Gagal memproses retur.')
    },
  })

  const getReturableQty = (item: ItemTransaksi) =>
    item.qtyTersisa !== undefined ? item.qtyTersisa : item.qty

  const toggleItem = (item: ItemTransaksi) => {
    const maxQty = getReturableQty(item)
    if (maxQty <= 0) return // sudah habis diretur
    setSelected((prev) => {
      if (prev[item.id]) {
        const next = { ...prev }
        delete next[item.id]
        return next
      }
      return { ...prev, [item.id]: { itemTransaksiId: item.id, qty: maxQty, max: maxQty } }
    })
  }

  const setQty = (itemId: string, qty: number) => {
    setSelected((prev) => {
      if (!prev[itemId]) return prev
      return { ...prev, [itemId]: { ...prev[itemId], qty: Math.max(1, Math.min(qty, prev[itemId].max)) } }
    })
  }

  const selectedItems = Object.values(selected)
  const totalRefund = selectedItems.reduce((sum, s) => {
    const item = Array.isArray(transaksi?.items) ? transaksi.items.find((i) => i.id === s.itemTransaksiId) : undefined
    return sum + (item ? item.hargaSatuan * s.qty : 0)
  }, 0)

  const handleSubmit = () => {
    if (selectedItems.length === 0) {
      toast.error('Pilih minimal satu item untuk diretur')
      return
    }
    submitRetur({
      items: selectedItems.map((s) => ({ itemTransaksiId: s.itemTransaksiId, qty: s.qty })),
      metodeRefund,
    })
  }

  const handleReset = () => {
    setTrxId('')
    setTransaksi(null)
    setSelected({})
    setStep('search')
    setHasil(null)
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (step === 'success' && hasil) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Retur Berhasil</h2>
            <p className="mt-1 text-sm text-gray-500">Struk {hasil.nomorStruk}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Total Refund</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{formatRupiah(hasil.totalRefund)}</p>
            <p className="mt-1 text-xs text-gray-400">
              Dikembalikan via {metodeRefund}
            </p>
          </div>
          <Button className="w-full" onClick={handleReset}>
            <RotateCcw size={16} />
            Retur Lainnya
          </Button>
        </div>
      </div>
    )
  }

  // ── Item selection screen ────────────────────────────────────────────────────
  if (step === 'select' && transaksi) {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Pilih Item Retur</h1>
              <p className="text-xs text-gray-500">
                Struk {transaksi.nomorStruk} · {transaksi.kasirNama}
              </p>
            </div>
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-auto p-6 space-y-3">
          {(Array.isArray(transaksi.items) ? transaksi.items : []).every((i) => getReturableQty(i) <= 0) && (
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              <span className="mt-0.5 shrink-0 text-base">ℹ️</span>
              <span>Transaksi ini sudah dibatalkan atau dikembalikan sepenuhnya (Full Retur).</span>
            </div>
          )}
          {(Array.isArray(transaksi.items) ? transaksi.items : []).map((item) => {
            const sel = selected[item.id]
            const isSelected = !!sel
            const returableQty = getReturableQty(item)
            const sudahDiretur = returableQty <= 0
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 transition-colors ${
                  sudahDiretur
                    ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
                    : isSelected
                      ? 'cursor-pointer border-green-400 bg-green-50'
                      : 'cursor-pointer border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => toggleItem(item)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${sudahDiretur ? 'text-gray-400' : 'text-gray-900'}`}>
                        {item.produkNama}
                      </p>
                      {sudahDiretur && (
                        <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
                          Sudah Diretur
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.qty} {item.satuan} × {formatRupiah(item.hargaSatuan)}
                      {!sudahDiretur && returableQty < item.qty && (
                        <span className="ml-1 text-orange-500">· tersisa {returableQty}</span>
                      )}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ${sudahDiretur ? 'text-gray-400' : 'text-gray-900'}`}>
                    {formatRupiah(item.subtotal)}
                  </p>
                </div>

                {isSelected && (
                  <div
                    className="mt-3 flex items-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs text-gray-500">Qty retur:</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                        onClick={() => setQty(item.id, (sel.qty ?? 1) - 1)}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{sel.qty}</span>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                        onClick={() => setQty(item.id, (sel.qty ?? 1) + 1)}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">maks {returableQty}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-white p-6 space-y-4">
          {/* Metode refund */}
          <div className="flex gap-2">
            {(['Tunai', 'Transfer'] as MetodeRefund[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetodeRefund(m)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                  metodeRefund === m
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{selectedItems.length} item dipilih</span>
            <span className="font-semibold text-gray-900">Refund: {formatRupiah(totalRefund)}</span>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={selectedItems.length === 0}
            loading={submitLoading}
            onClick={handleSubmit}
          >
            <CheckCircle size={16} />
            Proses Retur
          </Button>
        </div>
      </div>
    )
  }

  // ── Search screen ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
            <RotateCcw className="h-7 w-7 text-orange-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Retur Transaksi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Masukkan ID transaksi yang tertera pada struk
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
          <Input
            label="ID Transaksi"
            placeholder="trx-..."
            value={trxId}
            onChange={(e) => setTrxId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && trxId.trim() && cariTransaksi()}
          />
          <Button
            className="w-full"
            size="lg"
            loading={cariLoading}
            disabled={!trxId.trim()}
            onClick={() => cariTransaksi()}
          >
            <Search size={16} />
            Cari Transaksi
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400">
          ID transaksi tertera di bagian bawah struk setelah &quot;ID:&quot;
        </p>
      </div>
    </div>
  )
}
