'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Search, RotateCcw, Check } from 'lucide-react'
import { formatRupiah, formatTanggalWaktu } from '@tanigo/utils'
import { fetchTransaksi, createRetur } from '@/lib/api/transactions'
import { returSchema, type ReturSearchValues } from '@/lib/validations/payment'
import type { Transaksi, ItemTransaksi, Retur } from '@/types/pos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'

interface SelectedItem {
  item: ItemTransaksi
  qtyRetur: number
}

export default function ReturPage() {
  const [transaksi, setTransaksi] = useState<Transaksi | null>(null)
  const [selected, setSelected] = useState<Record<string, SelectedItem>>({})
  const [metodeRefund, setMetodeRefund] = useState<'Tunai' | 'Kredit'>('Tunai')
  const [result, setResult] = useState<Retur | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReturSearchValues>({
    resolver: zodResolver(returSchema),
  })

  const { mutate: searchTransaksi, isPending: searching } = useMutation({
    mutationFn: (id: string) => fetchTransaksi(id),
    onSuccess: (data) => {
      setTransaksi(data)
      setSelected({})
      setResult(null)
    },
    onError: () => toast.error('Transaksi tidak ditemukan'),
  })

  const { mutate: doRetur, isPending: returning } = useMutation({
    mutationFn: () =>
      createRetur(transaksi!.id, {
        items: Object.values(selected)
          .filter((s) => s.qtyRetur > 0)
          .map((s) => ({
            itemTransaksiId: s.item.id,
            qty: s.qtyRetur,
          })),
        metodeRefund,
      }),
    onSuccess: (data) => {
      setResult(data)
      toast.success('Retur berhasil diproses')
    },
    onError: () => toast.error('Gagal memproses retur'),
  })

  const toggleItem = (item: ItemTransaksi) => {
    setSelected((prev) => {
      if (prev[item.id]) {
        const { [item.id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [item.id]: { item, qtyRetur: item.qty } }
    })
  }

  const updateQtyRetur = (itemId: string, qty: number) => {
    setSelected((prev) =>
      prev[itemId] ? { ...prev, [itemId]: { ...prev[itemId], qtyRetur: qty } } : prev
    )
  }

  const selectedItems = Object.values(selected).filter((s) => s.qtyRetur > 0)
  const totalRefund = selectedItems.reduce((s, i) => s + i.item.hargaSatuan * i.qtyRetur - (i.item.diskon / i.item.qty) * i.qtyRetur, 0)

  const onSearchSubmit = ({ nomorStruk }: ReturSearchValues) => searchTransaksi(nomorStruk)

  if (result) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Retur Berhasil</h2>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 text-sm text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">No. Retur</span>
              <span className="font-medium">{result.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Refund</span>
              <span className="font-bold text-green-700">{formatRupiah(result.totalRefund)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Metode Refund</span>
              <Badge variant={result.metodeRefund === 'Tunai' ? 'success' : 'info'}>
                {result.metodeRefund}
              </Badge>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              setResult(null)
              setTransaksi(null)
              setSelected({})
            }}
          >
            Retur Baru
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <RotateCcw size={20} className="text-gray-600" />
        <h1 className="text-xl font-bold text-gray-900">Retur & Pengembalian Dana</h1>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <form onSubmit={handleSubmit(onSearchSubmit)} className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Masukkan nomor struk / ID transaksi"
              error={errors.nomorStruk?.message}
              leftIcon={<Search size={16} />}
              {...register('nomorStruk')}
            />
          </div>
          <Button type="submit" loading={searching}>
            Cari
          </Button>
        </form>
      </div>

      {transaksi && (
        <>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">{transaksi.nomorStruk}</h2>
                <p className="text-sm text-gray-500">{formatTanggalWaktu(transaksi.createdAt)}</p>
              </div>
              <span className="text-sm font-bold text-green-700">{formatRupiah(transaksi.total)}</span>
            </div>

            <div className="space-y-2">
              {transaksi.items.map((item) => {
                const isSelected = !!selected[item.id]
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                      isSelected ? 'border-green-300 bg-green-50' : 'border-gray-100 hover:border-gray-200'
                    )}
                    onClick={() => toggleItem(item)}
                  >
                    <div className={cn(
                      'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors',
                      isSelected ? 'border-green-600 bg-green-600' : 'border-gray-300'
                    )}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.produkNama}</p>
                      <p className="text-xs text-gray-400">
                        {item.qty} {item.satuan} &times; {formatRupiah(item.hargaSatuan)}
                      </p>
                    </div>

                    {isSelected && (
                      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Qty retur:</span>
                        <input
                          type="number"
                          min="1"
                          max={item.qty}
                          value={selected[item.id]?.qtyRetur ?? 1}
                          onChange={(e) => updateQtyRetur(item.id, parseInt(e.target.value) || 1)}
                          className="w-14 rounded border border-gray-200 px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    )}

                    <span className="text-sm font-medium">{formatRupiah(item.subtotal)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 space-y-4">
              <h2 className="font-semibold text-gray-700">Konfirmasi Retur</h2>

              <div className="space-y-1 text-sm">
                {selectedItems.map((s) => (
                  <div key={s.item.id} className="flex justify-between text-gray-600">
                    <span>{s.item.produkNama} x{s.qtyRetur}</span>
                    <span>{formatRupiah(s.item.hargaSatuan * s.qtyRetur)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                  <span>Total Refund</span>
                  <span className="text-green-700">{formatRupiah(totalRefund)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                {(['Tunai', 'Kredit'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetodeRefund(m)}
                    className={cn(
                      'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                      metodeRefund === m
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => doRetur()}
                loading={returning}
              >
                Proses Retur
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
