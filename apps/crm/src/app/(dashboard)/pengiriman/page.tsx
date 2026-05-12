'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Pagination } from '@/components/shared/pagination'
import { SearchInput } from '@/components/shared/search-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDeliveries } from '@/hooks/use-deliveries'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import type { Pengiriman, StatusPengiriman } from '@/types'

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'Dijadwalkan', label: 'Dijadwalkan' },
  { value: 'Dalam Perjalanan', label: 'Dalam Perjalanan' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Gagal', label: 'Gagal' },
]

function statusVariant(status: StatusPengiriman) {
  switch (status) {
    case 'Dijadwalkan':
      return 'info'
    case 'Dalam Perjalanan':
      return 'warning'
    case 'Selesai':
      return 'success'
    case 'Gagal':
      return 'danger'
    default:
      return 'default'
  }
}

const columns: ColumnDef<Pengiriman>[] = [
  {
    accessorKey: 'nomorPengiriman',
    header: 'No. Pengiriman',
    cell: ({ row }) => (
      <Link
        href={`/pengiriman/${row.original.id}`}
        className="font-medium text-green-700 hover:underline"
      >
        {row.original.nomorPengiriman}
      </Link>
    ),
  },
  {
    accessorKey: 'driverNama',
    header: 'Driver',
    cell: ({ getValue }) => <span className="text-gray-900">{getValue<string>()}</span>,
  },
  {
    id: 'jumlahPesanan',
    header: 'Jml. Pesanan',
    cell: ({ row }) => (
      <span className="font-medium text-gray-900">{row.original.pesananList.length}</span>
    ),
  },
  {
    accessorKey: 'tanggalPengiriman',
    header: 'Tanggal Kirim',
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-gray-700">{formatTanggal(getValue<string>())}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue<StatusPengiriman>()
      return <Badge variant={statusVariant(s)}>{s}</Badge>
    },
  },
  {
    id: 'biayaTotal',
    header: 'Biaya',
    cell: ({ row }) => {
      const biaya = row.original.biaya
      return (
        <span className="text-gray-700">
          {biaya ? formatRupiah(biaya.total) : '—'}
        </span>
      )
    },
  },
]

export default function PengirimanPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useDeliveries({
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
        title="Daftar Pengiriman"
        subtitle={`${data?.meta.total ?? 0} pengiriman ditemukan`}
        actions={
          <Link href="/pengiriman/baru">
            <Button>
              <Plus className="h-4 w-4" />
              Buat Jadwal Pengiriman
            </Button>
          </Link>
        }
      />

      <Card>
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val)
                setPage(1)
              }}
              placeholder="Cari nomor pengiriman atau driver..."
              className="w-full sm:w-72"
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
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
            emptyText="Belum ada data pengiriman"
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
