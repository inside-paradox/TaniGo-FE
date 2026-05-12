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
import { useOrders } from '@/hooks/use-orders'
import { formatRupiah, formatTanggalWaktu } from '@/lib/utils'
import type { Pesanan, StatusPesanan } from '@/types'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Semua Status' },
  { value: 'Baru', label: 'Baru' },
  { value: 'Diproses', label: 'Diproses' },
  { value: 'Siap Kirim', label: 'Siap Kirim' },
  { value: 'Dalam Pengiriman', label: 'Dalam Pengiriman' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Dibatalkan', label: 'Dibatalkan' },
]

function statusBadgeVariant(status: StatusPesanan) {
  switch (status) {
    case 'Baru':
      return 'info'
    case 'Diproses':
      return 'warning'
    case 'Siap Kirim':
      return 'purple'
    case 'Dalam Pengiriman':
      return 'info'
    case 'Selesai':
      return 'success'
    case 'Dibatalkan':
      return 'danger'
    default:
      return 'default'
  }
}

const columns: ColumnDef<Pesanan>[] = [
  {
    accessorKey: 'nomorPesanan',
    header: 'No. Pesanan',
    cell: ({ row }) => (
      <Link
        href={`/pesanan/${row.original.id}`}
        className="font-medium text-green-700 hover:underline"
      >
        {row.original.nomorPesanan}
      </Link>
    ),
  },
  {
    accessorKey: 'pelangganNama',
    header: 'Pelanggan',
    cell: ({ getValue }) => (
      <span className="text-gray-900">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ getValue }) => (
      <span className="font-medium text-gray-900">{formatRupiah(getValue<number>())}</span>
    ),
  },
  {
    accessorKey: 'metodePembayaran',
    header: 'Metode Pembayaran',
    cell: ({ getValue }) => <span className="text-gray-700">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue<StatusPesanan>()
      return <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
    },
  },
  {
    accessorKey: 'kasirNama',
    header: 'Kasir',
    cell: ({ getValue }) => <span className="text-gray-600">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Waktu',
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-gray-500">{formatTanggalWaktu(getValue<string>())}</span>
    ),
  },
]

export default function PesananPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useOrders({
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

  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  const handleStatus = (val: string) => {
    setStatus(val)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Pesanan"
        subtitle={`${data?.meta.total ?? 0} pesanan ditemukan`}
        actions={
          <Button onClick={() => router.push('/pesanan/baru')}>
            <Plus className="h-4 w-4" />
            Buat Pesanan
          </Button>
        }
      />

      <Card>
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="Cari nomor pesanan atau pelanggan..."
              className="w-full sm:w-72"
            />
            <select
              value={status}
              onChange={(e) => handleStatus(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <DataTable
            columns={columns}
            data={data?.data ?? []}
            loading={isLoading}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            emptyText="Belum ada pesanan"
          />

          {data && data.meta.total > 0 && (
            <Pagination
              page={page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l)
                setPage(1)
              }}
            />
          )}
        </div>
      </Card>
    </div>
  )
}
