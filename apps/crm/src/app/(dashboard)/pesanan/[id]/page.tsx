'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, Printer, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
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
  Skeleton,
  Textarea,
} from '@/components/ui'
import { useOrder, useUpdateOrderStatus } from '@/hooks/use-orders'
import { useAuthStore } from '@/store/auth-store'
import { ordersApi } from '@/lib/api'
import { printStrukPOS } from '@/lib/print'
import { formatRupiah, formatTanggalWaktu } from '@/lib/utils'
import type { StatusPesanan, ItemPesanan, Pesanan } from '@/types'

function StatusBadge({ status }: { status: StatusPesanan }) {
  const variantMap: Record<StatusPesanan, 'info' | 'warning' | 'purple' | 'default' | 'success' | 'danger'> = {
    Baru: 'info', Dikonfirmasi: 'info', Diproses: 'warning', Siap: 'purple',
    Dikirim: 'default', Selesai: 'success', Dibatalkan: 'danger',
  }
  return <Badge variant={variantMap[status] ?? 'default'}>{status}</Badge>
}

// ── Items table (shared) ──────────────────────────────────────────────────────

function ItemsTable({ items }: { items: ItemPesanan[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Item</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-left font-medium text-gray-500">Produk</th>
                <th className="pb-3 text-left font-medium text-gray-500">SKU</th>
                <th className="pb-3 text-center font-medium text-gray-500">Qty</th>
                <th className="pb-3 text-right font-medium text-gray-500">Harga Satuan</th>
                <th className="pb-3 text-right font-medium text-gray-500">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-medium text-gray-900">{item.produkNama}</td>
                  <td className="py-3 text-gray-500">{item.produkSku}</td>
                  <td className="py-3 text-center text-gray-700">{item.qty}</td>
                  <td className="py-3 text-right text-gray-700">{formatRupiah(item.hargaSatuan)}</td>
                  <td className="py-3 text-right font-medium text-gray-900">{formatRupiah(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Retur info section (shared) ──────────────────────────────────────────────

function ReturSection({ pesanan }: { pesanan: Pesanan }) {
  if (!pesanan.hasRetur || !pesanan.returItems?.length) return null
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-700 text-base">Detail Retur</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-orange-200">
                <th className="pb-2 text-left font-medium text-orange-600">Produk</th>
                <th className="pb-2 text-center font-medium text-orange-600">Qty Dikembalikan</th>
                <th className="pb-2 text-right font-medium text-orange-600">Nilai Retur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100">
              {pesanan.returItems.map((item) => (
                <tr key={item.produkId}>
                  <td className="py-2 font-medium text-gray-900">{item.produkNama}</td>
                  <td className="py-2 text-center text-gray-700">{item.qty}</td>
                  <td className="py-2 text-right text-orange-700 font-medium">{formatRupiah(item.nominal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-orange-200">
                <td colSpan={2} className="pt-2 text-sm font-semibold text-gray-700">Total Retur</td>
                <td className="pt-2 text-right text-base font-bold text-orange-700">{formatRupiah(pesanan.returNominal ?? 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Retur modal (shared) ──────────────────────────────────────────────────────

interface ReturItemState { checked: boolean; qty: number }

function ReturModal({
  open, onClose, pesanan, onSuccess,
}: {
  open: boolean; onClose: () => void; pesanan: Pesanan; onSuccess: () => void
}) {
  const [returItems, setReturItems] = useState<Record<string, ReturItemState>>({})
  const [alasan, setAlasan] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      const initial: Record<string, ReturItemState> = {}
      pesanan.items.forEach((item) => { initial[item.id] = { checked: false, qty: 0 } })
      setReturItems(initial)
      setAlasan('')
      setError('')
    }
  }, [open])

  const handleConfirm = async () => {
    if (!alasan.trim()) { setError('Alasan retur wajib diisi'); return }
    const selected = pesanan.items
      .filter((item) => returItems[item.id]?.checked)
      .map((item) => ({ produkId: item.produkId, qty: returItems[item.id]?.qty ?? 0 }))
    if (selected.length === 0) { setError('Pilih minimal satu item'); return }
    for (const item of pesanan.items) {
      const s = returItems[item.id]
      if (s?.checked && (!s.qty || s.qty <= 0 || s.qty > item.qty)) {
        setError(`Qty retur "${item.produkNama}" tidak valid (maks: ${item.qty})`)
        return
      }
    }
    try {
      setLoading(true)
      await ordersApi.prosesRetur(pesanan.id, { items: selected, alasan })
      toast.success('Retur berhasil diproses')
      onClose()
      onSuccess()
    } catch { toast.error('Gagal memproses retur') }
    finally { setLoading(false) }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Proses Retur"
      description={`Pilih item yang ingin diretur dari transaksi ${pesanan.nomorPesanan}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-2 w-8"></th>
                <th className="pb-2 text-left font-medium text-gray-500">Produk</th>
                <th className="pb-2 text-center font-medium text-gray-500">Qty Beli</th>
                <th className="pb-2 text-center font-medium text-gray-500">Qty Dikembalikan</th>
                <th className="pb-2 text-right font-medium text-gray-500">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pesanan.items.map((item: ItemPesanan) => {
                const state = returItems[item.id]
                return (
                  <tr key={item.id} className={state?.checked ? 'bg-orange-50' : ''}>
                    <td className="py-2">
                      <input type="checkbox" checked={state?.checked ?? false}
                        onChange={(e) => setReturItems((p) => ({ ...p, [item.id]: { ...p[item.id], checked: e.target.checked } }))}
                        className="h-4 w-4 rounded border-gray-300 text-green-600"
                      />
                    </td>
                    <td className="py-2 font-medium text-gray-900">{item.produkNama}</td>
                    <td className="py-2 text-center text-gray-700">{item.qty}</td>
                    <td className="py-2 text-center">
                      <input type="number" min={1} max={item.qty}
                        value={state?.qty ?? item.qty} disabled={!state?.checked}
                        onChange={(e) => setReturItems((p) => ({ ...p, [item.id]: { ...p[item.id], qty: Number(e.target.value) } }))}
                        className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm disabled:opacity-50 focus:border-green-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 text-right text-gray-700">{formatRupiah(item.subtotal)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Textarea label="Alasan Retur" required placeholder="Masukkan alasan retur..."
          value={alasan} onChange={(e) => { setAlasan(e.target.value); setError('') }}
          error={error} rows={3}
        />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
          <Button onClick={handleConfirm} loading={loading} className="bg-orange-600 hover:bg-orange-700 text-white">
            Proses Retur
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Detail Transaksi POS ──────────────────────────────────────────────────────

function DetailPOS({ pesanan, refetch }: { pesanan: Pesanan; refetch: () => void }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [showRetur, setShowRetur] = useState(false)

  const canRetur =
    !pesanan.hasRetur &&
    (user?.role === 'manajer' || user?.role === 'admin' || user?.role === 'superadmin')

  return (
    <div className="space-y-6">
      <PageHeader
        title={pesanan.nomorPesanan}
        subtitle={
          <span className="flex items-center gap-2 flex-wrap">
            <span>{formatTanggalWaktu(pesanan.createdAt)} · Kasir: {pesanan.kasirNama}</span>
            {pesanan.hasRetur && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
                Ada Retur
              </span>
            )}
          </span>
        }
        actions={
          <div className="flex gap-2">
            {canRetur && (
              <Button variant="outline" size="sm" onClick={() => setShowRetur(true)}
                className="border-orange-300 text-orange-700 hover:bg-orange-50">
                <RotateCcw className="h-4 w-4" />
                Proses Retur
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => printStrukPOS(pesanan)}>
              <Printer className="h-4 w-4" />
              Cetak Struk
            </Button>
            <Button variant="outline" onClick={() => router.push('/pesanan')}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>
        }
      />

      {/* Info Transaksi + Pembayaran */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Info Transaksi</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Kasir</dt>
                <dd className="font-medium text-gray-900">{pesanan.kasirNama}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Waktu</dt>
                <dd className="font-medium text-gray-900">{formatTanggalWaktu(pesanan.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Metode Pembayaran</dt>
                <dd className="font-medium text-gray-900">{pesanan.metodePembayaran}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ringkasan Pembayaran</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Subtotal</dt>
                <dd className="font-medium text-gray-900">{formatRupiah(pesanan.subtotal)}</dd>
              </div>
              {pesanan.diskon > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Diskon</dt>
                  <dd className="font-medium text-red-600">- {formatRupiah(pesanan.diskon)}</dd>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <dt className="text-base font-semibold text-gray-900">Total Dibayar</dt>
                <dd className="text-xl font-bold text-green-700">{formatRupiah(pesanan.total)}</dd>
              </div>
              {pesanan.returNominal && pesanan.returNominal > 0 ? (
                <>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Retur</dt>
                    <dd className="font-medium text-orange-600">- {formatRupiah(pesanan.returNominal)}</dd>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <dt className="text-base font-semibold text-gray-900">Net Diterima</dt>
                    <dd className="text-xl font-bold text-gray-900">{formatRupiah(pesanan.total - pesanan.returNominal)}</dd>
                  </div>
                </>
              ) : null}
            </dl>
          </CardContent>
        </Card>
      </div>

      <ItemsTable items={pesanan.items} />
      <ReturSection pesanan={pesanan} />

      <ReturModal open={showRetur} onClose={() => setShowRetur(false)} pesanan={pesanan} onSuccess={refetch} />
    </div>
  )
}

// ── Detail Pesanan VIP ────────────────────────────────────────────────────────

function DetailManual({ pesanan, refetch }: { pesanan: Pesanan; refetch: () => void }) {
  const router = useRouter()
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()
  const [showBatalModal, setShowBatalModal] = useState(false)
  const [alasanBatal, setAlasanBatal] = useState('')
  const [batalError, setBatalError] = useState('')
  const [showProsesConfirm, setShowProsesConfirm] = useState(false)
  const [showSiapKirimConfirm, setShowSiapKirimConfirm] = useState(false)

  const statusFinal = pesanan.status === 'Selesai' || pesanan.status === 'Dibatalkan'
  const dalamPengiriman = pesanan.status === 'Dikirim'

  const handleBatalkan = async () => {
    if (!alasanBatal.trim()) { setBatalError('Alasan pembatalan wajib diisi'); return }
    await updateStatus({ id: pesanan.id, status: 'Dibatalkan', catatan: alasanBatal })
    setShowBatalModal(false)
    setAlasanBatal('')
    setBatalError('')
    refetch()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pesanan.nomorPesanan}
        subtitle={`Dibuat pada ${formatTanggalWaktu(pesanan.createdAt)} · oleh ${pesanan.kasirNama}`}
        actions={
          <Button variant="outline" onClick={() => router.push('/pesanan')}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        }
      />

      {/* Status + Aksi workflow */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <StatusBadge status={pesanan.status} />
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              {pesanan.status === 'Baru' && (
                <Button onClick={() => setShowProsesConfirm(true)} loading={isUpdating} size="sm">
                  Proses Pesanan
                </Button>
              )}
              {pesanan.status === 'Diproses' && (
                <Button onClick={() => setShowSiapKirimConfirm(true)} loading={isUpdating} size="sm">
                  Tandai Siap Kirim
                </Button>
              )}
              {pesanan.status === 'Siap' && (
                <Link href={`/pengiriman/baru?pesananId=${pesanan.id}`}>
                  <Button size="sm">Buat Jadwal Pengiriman</Button>
                </Link>
              )}
              {!statusFinal && !dalamPengiriman && (
                <Button variant="destructive" size="sm" onClick={() => setShowBatalModal(true)} disabled={isUpdating}>
                  Batalkan Pesanan
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Pelanggan + Pembayaran */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Informasi Pelanggan</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Nama</dt>
                <dd className="font-medium text-gray-900">{pesanan.pelangganNama}</dd>
              </div>
              {pesanan.pelangganTelepon && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Telepon</dt>
                  <dd className="font-medium text-gray-900">{pesanan.pelangganTelepon}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Metode Pembayaran</dt>
                <dd className="font-medium text-gray-900">{pesanan.metodePembayaran}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Metode Pengiriman</dt>
                <dd className="font-medium text-gray-900">
                  {pesanan.metodePengiriman === 'ambil_sendiri' ? 'Ambil Sendiri' : 'Dikirim'}
                </dd>
              </div>
              {pesanan.metodePengiriman === 'dikirim' && pesanan.alamatPengiriman && (
                <div className="flex flex-col gap-1">
                  <dt className="text-gray-500">Alamat Pengiriman</dt>
                  <dd className="mt-1 rounded-lg bg-gray-50 p-2 font-medium text-gray-900">
                    {pesanan.alamatPengiriman}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ringkasan Pembayaran</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Subtotal</dt>
                <dd className="font-medium text-gray-900">{formatRupiah(pesanan.subtotal)}</dd>
              </div>
              {pesanan.diskon > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Diskon</dt>
                  <dd className="font-medium text-red-600">- {formatRupiah(pesanan.diskon)}</dd>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <dt className="text-base font-semibold text-gray-900">Total</dt>
                <dd className="text-xl font-bold text-green-700">{formatRupiah(pesanan.total)}</dd>
              </div>
              {pesanan.returNominal && pesanan.returNominal > 0 ? (
                <>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Retur</dt>
                    <dd className="font-medium text-orange-600">- {formatRupiah(pesanan.returNominal)}</dd>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <dt className="text-base font-semibold text-gray-900">Net Diterima</dt>
                    <dd className="text-xl font-bold text-gray-900">{formatRupiah(pesanan.total - pesanan.returNominal)}</dd>
                  </div>
                </>
              ) : null}
            </dl>
          </CardContent>
        </Card>
      </div>

      <ItemsTable items={pesanan.items} />
      <ReturSection pesanan={pesanan} />

      {pesanan.catatan && (
        <Card>
          <CardHeader><CardTitle>Catatan</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-700">{pesanan.catatan}</p></CardContent>
        </Card>
      )}

      <ConfirmModal open={showProsesConfirm} onClose={() => setShowProsesConfirm(false)}
        onConfirm={async () => { await updateStatus({ id: pesanan.id, status: 'Diproses' }); setShowProsesConfirm(false); refetch() }}
        title="Proses Pesanan" description={`Ubah status pesanan ${pesanan.nomorPesanan} menjadi "Diproses"?`}
        confirmLabel="Ya, Proses" variant="default" loading={isUpdating}
      />
      <ConfirmModal open={showSiapKirimConfirm} onClose={() => setShowSiapKirimConfirm(false)}
        onConfirm={async () => { await updateStatus({ id: pesanan.id, status: 'Siap' }); setShowSiapKirimConfirm(false); refetch() }}
        title="Tandai Siap" description={`Ubah status pesanan ${pesanan.nomorPesanan} menjadi "Siap"?`}
        confirmLabel="Ya, Siap" variant="default" loading={isUpdating}
      />
      <Modal open={showBatalModal} onClose={() => { setShowBatalModal(false); setAlasanBatal(''); setBatalError('') }}
        title="Batalkan Pesanan" description={`Batalkan pesanan ${pesanan.nomorPesanan}?`} size="md"
      >
        <div className="space-y-4">
          <Textarea label="Alasan Pembatalan" required placeholder="Masukkan alasan pembatalan..."
            value={alasanBatal} onChange={(e) => { setAlasanBatal(e.target.value); if (batalError) setBatalError('') }}
            error={batalError} rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setShowBatalModal(false); setAlasanBatal(''); setBatalError('') }} disabled={isUpdating}>Tutup</Button>
            <Button variant="destructive" onClick={handleBatalkan} loading={isUpdating}>Batalkan Pesanan</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DetailPesananPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: pesanan, isLoading, isError, refetch } = useOrder(id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        {[1, 2].map((i) => (
          <Card key={i}><CardContent className="pt-6 space-y-3">
            {[1, 2, 3].map((j) => <Skeleton key={j} className="h-5 w-full" />)}
          </CardContent></Card>
        ))}
      </div>
    )
  }

  if (isError || !pesanan) {
    return (
      <div className="space-y-6">
        <PageHeader title="Detail Pesanan"
          actions={<Button variant="outline" onClick={() => router.push('/pesanan')}><ArrowLeft className="h-4 w-4" />Kembali</Button>}
        />
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">Pesanan tidak ditemukan atau terjadi kesalahan.</p>
          </div>
        </CardContent></Card>
      </div>
    )
  }

  if (pesanan.sumber === 'pos') {
    return <DetailPOS pesanan={pesanan} refetch={refetch} />
  }

  return <DetailManual pesanan={pesanan} refetch={refetch} />
}
