'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmModal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { useStokOpname, useSubmitStokOpname, useApproveStokOpname, useDeleteStokOpname } from '@/hooks/use-stok-opname'
import { useAuthStore } from '@/store/auth-store'
import { formatTanggal, formatTanggalWaktu } from '@/lib/utils'
import type { StatusStokOpname, StokOpnameItem } from '@/types'

function StatusBadge({ status }: { status: StatusStokOpname }) {
  const map: Record<StatusStokOpname, 'default' | 'info' | 'success'> = {
    Draft: 'default',
    Diajukan: 'info',
    Disetujui: 'success',
  }
  return <Badge variant={map[status]}>{status}</Badge>
}

function SelisihCell({ item }: { item: StokOpnameItem }) {
  const { selisih } = item
  if (selisih === 0) return <span className="text-sm text-gray-400">Sesuai</span>
  return (
    <span className={`text-sm font-semibold ${selisih > 0 ? 'text-green-600' : 'text-red-600'}`}>
      {selisih > 0 ? '+' : ''}{selisih} {item.satuan}
    </span>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

export default function StokOpnameDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: opname, isLoading } = useStokOpname(id)
  const { mutate: submit, isPending: isSubmitting } = useSubmitStokOpname()
  const { mutate: approve, isPending: isApproving } = useApproveStokOpname()
  const { mutate: hapus, isPending: isDeleting } = useDeleteStokOpname()

  if (isLoading) return <DetailSkeleton />
  if (!opname) return <div className="text-center text-sm text-gray-500 py-16">Stok opname tidak ditemukan.</div>

  const isDraft = opname.status === 'Draft'
  const isDiajukan = opname.status === 'Diajukan'
  const isAdmin = user?.role === 'admin'
  const isSuperadmin = user?.role === 'superadmin'

  const kurang = opname.items.filter((i) => i.selisih < 0)
  const lebih = opname.items.filter((i) => i.selisih > 0)
  const sesuai = opname.items.filter((i) => i.selisih === 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={opname.nomorOpname}
        subtitle={opname.cabangNama}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/stok-opname')}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            {isDraft && isAdmin && (
              <>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                  Hapus Draft
                </Button>
                <Button onClick={() => setShowSubmitConfirm(true)}>
                  <Send className="h-4 w-4" />
                  Ajukan
                </Button>
              </>
            )}
            {isDiajukan && isSuperadmin && (
              <Button onClick={() => setShowApproveConfirm(true)}>
                <CheckCircle className="h-4 w-4" />
                Setujui & Update Stok
              </Button>
            )}
          </div>
        }
      />

      {/* Info card */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
            <div className="mt-1"><StatusBadge status={opname.status} /></div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Produk</p>
            <p className="mt-1 font-semibold">{opname.items.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Dibuat</p>
            <p className="mt-1 text-sm">{formatTanggal(opname.createdAt)}</p>
          </div>
          {opname.submittedAt && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Diajukan</p>
              <p className="mt-1 text-sm">{formatTanggalWaktu(opname.submittedAt)}</p>
            </div>
          )}
          {opname.approvedAt && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Disetujui</p>
              <p className="mt-1 text-sm">{formatTanggalWaktu(opname.approvedAt)}</p>
            </div>
          )}
          {opname.catatan && (
            <div className="col-span-2 sm:col-span-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Catatan</p>
              <p className="mt-1 text-sm text-gray-700">{opname.catatan}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={kurang.length > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{kurang.length}</p>
            <p className="text-sm text-red-700">Kurang dari sistem</p>
          </CardContent>
        </Card>
        <Card className={lebih.length > 0 ? 'border-green-200 bg-green-50' : ''}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{lebih.length}</p>
            <p className="text-sm text-green-700">Lebih dari sistem</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{sesuai.length}</p>
            <p className="text-sm text-gray-500">Sesuai</p>
          </CardContent>
        </Card>
      </div>

      {/* Items table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Per Produk</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3 text-center">Stok Sistem</th>
                  <th className="px-4 py-3 text-center">Stok Fisik</th>
                  <th className="px-4 py-3 text-center">Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {opname.items.map((item) => (
                  <tr
                    key={item.id}
                    className={
                      item.selisih < 0
                        ? 'bg-red-50/50'
                        : item.selisih > 0
                        ? 'bg-green-50/50'
                        : ''
                    }
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.produkNama}</p>
                      <p className="text-xs text-gray-400">{item.produkSku}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className="font-medium">{item.stokSistem}</span>
                      <span className="ml-1 text-gray-400">{item.satuan}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className="font-medium">{item.stokFisik}</span>
                      <span className="ml-1 text-gray-400">{item.satuan}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <SelisihCell item={item} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={() => submit(id, { onSuccess: () => setShowSubmitConfirm(false) })}
        title="Ajukan Stok Opname?"
        description="Stok sistem akan diperbarui sesuai hasil hitung fisik. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ajukan & Update Stok"
        loading={isSubmitting}
      />

      <ConfirmModal
        open={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={() => approve(id, { onSuccess: () => setShowApproveConfirm(false) })}
        title="Setujui Stok Opname?"
        description="Stok cabang akan diperbarui sesuai hasil hitung fisik. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Setujui & Update Stok"
        loading={isApproving}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => hapus(id, { onSuccess: () => router.push('/stok-opname') })}
        title="Hapus Draft?"
        description={`Draft ${opname.nomorOpname} akan dihapus permanen.`}
        confirmLabel="Hapus"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  )
}
