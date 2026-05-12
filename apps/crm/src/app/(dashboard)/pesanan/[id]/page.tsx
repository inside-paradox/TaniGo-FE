'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
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
import { formatRupiah, formatTanggalWaktu } from '@/lib/utils'
import type { StatusPesanan } from '@/types'

function StatusBadge({ status }: { status: StatusPesanan }) {
  const variantMap: Record<StatusPesanan, 'info' | 'warning' | 'purple' | 'default' | 'success' | 'danger'> = {
    Baru: 'info',
    Diproses: 'warning',
    'Siap Kirim': 'purple',
    'Dalam Pengiriman': 'default',
    Selesai: 'success',
    Dibatalkan: 'danger',
  }
  return <Badge variant={variantMap[status] ?? 'default'}>{status}</Badge>
}

function MetodePengirimanLabel({ metode }: { metode: string }) {
  return <span>{metode === 'ambil_sendiri' ? 'Ambil Sendiri' : 'Dikirim'}</span>
}

export default function DetailPesananPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: pesanan, isLoading, isError } = useOrder(id)
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()

  const [showBatalModal, setShowBatalModal] = useState(false)
  const [alasanBatal, setAlasanBatal] = useState('')
  const [batalError, setBatalError] = useState('')
  const [showProsesConfirm, setShowProsesConfirm] = useState(false)
  const [showSiapKirimConfirm, setShowSiapKirimConfirm] = useState(false)

  const handleProsesPesanan = async () => {
    await updateStatus({ id, status: 'Diproses' })
    setShowProsesConfirm(false)
  }

  const handleTandaiSiapKirim = async () => {
    await updateStatus({ id, status: 'Siap Kirim' })
    setShowSiapKirimConfirm(false)
  }

  const handleBatalkan = async () => {
    if (!alasanBatal.trim()) {
      setBatalError('Alasan pembatalan wajib diisi')
      return
    }
    await updateStatus({ id, status: 'Dibatalkan', catatan: alasanBatal })
    setShowBatalModal(false)
    setAlasanBatal('')
    setBatalError('')
  }

  // Loading state
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
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (isError || !pesanan) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detail Pesanan"
          actions={
            <Button variant="outline" onClick={() => router.push('/pesanan')}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          }
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">Pesanan tidak ditemukan atau terjadi kesalahan.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusFinal = pesanan.status === 'Selesai' || pesanan.status === 'Dibatalkan'
  const dalamPengiriman = pesanan.status === 'Dalam Pengiriman'

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={pesanan.nomorPesanan}
        subtitle={`Dibuat pada ${formatTanggalWaktu(pesanan.createdAt)} · Kasir: ${pesanan.kasirNama}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/pesanan')}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>
        }
      />

      {/* Status & Aksi */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <StatusBadge status={pesanan.status} />
            </div>

            {/* Tombol aksi berdasarkan status */}
            <div className="ml-auto flex flex-wrap gap-2">
              {pesanan.status === 'Baru' && (
                <Button
                  onClick={() => setShowProsesConfirm(true)}
                  loading={isUpdating}
                  size="sm"
                >
                  Proses Pesanan
                </Button>
              )}

              {pesanan.status === 'Diproses' && (
                <Button
                  onClick={() => setShowSiapKirimConfirm(true)}
                  loading={isUpdating}
                  size="sm"
                >
                  Tandai Siap Kirim
                </Button>
              )}

              {pesanan.status === 'Siap Kirim' && (
                <Link href={`/pengiriman/baru?pesananId=${id}`}>
                  <Button size="sm">Buat Jadwal Pengiriman</Button>
                </Link>
              )}

              {!statusFinal && !dalamPengiriman && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBatalModal(true)}
                  disabled={isUpdating}
                >
                  Batalkan Pesanan
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Info Pelanggan + Ringkasan */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info Pelanggan */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pelanggan</CardTitle>
          </CardHeader>
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
                  <MetodePengirimanLabel metode={pesanan.metodePengiriman} />
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

        {/* Ringkasan Finansial */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Pembayaran</CardTitle>
          </CardHeader>
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
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <dt className="text-base font-semibold text-gray-900">Total</dt>
                  <dd className="text-xl font-bold text-green-700">{formatRupiah(pesanan.total)}</dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Item */}
      <Card>
        <CardHeader>
          <CardTitle>Item Pesanan</CardTitle>
        </CardHeader>
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
                {pesanan.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 font-medium text-gray-900">{item.produkNama}</td>
                    <td className="py-3 text-gray-500">{item.produkSku}</td>
                    <td className="py-3 text-center text-gray-700">{item.qty}</td>
                    <td className="py-3 text-right text-gray-700">{formatRupiah(item.hargaSatuan)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {formatRupiah(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Catatan */}
      {pesanan.catatan && (
        <Card>
          <CardHeader>
            <CardTitle>Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{pesanan.catatan}</p>
          </CardContent>
        </Card>
      )}

      {/* Modal Konfirmasi Proses */}
      <ConfirmModal
        open={showProsesConfirm}
        onClose={() => setShowProsesConfirm(false)}
        onConfirm={handleProsesPesanan}
        title="Proses Pesanan"
        description={`Ubah status pesanan ${pesanan.nomorPesanan} menjadi "Diproses"?`}
        confirmLabel="Ya, Proses"
        cancelLabel="Batal"
        variant="default"
        loading={isUpdating}
      />

      {/* Modal Konfirmasi Siap Kirim */}
      <ConfirmModal
        open={showSiapKirimConfirm}
        onClose={() => setShowSiapKirimConfirm(false)}
        onConfirm={handleTandaiSiapKirim}
        title="Tandai Siap Kirim"
        description={`Ubah status pesanan ${pesanan.nomorPesanan} menjadi "Siap Kirim"?`}
        confirmLabel="Ya, Siap Kirim"
        cancelLabel="Batal"
        variant="default"
        loading={isUpdating}
      />

      {/* Modal Batalkan */}
      <Modal
        open={showBatalModal}
        onClose={() => {
          setShowBatalModal(false)
          setAlasanBatal('')
          setBatalError('')
        }}
        title="Batalkan Pesanan"
        description={`Batalkan pesanan ${pesanan.nomorPesanan}? Tindakan ini tidak dapat dibatalkan.`}
        size="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Alasan Pembatalan"
            required
            placeholder="Masukkan alasan pembatalan pesanan..."
            value={alasanBatal}
            onChange={(e) => {
              setAlasanBatal(e.target.value)
              if (batalError) setBatalError('')
            }}
            error={batalError}
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowBatalModal(false)
                setAlasanBatal('')
                setBatalError('')
              }}
              disabled={isUpdating}
            >
              Tutup
            </Button>
            <Button
              variant="destructive"
              onClick={handleBatalkan}
              loading={isUpdating}
            >
              Batalkan Pesanan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
