'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle, Printer, QrCode, Banknote, Building2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { InputNominal } from '@/components/ui/input-nominal'
import { formatRupiah } from '@tanigo/utils'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import axios from 'axios'
import { createTransaksi } from '@/lib/api/transactions'
import { enqueueTransaction, getQueueCount } from '@/lib/db/idb'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useOfflineStore } from '@/store/offlineStore'
import type { MetodePembayaranPOS, Transaksi } from '@/types/pos'
import { cn } from '@/lib/utils/cn'

type MetodePilihan = MetodePembayaranPOS

interface PaymentModalProps {
  open: boolean
  onClose: () => void
}

export function PaymentModal({ open, onClose }: PaymentModalProps) {
  const { items, total, totalDiskon, clearCart } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const isOnline = useOnlineStatus()
  const setQueueCount = useOfflineStore((s) => s.setQueueCount)

  const totalBayar = total()
  const [metode, setMetode] = useState<MetodePilihan>('Tunai')
  const [nominalTunai, setNominalTunai] = useState(0)
  const [successData, setSuccessData] = useState<Transaksi | null>(null)

  useEffect(() => {
    if (open) {
      setMetode('Tunai')
      setNominalTunai(total())
      setSuccessData(null)
      resetMutation()
    }
    // totalBayar sengaja tidak dimasukkan ke deps —
    // inisialisasi hanya dijalankan saat modal buka,
    // bukan saat cart berubah (clearCart setelah sukses akan reset successData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const kembalian = metode === 'Tunai' ? Math.max(0, nominalTunai - totalBayar) : 0
  const kurang = metode === 'Tunai' ? Math.max(0, totalBayar - nominalTunai) : 0

  const canConfirm =
    metode === 'QRIS' ||
    metode === 'Transfer Bank' ||
    (metode === 'Tunai' && nominalTunai >= totalBayar)

  const dto = {
    items: items.map((i) => ({
      produkId: i.produkId,
      qty: i.qty,
      hargaSatuan: i.hargaSatuan,
      diskon: i.diskon,
    })),
    pembayaran: [{ metode, nominal: metode === 'Tunai' ? nominalTunai : totalBayar }],
    sumber: 'pos' as const,
  }

  const queueTransaction = async () => {
    await enqueueTransaction(dto)
    const count = await getQueueCount()
    setQueueCount(count)
    return null
  }

  const { mutate: processPayment, isPending, reset: resetMutation } = useMutation({
    // 'always' is critical: with the default 'online' networkMode, React Query's
    // onlineManager pauses the mutation while offline (isPending stays true but the
    // mutationFn never runs). We handle offline ourselves by queueing to IndexedDB,
    // so the mutationFn must always execute regardless of React Query's online state.
    networkMode: 'always',
    mutationFn: async () => {
      // Use window global as source of truth — survives HMR and component remounts
      const offline = !isOnline || (typeof window !== 'undefined' && !window.__posOnline__)
      if (offline) return queueTransaction()

      try {
        return await createTransaksi(dto)
      } catch (err) {
        // No response object = network unreachable (backend down, no internet, etc.)
        // Queue the transaction so it syncs when connectivity returns.
        if (axios.isAxiosError(err) && !err.response) return queueTransaction()
        throw err // server returned an error (4xx/5xx) — propagate normally
      }
    },
    onSuccess: (data) => {
      if (!data) {
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
    if (!canConfirm) {
      toast.error('Jumlah pembayaran kurang dari total tagihan')
      return
    }
    processPayment()
  }

  const handlePrint = () => {
    window.print()
  }

  const handleClose = () => {
    setSuccessData(null)
    onClose()
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (successData) {
    return (
      <Modal open={open} onClose={handleClose} title="Transaksi Berhasil" size="md">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-2 py-2">
            <CheckCircle className="text-green-500" size={48} />
            <p className="text-lg font-bold text-gray-900">Pembayaran Diterima</p>
            <p className="text-sm text-gray-500">No. Struk: {successData.nomorStruk}</p>
            <p className="text-xs text-gray-400">ID: {successData.id}</p>
            <p className="text-xs text-gray-400">Kasir: {user?.nama ?? '-'}</p>
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

          <Button variant="outline" className="w-full" onClick={handlePrint}>
            <Printer size={16} />
            Cetak Struk
          </Button>

          <Button className="w-full" onClick={handleClose}>
            Transaksi Baru
          </Button>
        </div>
      </Modal>
    )
  }

  // ── Payment form ────────────────────────────────────────────────────────────
  return (
    <Modal open={open} onClose={onClose} title="Proses Pembayaran" size="md">
      <div className="space-y-5">
        {/* Total */}
        <div className="rounded-xl bg-green-50 p-4 text-center">
          <p className="text-sm text-gray-500">Total Tagihan</p>
          <p className="text-3xl font-bold text-green-700">{formatRupiah(totalBayar)}</p>
          {totalDiskon() > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              Termasuk diskon {formatRupiah(totalDiskon())}
            </p>
          )}
        </div>

        {/* Method selector */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { metode: 'Tunai',         icon: <Banknote size={22} />,   label: 'Tunai' },
            { metode: 'QRIS',          icon: <QrCode size={22} />,     label: 'QRIS' },
            { metode: 'Transfer Bank', icon: <Building2 size={22} />,  label: 'Transfer' },
          ] as { metode: MetodePilihan; icon: React.ReactNode; label: string }[]).map((m) => (
            <button
              key={m.metode}
              onClick={() => setMetode(m.metode)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors',
                metode === m.metode
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              )}
            >
              {m.icon}
              <span className="text-sm font-semibold">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Tunai: cash input + change */}
        {metode === 'Tunai' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uang yang Diterima
              </label>
              <InputNominal
                value={nominalTunai}
                onChange={setNominalTunai}
                className="w-full"
                prefix="Rp"
              />
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2 flex-wrap">
              {[totalBayar, 5000, 10000, 20000, 50000, 100000].reduce<number[]>((acc, v) => {
                const rounded = v === totalBayar ? totalBayar : Math.ceil(totalBayar / v) * v
                if (!acc.includes(rounded) && rounded >= totalBayar) acc.push(rounded)
                return acc
              }, []).slice(0, 4).map((amt) => (
                <button
                  key={amt}
                  onClick={() => setNominalTunai(amt)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                    nominalTunai === amt
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>

            <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Uang Diterima</span>
                <span>{formatRupiah(nominalTunai)}</span>
              </div>
              {kurang > 0 ? (
                <div className="flex justify-between font-semibold text-red-600">
                  <span>Kurang</span>
                  <span>{formatRupiah(kurang)}</span>
                </div>
              ) : (
                <div className="flex justify-between font-semibold text-green-600">
                  <span>Kembalian</span>
                  <span>{formatRupiah(kembalian)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QRIS: static QR display */}
        {metode === 'QRIS' && (
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 p-6">
            <QrCode size={80} className="text-gray-300" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">Scan QRIS untuk Bayar</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Total: {formatRupiah(totalBayar)}
              </p>
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 text-center">
              Konfirmasi pembayaran setelah pelanggan menyelesaikan transaksi QRIS
            </p>
          </div>
        )}

        {/* Transfer Bank */}
        {metode === 'Transfer Bank' && (
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 p-6">
            <Building2 size={56} className="text-gray-300" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">Transfer Bank</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatRupiah(totalBayar)}</p>
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 text-center">
              Konfirmasi setelah bukti transfer diterima dari pelanggan
            </p>
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleConfirm}
          loading={isPending}
          disabled={!canConfirm}
        >
          {metode === 'QRIS'
            ? 'Konfirmasi Pembayaran QRIS'
            : metode === 'Transfer Bank'
              ? 'Konfirmasi Transfer Bank'
              : 'Konfirmasi Pembayaran'}
        </Button>
      </div>
    </Modal>
  )
}
