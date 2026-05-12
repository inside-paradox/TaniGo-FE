'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Pagination } from '@/components/shared/pagination'
import { SearchInput } from '@/components/shared/search-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth-store'
import { useTransferStokList } from '@/hooks/use-transfer-stok'
import { formatTanggalWaktu } from '@/lib/utils'
import type { TransferStok, StatusTransferStok } from '@/types'

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'Menunggu Persetujuan', label: 'Menunggu Persetujuan' },
  { value: 'Disetujui', label: 'Disetujui' },
  { value: 'Ditolak', label: 'Ditolak' },
  { value: 'Dikirim', label: 'Dikirim' },
  { value: 'Selesai', label: 'Selesai' },
]

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

const columns: ColumnDef<TransferStok>[] = [
  {
    accessorKey: 'nomorTransfer',
    header: 'No. Transfer',
    cell: ({ row }) => (
      <Link
        href={`/transfer-stok/${row.original.id}`}
        className="font-medium text-green-700 hover:underline"
      >
        {row.original.nomorTransfer}
      </Link>
    ),
  },
  {
    accessorKey: 'tokNama',
    header: 'Toko',
    cell: ({ getValue }) => <span className="text-gray-900">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'gudangNama',
    header: 'Gudang',
    cell: ({ getValue }) => <span className="text-gray-600">{getValue<string>()}</span>,
  },
  {
    id: 'jumlahItem',
    header: 'Item',
    cell: ({ row }) => (
      <span className="text-gray-700">{row.original.items.length} produk</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue<StatusTransferStok>()
      return <Badge variant={statusVariant(s)}>{s}</Badge>
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Tanggal',
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-gray-500">{formatTanggalWaktu(getValue<string>())}</span>
    ),
  },
]

export default function TransferStokPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const isGudang = user?.tipeCabang === 'gudang'

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useTransferStokList({
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
    sortBy: sorting[0]?.id,
    sortOrder: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
  })

  const handleSortingChange = (
    updater: SortingState | ((prev: SortingState) => SortingState)
  ) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater
    setSorting(next)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transfer Stok"
        subtitle={
          isGudang
            ? `${data?.meta.total ?? 0} permintaan masuk`
            : `${data?.meta.total ?? 0} permintaan stok`
        }
        actions={
          !isGudang && (
            <Button onClick={() => router.push('/transfer-stok/baru')}>
              <Plus className="h-4 w-4" />
              Buat Permintaan
            </Button>
          )
        }
      />

      <Card>
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(val) => { setSearch(val); setPage(1) }}
              placeholder="Cari nomor transfer..."
              className="w-full sm:w-72"
            />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <DataTable
            columns={columns}
            data={data?.data ?? []}
            loading={isLoading}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            emptyText="Belum ada transfer stok"
          />

          {data && data.meta.total > 0 && (
            <Pagination
              page={page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1) }}
            />
          )}
        </div>
      </Card>
    </div>
  )
}
