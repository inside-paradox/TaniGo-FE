'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Package, Ban, CreditCard, AlertCircle, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Modal,
  ConfirmModal,
  Input,
  Select,
} from '@/components/ui'
import { InputNominal } from '@/components/ui/input-nominal'
import { Skeleton } from '@/components/ui/skeleton'
import {
  usePurchaseOrder,
  usePembayaranPO,
  useKirimPO,
  useGoodsReceipt,
  useBatalkanPO,
  useCatatPembayaranPO,
} from '@/hooks/use-purchase-orders'
import { formatRupiah, formatTanggal, formatTanggalWaktu } from '@/lib/utils'
import type { StatusPO, StatusPembayaranPO, ItemPO } from '@/types'

// -------- Badge helpers --------

function StatusPOBadge({ status }: { status: StatusPO }) {
  const map: Record<StatusPO, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
    Draft: { label: 'Draft', variant: 'default' },
    'Dikirim ke Supplier': { label: 'Dikirim ke Supplier', variant: 'info' },
    'Sebagian Diterima': { label: 'Sebagian Diterima', variant: 'warning' },
    Diterima: { label: 'Diterima', variant: 'success' },
    Dibatalkan: { label: 'Dibatalkan', variant: 'danger' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

function StatusPembayaranBadge({ status }: { status: StatusPembayaranPO }) {
  const map: Record<StatusPembayaranPO, { variant: 'success' | 'warning' | 'danger' }> = {
    Lunas: { variant: 'success' },
    Sebagian: { variant: 'warning' },
    'Belum Bayar': { variant: 'danger' },
  }
  return <Badge variant={map[status].variant}>{status}</Badge>
}

// -------- Loading skeleton --------

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded-lg bg-gray-200 animate-pulse" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// -------- Goods Receipt Modal --------

interface GoodsReceiptModalProps {
  open: boolean
  onClose: () => void
  items: ItemPO[]
  poId: string
}

function GoodsReceiptModal({ open, onClose, items, poId }: GoodsReceiptModalProps) {
  const { mutateAsync: goodsReceipt, isPending } = useGoodsReceipt()
  const pendingItems = items.filter((i) => i.qtyDiterima < i.qtyPesan)

  const [qtys, setQtys] = useState<Record<string, number>>(() =>
    Object.fromEntries(pendingItems.map((i) => [i.id, 0]))
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async () => {
    const errs: Record<string, string> = {}
    pendingItems.forEach((item) => {
      const max = item.qtyPesan - item.qtyDiterima
      const val = qtys[item.id] ?? 0
      if (val < 0) errs[item.id] = 'Tidak boleh negatif'
      if (val > max) errs[item.id] = `Maksimal ${max} unit`
    })
    const totalDiterima = Object.values(qtys).reduce((a, b) => a + (b || 0), 0)
    if (totalDiterima === 0) errs._global = 'Masukkan minimal 1 item yang diterima'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    await goodsReceipt({
      id: poId,
      items: pendingItems
        .filter((item) => (qtys[item.id] ?? 0) > 0)
        .map((item) => ({ itemId: item.id, qtyDiterima: qtys[item.id] })),
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Penerimaan Barang (Goods Receipt)" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Masukkan jumlah barang yang diterima untuk setiap item. Stok akan otomatis diperbarui.
        </p>

        {errors._global && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {errors._global}
          </div>
        )}

        {pendingItems.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Semua item sudah diterima penuh.</p>
        ) : (
          <div className="space-y-3">
            {/* Header */}
            <div className="hidden grid-cols-12 gap-2 text-xs font-medium uppercase text-gray-400 sm:grid">
              <div className="col-span-5">Produk</div>
              <div className="col-span-2 text-right">Dipesan</div>
              <div className="col-span-2 text-right">Sudah Diterima</div>
              <div className="col-span-3 text-right">Terima Sekarang</div>
            </div>

            {pendingItems.map((item) => {
              const sisa = item.qtyPesan - item.qtyDiterima
              return (
                <div
                  key={item.id}
                  className="sm:grid sm:grid-cols-12 sm:items-center sm:gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:p-0 sm:bg-transparent sm:border-0 sm:rounded-none sm:border-b sm:border-b-gray-100 sm:pb-3"
                >
                  <div className="col-span-5 mb-2 sm:mb-0">
                    <p className="text-sm font-medium text-gray-900">{item.produkNama}</p>
                    <p className="text-xs text-gray-400">{item.produkSku}</p>
                  </div>
                  <div className="col-span-2 text-right text-sm text-gray-600">{item.qtyPesan}</div>
                  <div className="col-span-2 text-right text-sm text-gray-600">{item.qtyDiterima}</div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min={0}
                      max={sisa}
                      value={qtys[item.id] ?? 0}
                      onChange={(e) =>
                        setQtys((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                      }
                      onFocus={(e) => e.target.select()}
                      className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-right text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder={`maks. ${sisa}`}
                    />
                    {errors[item.id] && (
                      <p className="mt-1 text-xs text-red-500">{errors[item.id]}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} loading={isPending} disabled={pendingItems.length === 0}>
            Simpan Penerimaan
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// -------- Batalkan Modal --------

interface BatalkanModalProps {
  open: boolean
  onClose: () => void
  poId: string
}

function BatalkanModal({ open, onClose, poId }: BatalkanModalProps) {
  const { mutateAsync: batalkan, isPending } = useBatalkanPO()
  const [alasan, setAlasan] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!alasan.trim()) {
      setError('Alasan pembatalan wajib diisi')
      return
    }
    setError('')
    await batalkan({ id: poId, alasan })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Batalkan Purchase Order" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Tindakan ini tidak dapat diurungkan. PO yang dibatalkan tidak bisa diaktifkan kembali.
        </p>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Alasan Pembatalan <span className="text-red-500">*</span>
          </label>
          <textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            rows={3}
            placeholder="Tuliskan alasan pembatalan..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Tutup
          </Button>
          <Button variant="destructive" onClick={handleSubmit} loading={isPending}>
            Batalkan PO
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// -------- Catat Pembayaran Modal --------

interface CatatPembayaranModalProps {
  open: boolean
  onClose: () => void
  poId: string
  sisaHutang: number
}

function CatatPembayaranModal({ open, onClose, poId, sisaHutang }: CatatPembayaranModalProps) {
  const { mutateAsync: catatPembayaran, isPending } = useCatatPembayaranPO()
  const today = new Date().toISOString().split('T')[0]

  const [nominal, setNominal] = useState(0)
  const [tanggal, setTanggal] = useState(today)
  const [metode, setMetode] = useState<'Transfer' | 'Tunai' | 'Cek'>('Transfer')
  const [catatan, setCatatan] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!nominal || nominal <= 0) errs.nominal = 'Nominal harus lebih dari 0'
    if (nominal > sisaHutang) errs.nominal = `Nominal melebihi sisa hutang (${formatRupiah(sisaHutang)})`
    if (!tanggal) errs.tanggal = 'Tanggal wajib diisi'
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    await catatPembayaran({
      id: poId,
      payload: {
        nominal,
        tanggal,
        metode,
        catatan: catatan || undefined,
      },
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Catat Pembayaran" size="md">
      <div className="space-y-4">
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm">
          <span className="text-yellow-700">Sisa hutang: </span>
          <span className="font-bold text-yellow-800">{formatRupiah(sisaHutang)}</span>
        </div>

        <InputNominal
          label="Nominal"
          required
          value={nominal}
          onChange={setNominal}
          placeholder={`Maks. ${formatRupiah(sisaHutang)}`}
          error={errors.nominal}
        />

        <Input
          label="Tanggal Pembayaran"
          type="date"
          required
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          error={errors.tanggal}
        />

        <Select
          label="Metode Pembayaran"
          required
          value={metode}
          onChange={(e) => setMetode(e.target.value as 'Transfer' | 'Tunai' | 'Cek')}
          options={[
            { value: 'Transfer', label: 'Transfer Bank' },
            { value: 'Tunai', label: 'Tunai (Cash)' },
            { value: 'Cek', label: 'Cek / Giro' },
          ]}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Catatan (opsional)</label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={2}
            placeholder="Nomor referensi, keterangan, dll."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} loading={isPending}>
            Simpan Pembayaran
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ========================
// HALAMAN UTAMA
// ========================

export default function DetailPOPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: po, isLoading: poLoading } = usePurchaseOrder(id)
  const { data: pembayaranList, isLoading: pembayaranLoading } = usePembayaranPO(id)
  const { mutateAsync: kirimPO, isPending: kirimPending } = useKirimPO()

  const [showKirimConfirm, setShowKirimConfirm] = useState(false)
  const [showGoodsReceipt, setShowGoodsReceipt] = useState(false)
  const [showBatalkan, setShowBatalkan] = useState(false)
  const [showCatatPembayaran, setShowCatatPembayaran] = useState(false)

  if (poLoading) return <DetailSkeleton />

  if (!po) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Purchase Order tidak ditemukan</h2>
        <p className="mt-1 text-sm text-gray-400">PO yang Anda cari mungkin sudah dihapus.</p>
        <Button variant="outline" className="mt-6" onClick={() => router.push('/purchase-order')}>
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar PO
        </Button>
      </div>
    )
  }

  const canEdit = po.status === 'Draft'
  const canKirim = po.status === 'Draft'
  // Draft belum punya nomor resmi (penanda DRAFT-xxxx) — tampilkan label ramah.
  const isDraftNomor = po.nomorPO.startsWith('DRAFT-')
  const canGoodsReceipt =
    po.status === 'Dikirim ke Supplier' || po.status === 'Sebagian Diterima'
  const canBatalkan = po.status === 'Draft' || po.status === 'Dikirim ke Supplier'
  const canCatatPembayaran = po.status !== 'Dibatalkan' && po.sisaHutang > 0

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <PageHeader
        title={isDraftNomor ? 'Draft Purchase Order' : po.nomorPO}
        subtitle={
          isDraftNomor
            ? `Nomor resmi terbit saat dikirim ke supplier · Dibuat ${formatTanggalWaktu(po.createdAt)}`
            : `Dibuat pada ${formatTanggalWaktu(po.createdAt)}`
        }
        actions={
          <Button variant="outline" onClick={() => router.push('/purchase-order')}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        }
      />

      {/* Status & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Supplier</p>
            <p className="text-sm font-semibold text-gray-900">{po.supplierNama}</p>
          </div>
          <div className="w-px h-8 bg-gray-200 hidden sm:block" />
          <div>
            <p className="text-xs text-gray-400 mb-1">Status PO</p>
            <StatusPOBadge status={po.status} />
          </div>
          <div className="w-px h-8 bg-gray-200 hidden sm:block" />
          <div>
            <p className="text-xs text-gray-400 mb-1">Pembayaran</p>
            <StatusPembayaranBadge status={po.statusPembayaran} />
          </div>
          {po.estimasiTanggalTiba && (
            <>
              <div className="w-px h-8 bg-gray-200 hidden sm:block" />
              <div>
                <p className="text-xs text-gray-400 mb-1">Est. Tiba</p>
                <p className="text-sm text-gray-700">{formatTanggal(po.estimasiTanggalTiba)}</p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => router.push(`/purchase-order/baru?id=${id}`)}>
              <Pencil className="h-4 w-4" />
              Edit Draft
            </Button>
          )}
          {canKirim && (
            <Button size="sm" onClick={() => setShowKirimConfirm(true)}>
              <Send className="h-4 w-4" />
              Kirim ke Supplier
            </Button>
          )}
          {canGoodsReceipt && (
            <Button size="sm" onClick={() => setShowGoodsReceipt(true)}>
              <Package className="h-4 w-4" />
              Terima Barang
            </Button>
          )}
          {canBatalkan && (
            <Button size="sm" variant="destructive" onClick={() => setShowBatalkan(true)}>
              <Ban className="h-4 w-4" />
              Batalkan
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ===== KOLOM KIRI ===== */}
        <div className="space-y-6 lg:col-span-2">

          {/* Tabel Item */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Item ({po.items.length} produk)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-3 pr-4 text-xs font-medium uppercase text-gray-400">Produk</th>
                      <th className="pb-3 pr-4 text-xs font-medium uppercase text-gray-400">SKU</th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase text-gray-400">Dipesan</th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase text-gray-400">Diterima</th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase text-gray-400">Harga Beli</th>
                      <th className="pb-3 text-right text-xs font-medium uppercase text-gray-400">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {po.items.map((item) => {
                      const fullyReceived = item.qtyDiterima >= item.qtyPesan
                      return (
                        <tr key={item.id}>
                          <td className="py-3 pr-4 font-medium text-gray-900">{item.produkNama}</td>
                          <td className="py-3 pr-4 font-mono text-xs text-gray-500">{item.produkSku}</td>
                          <td className="py-3 pr-4 text-right text-gray-700">{item.qtyPesan}</td>
                          <td className="py-3 pr-4 text-right">
                            <span
                              className={
                                fullyReceived
                                  ? 'text-green-600 font-medium'
                                  : item.qtyDiterima > 0
                                  ? 'text-yellow-600 font-medium'
                                  : 'text-gray-400'
                              }
                            >
                              {item.qtyDiterima}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right text-gray-700">
                            {formatRupiah(item.hargaBeli)}
                          </td>
                          <td className="py-3 text-right font-medium text-gray-900">
                            {formatRupiah(item.subtotal)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Biaya Tambahan */}
          <Card>
            <CardHeader>
              <CardTitle>Biaya Tambahan & HPP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ongkos Kirim</span>
                  <span className="font-medium text-gray-900">
                    {formatRupiah(po.biayaTambahan.ongkosKirim)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Biaya Bongkar Muat</span>
                  <span className="font-medium text-gray-900">
                    {formatRupiah(po.biayaTambahan.biayaBongkarMuat)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Upah Kurir</span>
                  <span className="font-medium text-gray-900">
                    {formatRupiah(po.biayaTambahan.upahKurir)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Lain-lain
                    {po.biayaTambahan.keteranganLainnya && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({po.biayaTambahan.keteranganLainnya})
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatRupiah(po.biayaTambahan.lainnya)}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-200 pt-3 flex justify-between text-sm">
                <span className="font-semibold text-gray-700">Total Biaya Tambahan</span>
                <span className="font-bold text-gray-900">
                  {formatRupiah(po.totalBiayaTambahan)}
                </span>
              </div>

              {/* HPP per Unit */}
              <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">
                  HPP per Unit
                </p>
                <p className="text-3xl font-bold text-green-700">{formatRupiah(po.hppPerUnit)}</p>
                <p className="mt-1 text-xs text-green-500">
                  Total Keseluruhan ÷ {po.totalQty} unit
                </p>
              </div>

              {/* Catatan */}
              {po.catatan && (
                <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Catatan</p>
                  <p className="text-sm text-gray-700">{po.catatan}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Riwayat Pembayaran */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Riwayat Pembayaran</CardTitle>
                {canCatatPembayaran && (
                  <Button size="sm" onClick={() => setShowCatatPembayaran(true)}>
                    <CreditCard className="h-4 w-4" />
                    Catat Pembayaran
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pembayaranLoading ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !pembayaranList || pembayaranList.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Belum ada riwayat pembayaran.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left">
                        <th className="pb-3 pr-4 text-xs font-medium uppercase text-gray-400">Tanggal</th>
                        <th className="pb-3 pr-4 text-right text-xs font-medium uppercase text-gray-400">Nominal</th>
                        <th className="pb-3 pr-4 text-xs font-medium uppercase text-gray-400">Metode</th>
                        <th className="pb-3 text-xs font-medium uppercase text-gray-400">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pembayaranList.map((p) => (
                        <tr key={p.id}>
                          <td className="py-3 pr-4 text-gray-700">{formatTanggal(p.tanggal)}</td>
                          <td className="py-3 pr-4 text-right font-semibold text-gray-900">
                            {formatRupiah(p.nominal)}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant={
                                p.metode === 'Transfer'
                                  ? 'info'
                                  : p.metode === 'Tunai'
                                  ? 'success'
                                  : 'default'
                              }
                            >
                              {p.metode}
                            </Badge>
                          </td>
                          <td className="py-3 text-gray-500">{p.catatan || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===== KOLOM KANAN (Ringkasan Finansial) ===== */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Ringkasan Finansial</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <dt>Total Harga Barang</dt>
                  <dd className="font-medium text-gray-900">{formatRupiah(po.totalHargaBarang)}</dd>
                </div>
                <div className="flex justify-between text-gray-600">
                  <dt>Total Biaya Tambahan</dt>
                  <dd className="font-medium text-gray-900">{formatRupiah(po.totalBiayaTambahan)}</dd>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <dt className="font-semibold text-gray-800">Total Keseluruhan</dt>
                  <dd className="font-bold text-gray-900">{formatRupiah(po.totalKeseluruhan)}</dd>
                </div>

                <div className="border-t border-gray-100 pt-3 flex justify-between text-gray-600">
                  <dt>Total Dibayar</dt>
                  <dd className="font-medium text-green-700">{formatRupiah(po.totalDibayar)}</dd>
                </div>

                <div className="flex justify-between">
                  <dt className="font-semibold text-gray-700">Sisa Hutang</dt>
                  <dd
                    className={`font-bold ${po.sisaHutang > 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {po.sisaHutang > 0 ? formatRupiah(po.sisaHutang) : 'Lunas'}
                  </dd>
                </div>

                {po.sisaHutang > 0 && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">
                      Masih ada hutang sebesar{' '}
                      <strong>{formatRupiah(po.sisaHutang)}</strong> yang belum dibayarkan.
                    </p>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* Confirm Kirim ke Supplier */}
      <ConfirmModal
        open={showKirimConfirm}
        onClose={() => setShowKirimConfirm(false)}
        onConfirm={async () => {
          await kirimPO(id)
          setShowKirimConfirm(false)
        }}
        title="Kirim ke Supplier?"
        description={`PO untuk ${po.supplierNama} akan dikirimkan dan mendapat nomor resmi. Status berubah menjadi "Dikirim ke Supplier".`}
        confirmLabel="Ya, Kirim Sekarang"
        cancelLabel="Batal"
        variant="default"
        loading={kirimPending}
      />

      {/* Goods Receipt Modal */}
      <GoodsReceiptModal
        open={showGoodsReceipt}
        onClose={() => setShowGoodsReceipt(false)}
        items={po.items}
        poId={id}
      />

      {/* Batalkan Modal */}
      <BatalkanModal
        open={showBatalkan}
        onClose={() => setShowBatalkan(false)}
        poId={id}
      />

      {/* Catat Pembayaran Modal */}
      <CatatPembayaranModal
        open={showCatatPembayaran}
        onClose={() => setShowCatatPembayaran(false)}
        poId={id}
        sisaHutang={po.sisaHutang}
      />
    </div>
  )
}
