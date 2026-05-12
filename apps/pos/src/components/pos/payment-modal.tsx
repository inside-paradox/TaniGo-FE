'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle, Printer, MessageCircle, Plus, X } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { InputNominal } from '@/components/ui/input-nominal'
import { formatRupiah } from '@tanigo/utils'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { createTransaksi } from '@/lib/api/transactions'
import { enqueueTransaction, getQueueCount } from '@/lib/db/idb'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useOfflineStore } from '@/store/offlineStore'
import type { MetodePembayaranPOS, PembayaranSplit, Transaksi } from '@/types/pos'
import { cn } from '@/lib/utils/cn'

const METODE_OPTIONS: MetodePembayaranPOS[] = ['Tunai', 'QRIS', 'Transfer Bank']

interface PaymentModalProps {
  open: boolean
  onClose: () => void
}

export function PaymentModal({ open, onClose }: PaymentModalProps) {
  const { items, total, subtotal, totalDiskon, clearCart } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const isOnline = useOnlineStatus()
  const setQueueCount = useOfflineStore((s) => s.setQueueCount)

  const totalBayar = total()
  const [payments, setPayments] = useState<PembayaranSplit[]>([{ metode: 'Tunai', nominal: 0 }])
  const [successData, setSuccessData] = useState<Transaksi | null>(null)

  useEffect(() => {
    if (open) {
      setPayments([{ metode: 'Tunai', nominal: totalBayar }])
      setSuccessData(null)
    }
  }, [open, totalBayar])

  const totalDibayar = payments.reduce((s, p) => s + (p.nominal || 0), 0)
  const sisa = totalBayar - totalDibayar
  const kembalian = payments.find((p) => p.metode === 'Tunai')
    ? Math.max(0, totalDibayar - totalBayar)
    : 0

  const addPayment = () => {
    const usedMetodes = payments.map((p) => p.metode)
    const next = METODE_OPTIONS.find((m) => !usedMetodes.includes(m))
    if (!next) return
    setPayments([...payments, { metode: next, nominal: 0 }])
  }

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index))
  }

  const updatePayment = (index: number, field: 'metode' | 'nominal', value: string | number) => {
    setPayments(
      payments.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  const dto = {
    items: items.map((i) => ({
      produkId: i.produkId,
      qty: i.qty,
      hargaSatuan: i.hargaSatuan,
      diskon: i.diskon,
    })),
    pembayaran: payments.filter((p) => p.nominal > 0),
  }

  const { mutate: processPayment, isPending } = useMutation({
    mutationFn: async () => {
      if (!isOnline) {
        await enqueueTransaction(dto)
        const count = await getQueueCount()
        setQueueCount(count)
        return null
      }
      return createTransaksi(dto)
    },
    onSuccess: (data) => {
      if (!data) {
        // Offline — queued successfully
        clearCart()
        toast.warning('Transaksi disimpan ke antrian. Akan dikirim saat online kembali.', { duration: 5000 })
        onClose()
        return
      }
      setSuccessData(data)
      clearCart()
      toast.success('Transaksi berhasil diproses!')
    },
    onError: () => {
      toast.error('Gagal memproses transaksi. Coba lagi.')
    },
  })

  const handleConfirm = () => {
    if (sisa > 0) {
      toast.error('Jumlah pembayaran kurang dari total tagihan')
      return
    }
    processPayment()
  }

  const handlePrint = () => {
    window.print()
  }

  const handleWhatsApp = () => {
    if (!successData) return
    const lines = [
      `*STRUK PEMBAYARAN - TaniGo*`,
      `No: ${successData.nomorStruk}`,
      `Kasir: ${user?.nama ?? '-'}`,
      ``,
      `*Item:*`,
      ...successData.items.map(
        (i) => `- ${i.produkNama} x${i.qty} ${i.satuan} = ${formatRupiah(i.subtotal)}`
      ),
      ``,
      `Subtotal: ${formatRupiah(successData.subtotal)}`,
      `Diskon: -${formatRupiah(successData.totalDiskon)}`,
      `*TOTAL: ${formatRupiah(successData.total)}*`,
      ``,
      ...successData.pembayaran.map((p) => `${p.metode}: ${formatRupiah(p.nominal)}`),
      successData.kembalian > 0 ? `Kembalian: ${formatRupiah(successData.kembalian)}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank')
  }

  const handleClose = () => {
    setSuccessData(null)
    onClose()
  }

  if (successData) {
    return (
      <Modal open={open} onClose={handleClose} title="Transaksi Berhasil" size="md">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-2 py-2">
            <CheckCircle className="text-green-500" size={48} />
            <p className="text-lg font-bold text-gray-900">Pembayaran Diterima</p>
            <p className="text-sm text-gray-500">No. Struk: {successData.nomorStruk}</p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
            {successData.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-gray-600">
                  {item.produkNama} x{item.qty}
                </span>
                <span className="font-medium">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatRupiah(successData.subtotal)}</span>
              </div>
              {successData.totalDiskon > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon</span>
                  <span>-{formatRupiah(successData.totalDiskon)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatRupiah(successData.total)}</span>
              </div>
            </div>
            <div className="border-t pt-2 mt-2 space-y-1">
              {successData.pembayaran.map((p, i) => (
                <div key={i} className="flex justify-between text-gray-500">
                  <span>{p.metode}</span>
                  <span>{formatRupiah(p.nominal)}</span>
                </div>
              ))}
              {successData.kembalian > 0 && (
                <div className="flex justify-between font-semibold text-green-700">
                  <span>Kembalian</span>
                  <span>{formatRupiah(successData.kembalian)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handlePrint}>
              <Printer size={16} />
              Cetak Struk
            </Button>
            <Button variant="secondary" className="flex-1" onClick={handleWhatsApp}>
              <MessageCircle size={16} />
              Kirim WA
            </Button>
          </div>

          <Button className="w-full" onClick={handleClose}>
            Transaksi Baru
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Proses Pembayaran" size="md">
      <div className="space-y-5">
        <div className="rounded-xl bg-green-50 p-4 text-center">
          <p className="text-sm text-gray-500">Total Tagihan</p>
          <p className="text-3xl font-bold text-green-700">{formatRupiah(totalBayar)}</p>
          {totalDiskon() > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              Termasuk diskon {formatRupiah(totalDiskon())}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Metode Pembayaran</p>
            {payments.length < METODE_OPTIONS.length && (
              <button
                onClick={addPayment}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
              >
                <Plus size={12} />
                Tambah Metode
              </button>
            )}
          </div>

          {payments.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select
                value={p.metode}
                onChange={(e) => updatePayment(i, 'metode', e.target.value as MetodePembayaranPOS)}
                className="w-36"
                options={METODE_OPTIONS.map((m) => ({
                  value: m,
                  label: m,
                }))}
              />
              <div className="flex-1">
                <InputNominal
                  value={p.nominal}
                  onChange={(v) => updatePayment(i, 'nominal', v)}
                  className="w-full"
                  prefix="Rp"
                />
              </div>
              {payments.length > 1 && (
                <button
                  onClick={() => removePayment(i)}
                  className="rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Total Dibayar</span>
            <span>{formatRupiah(totalDibayar)}</span>
          </div>
          {sisa > 0 ? (
            <div className="flex justify-between font-semibold text-red-600">
              <span>Kurang</span>
              <span>{formatRupiah(sisa)}</span>
            </div>
          ) : kembalian > 0 ? (
            <div className="flex justify-between font-semibold text-green-600">
              <span>Kembalian</span>
              <span>{formatRupiah(kembalian)}</span>
            </div>
          ) : null}
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleConfirm}
          loading={isPending}
          disabled={sisa > 0 || totalDibayar === 0}
        >
          Konfirmasi Pembayaran
        </Button>
      </div>
    </Modal>
  )
}
