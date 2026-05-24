'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, XCircle, Truck, PackageCheck, AlertCircle, Printer } from 'lucide-react'
import { PageHeader } from '@/components/shared'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Modal,
  Textarea,
} from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth-store'
import {
  useTransferStok,
  useApproveTransferStok,
  useTolakTransferStok,
  useKirimTransferStok,
  useTerimaTransferStok,
} from '@/hooks/use-transfer-stok'
import { formatTanggalWaktu, formatTanggal } from '@/lib/utils'
import { printSuratJalanTransfer, printPackingListTransfer } from '@/lib/print'
import type { StatusTransferStok, TransferStokItem, StatusPenerimaanItem } from '@/types'

function statusVariant(s: StatusTransferStok) {
  switch (s) {
    case 'Menunggu Persetujuan': return 'warning' as const
    case 'Disetujui': return 'info' as const
    case 'Ditolak': return 'danger' as const
    case 'Dikirim': return 'purple' as const
    case 'Selesai': return 'success' as const
    default: return 'default' as const
  }
}

// ─── Modal Approve ────────────────────────────────────────────────────────────

interface ApproveModalProps {
  open: boolean
  onClose: () => void
  items: TransferStokItem[]
  transferId: string
}

function ApproveModal({ open, onClose, items, transferId }: ApproveModalProps) {
  const { mutateAsync, isPending } = useApproveTransferStok()
  const [qtyMap, setQtyMap] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.id, i.qtyDiminta]))
  )
  const [catatan, setCatatan] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await mutateAsync({
      id: transferId,
      payload: {
        items: items.map((i) => ({ itemId: i.id, qtyDisetujui: qtyMap[i.id] ?? i.qtyDiminta })),
        catatan: catatan || undefined,
      },
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Setujui Transfer Stok" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Periksa dan sesuaikan qty yang disetujui untuk setiap item.
        </p>
        <div className="space-y-3 rounded-lg border border-gray-200 p-3">
          <div className="grid grid-cols-12 text-xs font-medium uppercase text-gray-500">
            <div className="col-span-5">Produk</div>
            <div className="col-span-3 text-center">Diminta</div>
            <div className="col-span-4 text-center">Disetujui</div>
          </div>
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 items-center gap-2 text-sm">
              <div className="col-span-5">
                <p className="font-medium text-gray-900">{item.produkNama}</p>
                <p className="text-xs text-gray-500">{item.produkSku}</p>
              </div>
              <div className="col-span-3 text-center text-gray-600">
                {item.qtyDiminta} {item.satuan}
              </div>
              <div className="col-span-4">
                <input
                  type="number"
                  min={0}
                  max={item.qtyDiminta}
                  value={qtyMap[item.id] ?? item.qtyDiminta}
                  onChange={(e) =>
                    setQtyMap((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                  }
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-center text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
          ))}
        </div>
        <Textarea
          label="Catatan untuk toko (opsional)"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          rows={2}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
          <Button type="submit" loading={isPending}>Setujui</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Modal Tolak ──────────────────────────────────────────────────────────────

interface TolakModalProps {
  open: boolean
  onClose: () => void
  transferId: string
}

function TolakModal({ open, onClose, transferId }: TolakModalProps) {
  const { mutateAsync, isPending } = useTolakTransferStok()
  const [catatan, setCatatan] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await mutateAsync({ id: transferId, catatan: catatan || undefined })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Tolak Permintaan" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Permintaan akan ditolak dan toko akan diberitahu.
        </div>
        <Textarea
          label="Alasan penolakan (opsional)"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          rows={3}
          placeholder="Jelaskan alasan penolakan..."
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
          <Button type="submit" variant="destructive" loading={isPending}>Tolak Permintaan</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DetailTransferStokPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const isGudang = user?.tipeCabang === 'gudang' || user?.role === 'staf_gudang'

  const { data: transfer, isLoading } = useTransferStok(id)
  const { mutateAsync: kirim, isPending: isKirim } = useKirimTransferStok()
  const { mutateAsync: terima, isPending: isTerima } = useTerimaTransferStok()

  const [approveOpen, setApproveOpen] = useState(false)
  const [tolakOpen, setTolakOpen] = useState(false)
  const [terimaOpen, setTerimaOpen] = useState(false)

  // Checklist penerimaan per item
  const [terimaMap, setTerimaMap] = useState<Record<string, StatusPenerimaanItem>>({})
  const [terimaQty, setTerimaQty] = useState<Record<string, number>>({})
  const [terimaCatatan, setTerimaCatatan] = useState('')

  function initTerima() {
    if (!transfer) return
    const statusMap: Record<string, StatusPenerimaanItem> = {}
    const qtyMap: Record<string, number> = {}
    transfer.items.forEach((item) => {
      statusMap[item.id] = item.statusPenerimaan ?? 'diterima'
      qtyMap[item.id] = item.qtyDiterima ?? item.qtyDisetujui ?? item.qtyDiminta
    })
    setTerimaMap(statusMap)
    setTerimaQty(qtyMap)
    setTerimaCatatan('')
    setTerimaOpen(true)
  }

  async function handleTerima(e: React.FormEvent) {
    e.preventDefault()
    if (!transfer) return
    await terima({
      id,
      payload: {
        items: transfer.items.map((item) => ({
          itemId: item.id,
          qtyDiterima: terimaQty[item.id] ?? item.qtyDisetujui ?? item.qtyDiminta,
          statusPenerimaan: terimaMap[item.id] ?? 'diterima',
        })),
        catatan: terimaCatatan || undefined,
      },
    })
    setTerimaOpen(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!transfer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-500">Transfer tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/transfer-stok')}>
          Kembali
        </Button>
      </div>
    )
  }

  const isOwnGudang = isGudang && user?.cabangId === transfer.gudangId
  const isOwnToko = !isGudang && user?.cabangId === transfer.tokoId
  const canApprove = isOwnGudang && transfer.status === 'Menunggu Persetujuan'
  const canKirim = isOwnGudang && transfer.status === 'Disetujui'
  const canTerima = isOwnToko && transfer.status === 'Dikirim'

  return (
    <div className="space-y-6">
      <PageHeader
        title={transfer.nomorTransfer}
        subtitle={`Permintaan dari ${transfer.tokNama} ke ${transfer.gudangNama}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(transfer.status)}>{transfer.status}</Badge>
            {(transfer.status === 'Disetujui' || transfer.status === 'Dikirim' || transfer.status === 'Selesai') && (
              <>
                <Button variant="outline" size="sm" onClick={() => printPackingListTransfer(transfer)}>
                  <Printer className="h-4 w-4" />
                  Packing List
                </Button>
                <Button variant="outline" size="sm" onClick={() => printSuratJalanTransfer(transfer)}>
                  <Printer className="h-4 w-4" />
                  Surat Jalan
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => router.push('/transfer-stok')}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kiri — Item */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Item</CardTitle>
                {transfer.status === 'Selesai' && (
                  <div className="flex gap-2">
                    <Badge variant="success">
                      {transfer.items.filter((i) => i.statusPenerimaan === 'diterima').length} Diterima
                    </Badge>
                    <Badge variant="danger">
                      {transfer.items.filter((i) => i.statusPenerimaan === 'dikembalikan').length} Dikembalikan
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`hidden pb-2 text-xs font-medium uppercase text-gray-500 sm:grid ${transfer.status === 'Selesai' ? 'grid-cols-12' : 'grid-cols-12'}`}>
                <div className="col-span-4">Produk</div>
                <div className="col-span-2 text-center">Diminta</div>
                <div className="col-span-3 text-center">Disetujui</div>
                {transfer.status === 'Selesai' && <div className="col-span-3 text-center">Diterima</div>}
              </div>
              <div className="divide-y divide-gray-100">
                {transfer.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 items-center gap-2 py-3 text-sm">
                    <div className="col-span-12 sm:col-span-4">
                      <p className="font-medium text-gray-900">{item.produkNama}</p>
                      <p className="text-xs text-gray-500">{item.produkSku}</p>
                    </div>
                    <div className="col-span-4 text-center sm:col-span-2 text-gray-700">
                      {item.qtyDiminta} {item.satuan}
                    </div>
                    <div className="col-span-4 text-center sm:col-span-3">
                      {item.qtyDisetujui != null ? (
                        <span className={`font-semibold ${item.qtyDisetujui < item.qtyDiminta ? 'text-yellow-600' : 'text-green-700'}`}>
                          {item.qtyDisetujui} {item.satuan}
                          {item.qtyDisetujui < item.qtyDiminta && (
                            <span className="ml-1 text-xs font-normal text-gray-500">(disesuaikan)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                    {transfer.status === 'Selesai' && (
                      <div className="col-span-4 text-center sm:col-span-3">
                        {item.statusPenerimaan ? (
                          <div className="space-y-0.5">
                            <Badge variant={item.statusPenerimaan === 'diterima' ? 'success' : 'danger'}>
                              {item.statusPenerimaan === 'diterima' ? 'Diterima' : 'Dikembalikan'}
                            </Badge>
                            {item.qtyDiterima != null && (
                              <p className="text-xs text-gray-500">{item.qtyDiterima} {item.satuan}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Catatan */}
          {(transfer.catatanToko || transfer.catatanGudang) && (
            <Card>
              <CardHeader><CardTitle>Catatan</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {transfer.catatanToko && (
                  <div>
                    <p className="font-medium text-gray-500">Dari Toko</p>
                    <p className="mt-1 text-gray-800">{transfer.catatanToko}</p>
                  </div>
                )}
                {transfer.catatanGudang && (
                  <div>
                    <p className="font-medium text-gray-500">Dari Gudang</p>
                    <p className="mt-1 text-gray-800">{transfer.catatanGudang}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Kanan — Info & Aksi */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Informasi</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Toko Pemohon</span>
                <span className="font-medium text-gray-900">{transfer.tokNama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gudang</span>
                <span className="font-medium text-gray-900">{transfer.gudangNama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dibuat</span>
                <span className="text-gray-700">{formatTanggalWaktu(transfer.createdAt)}</span>
              </div>
              {transfer.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Disetujui</span>
                  <span className="text-gray-700">{formatTanggal(transfer.approvedAt)}</span>
                </div>
              )}
              {transfer.shippedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Dikirim</span>
                  <span className="text-gray-700">{formatTanggal(transfer.shippedAt)}</span>
                </div>
              )}
              {transfer.receivedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Diterima</span>
                  <span className="text-gray-700">{formatTanggal(transfer.receivedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Card */}
          {(canApprove || canKirim || canTerima) && (
            <Card>
              <CardHeader><CardTitle>Tindakan</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {canApprove && (
                  <>
                    <Button className="w-full" onClick={() => setApproveOpen(true)}>
                      <CheckCircle className="h-4 w-4" />
                      Setujui & Proses
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={() => setTolakOpen(true)}>
                      <XCircle className="h-4 w-4" />
                      Tolak Permintaan
                    </Button>
                  </>
                )}
                {canKirim && (
                  <Button className="w-full" loading={isKirim} onClick={() => kirim(id)}>
                    <Truck className="h-4 w-4" />
                    Tandai Sudah Dikirim
                  </Button>
                )}
                {canTerima && (
                  <Button className="w-full" onClick={initTerima}>
                    <PackageCheck className="h-4 w-4" />
                    Konfirmasi Penerimaan
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ApproveModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        items={transfer.items}
        transferId={id}
      />
      <TolakModal
        open={tolakOpen}
        onClose={() => setTolakOpen(false)}
        transferId={id}
      />

      {/* Modal Konfirmasi Penerimaan */}
      <Modal open={terimaOpen} onClose={() => setTerimaOpen(false)} title="Konfirmasi Penerimaan" size="md">
        <form onSubmit={handleTerima} className="space-y-4">
          <p className="text-sm text-gray-500">
            Tandai status penerimaan setiap item. Barang yang tidak sesuai bisa ditandai sebagai dikembalikan.
          </p>
          <div className="space-y-3 rounded-lg border border-gray-200 p-3">
            <div className="grid grid-cols-12 text-xs font-medium uppercase text-gray-500">
              <div className="col-span-4">Produk</div>
              <div className="col-span-3 text-center">Dikirim</div>
              <div className="col-span-2 text-center">Qty Terima</div>
              <div className="col-span-3 text-center">Status</div>
            </div>
            {transfer.items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 items-center gap-2 text-sm">
                <div className="col-span-4">
                  <p className="font-medium text-gray-900 text-xs">{item.produkNama}</p>
                  <p className="text-xs text-gray-400">{item.produkSku}</p>
                </div>
                <div className="col-span-3 text-center text-gray-600 text-xs">
                  {item.qtyDisetujui ?? item.qtyDiminta} {item.satuan}
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min={0}
                    max={item.qtyDisetujui ?? item.qtyDiminta}
                    value={terimaQty[item.id] ?? item.qtyDisetujui ?? item.qtyDiminta}
                    onChange={(e) => setTerimaQty((m) => ({ ...m, [item.id]: Number(e.target.value) }))}
                    className="h-8 w-full rounded-lg border border-gray-300 px-2 text-center text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div className="col-span-3 flex gap-1 justify-center">
                  {(['diterima', 'dikembalikan'] as StatusPenerimaanItem[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTerimaMap((m) => ({ ...m, [item.id]: s }))}
                      className={`rounded px-2 py-1 text-xs font-medium border transition-colors ${
                        terimaMap[item.id] === s
                          ? s === 'diterima'
                            ? 'bg-green-100 border-green-500 text-green-700'
                            : 'bg-red-100 border-red-400 text-red-700'
                          : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {s === 'diterima' ? '✓' : '✗'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Textarea
            label="Catatan penerimaan (opsional)"
            value={terimaCatatan}
            onChange={(e) => setTerimaCatatan(e.target.value)}
            rows={2}
            placeholder="Catatan kondisi barang, kerusakan, dll..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setTerimaOpen(false)} disabled={isTerima}>
              Batal
            </Button>
            <Button type="submit" loading={isTerima}>
              <PackageCheck className="h-4 w-4" />
              Konfirmasi Diterima
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
