'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, XCircle, Truck, PackageCheck, AlertCircle } from 'lucide-react'
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
import type { StatusTransferStok, TransferStokItem } from '@/types'

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
        items: items.map((i) => ({ transferItemId: i.id, qtyDisetujui: qtyMap[i.id] ?? i.qtyDiminta })),
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
  const isGudang = user?.tipeCabang === 'gudang'

  const { data: transfer, isLoading } = useTransferStok(id)
  const { mutateAsync: kirim, isPending: isKirim } = useKirimTransferStok()
  const { mutateAsync: terima, isPending: isTerima } = useTerimaTransferStok()

  const [approveOpen, setApproveOpen] = useState(false)
  const [tolakOpen, setTolakOpen] = useState(false)

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

  const canApprove = isGudang && transfer.status === 'Menunggu Persetujuan'
  const canKirim = isGudang && transfer.status === 'Disetujui'
  const canTerima = !isGudang && transfer.status === 'Dikirim'

  return (
    <div className="space-y-6">
      <PageHeader
        title={transfer.nomorTransfer}
        subtitle={`Permintaan dari ${transfer.tokNama} ke ${transfer.gudangNama}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(transfer.status)}>{transfer.status}</Badge>
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
            <CardHeader><CardTitle>Daftar Item</CardTitle></CardHeader>
            <CardContent>
              <div className="hidden grid-cols-12 pb-2 text-xs font-medium uppercase text-gray-500 sm:grid">
                <div className="col-span-5">Produk</div>
                <div className="col-span-3 text-center">Diminta</div>
                <div className="col-span-4 text-center">Disetujui</div>
              </div>
              <div className="divide-y divide-gray-100">
                {transfer.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 items-center gap-2 py-3 text-sm">
                    <div className="col-span-12 sm:col-span-5">
                      <p className="font-medium text-gray-900">{item.produkNama}</p>
                      <p className="text-xs text-gray-500">{item.produkSku}</p>
                    </div>
                    <div className="col-span-6 text-center sm:col-span-3 text-gray-700">
                      {item.qtyDiminta} {item.satuan}
                    </div>
                    <div className="col-span-6 text-center sm:col-span-4">
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
                  <Button className="w-full" loading={isTerima} onClick={() => terima(id)}>
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
    </div>
  )
}
