'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ClipboardCheck, Printer, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmModal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { useStokOpnameList, useDeleteStokOpname } from '@/hooks/use-stok-opname'
import { useProducts } from '@/hooks/use-products'
import { useCabangInventory } from '@/hooks/use-inventory'
import { useAuthStore } from '@/store/auth-store'
import { formatTanggal } from '@/lib/utils'
import { printFormulirStokOpname } from '@/lib/print'
import type { StatusStokOpname, StokOpname } from '@/types'

const STATUS_TABS: { id: StatusStokOpname | 'semua'; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'Draft', label: 'Draft' },
  { id: 'Diajukan', label: 'Diajukan' },
  { id: 'Disetujui', label: 'Disetujui' },
]

function StatusBadge({ status }: { status: StatusStokOpname }) {
  const map: Record<StatusStokOpname, 'default' | 'info' | 'success'> = {
    Draft: 'default', Diajukan: 'info', Disetujui: 'success',
  }
  return <Badge variant={map[status]}>{status}</Badge>
}

function SelisihBadge({ selisih }: { selisih: number }) {
  if (selisih === 0) return <span className="text-sm text-gray-400">Tidak ada</span>
  const label = `${selisih > 0 ? '+' : ''}${selisih} item selisih`
  return (
    <span className={`text-sm font-medium ${selisih > 0 ? 'text-green-600' : 'text-red-600'}`}>
      {label}
    </span>
  )
}

export default function StokOpnamePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [tab, setTab] = useState<StatusStokOpname | 'semua'>('semua')
  const [deleteTarget, setDeleteTarget] = useState<StokOpname | null>(null)

  const isSuperadmin = user?.role === 'superadmin'

  const { data, isLoading } = useStokOpnameList({
    status: tab === 'semua' ? undefined : tab,
    cabangId: isSuperadmin ? undefined : (user?.cabangId ?? undefined),
    page: 1, limit: 50,
  })
  const { mutate: hapus, isPending: isDeleting } = useDeleteStokOpname()

  const { data: produkData } = useProducts({ page: 1, limit: 200 })
  const { data: inventoryData } = useCabangInventory(user?.cabangId ?? undefined)

  const handleCetakFormulir = () => {
    const produkList = produkData?.data ?? []
    const inventory = inventoryData ?? []
    printFormulirStokOpname(user?.cabang ?? 'Cabang', produkList, inventory)
  }

  const list = data?.data ?? []
  const totalSelisih = (items: StokOpname['items']) =>
    items.filter((i) => i.selisih !== 0).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stok Opname"
        subtitle="Rekonsiliasi stok fisik dengan data sistem"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCetakFormulir}
              disabled={!produkData}
            >
              <Printer className="h-4 w-4" />
              Cetak Formulir
            </Button>
            <Button onClick={() => router.push('/stok-opname/baru')}>
              <Plus className="h-4 w-4" />
              Buat Stok Opname
            </Button>
          </div>
        }
      />

      {/* Status tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
            <ClipboardCheck className="h-10 w-10" />
            <p className="text-sm">Belum ada stok opname</p>
            <Button variant="outline" size="sm" onClick={() => router.push('/stok-opname/baru')}>
              Buat Sekarang
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((opname) => (
            <Card
              key={opname.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/stok-opname/${opname.id}`)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{opname.nomorOpname}</p>
                    <StatusBadge status={opname.status} />
                  </div>
                  <p className="text-sm text-gray-500">{opname.cabangNama}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-gray-700">{opname.items.length} produk</p>
                  <SelisihBadge selisih={totalSelisih(opname.items)} />
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm text-gray-500">{formatTanggal(opname.createdAt)}</p>
                  {opname.submittedAt && (
                    <p className="text-xs text-gray-400">Diajukan {formatTanggal(opname.submittedAt)}</p>
                  )}
                </div>
                {opname.status === 'Draft' && (user?.role === 'admin' || user?.role === 'manajer') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(opname) }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) hapus(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
        }}
        title="Hapus Draft Stok Opname?"
        description={`Draft ${deleteTarget?.nomorOpname} akan dihapus permanen.`}
        confirmLabel="Hapus"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  )
}
