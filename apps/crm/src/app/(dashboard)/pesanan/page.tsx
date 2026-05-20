'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Printer } from 'lucide-react'
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
import { printStrukPOS } from '@/lib/print'
import type { Pesanan, StatusPesanan } from '@/types'

type TabId = 'pos' | 'manual'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Semua Status' },
  { value: 'Baru', label: 'Baru' },
  { value: 'Dikonfirmasi', label: 'Dikonfirmasi' },
  { value: 'Diproses', label: 'Diproses' },
  { value: 'Siap', label: 'Siap' },
  { value: 'Dikirim', label: 'Dikirim' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Dibatalkan', label: 'Dibatalkan' },
]

const STATUS_POS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'ada_retur', label: 'Ada Retur' },
]

function statusBadgeVariant(status: StatusPesanan) {
  switch (status) {
    case 'Baru': return 'info'
    case 'Dikonfirmasi': return 'info'
    case 'Diproses': return 'warning'
    case 'Siap': return 'purple'
    case 'Dikirim': return 'info'
    case 'Selesai': return 'success'
    case 'Dibatalkan': return 'danger'
    default: return 'default'
  }
}

// ── Kolom Transaksi POS ───────────────────────────────────────────────────────

const columnsPOS: ColumnDef<Pesanan>[] = [
  {
    accessorKey: 'nomorPesanan',
    header: 'No. Transaksi',
    cell: ({ row }) => (
      <Link href={`/pesanan/${row.original.id}`} className="font-medium text-green-700 hover:underline">
        {row.original.nomorPesanan}
      </Link>
    ),
  },
  {
    accessorKey: 'kasirNama',
    header: 'Kasir',
    cell: ({ getValue }) => <span className="text-gray-600">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'metodePembayaran',
    header: 'Pembayaran',
    cell: ({ getValue }) => <span className="text-gray-700">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ getValue }) => (
      <span className="font-semibold text-gray-900">{formatRupiah(getValue<number>())}</span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Badge variant="success">Selesai</Badge>
        {row.original.hasRetur && <Badge variant="warning">Ada Retur</Badge>}
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Waktu',
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-gray-500">{formatTanggalWaktu(getValue<string>())}</span>
    ),
  },
  {
    id: 'aksi',
    header: '',
    cell: ({ row }) => (
      <button
        onClick={(e) => { e.stopPropagation(); printStrukPOS(row.original) }}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        title="Cetak Struk"
      >
        <Printer className="h-3.5 w-3.5" />
        Struk
      </button>
    ),
  },
]

// ── Kolom Transaksi Manual ────────────────────────────────────────────────────

const columnsManual: ColumnDef<Pesanan>[] = [
  {
    accessorKey: 'nomorPesanan',
    header: 'No. Pesanan',
    cell: ({ row }) => (
      <Link href={`/pesanan/${row.original.id}`} className="font-medium text-green-700 hover:underline">
        {row.original.nomorPesanan}
      </Link>
    ),
  },
  {
    accessorKey: 'pelangganNama',
    header: 'Pelanggan',
    cell: ({ getValue }) => <span className="text-gray-900">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ getValue }) => (
      <span className="font-semibold text-gray-900">{formatRupiah(getValue<number>())}</span>
    ),
  },
  {
    accessorKey: 'metodePengiriman',
    header: 'Pengiriman',
    cell: ({ getValue }) => <span className="text-gray-700">{getValue<string>() ?? '—'}</span>,
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
    header: 'Dibuat oleh',
    cell: ({ getValue }) => <span className="text-gray-600">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Tanggal',
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-gray-500">{formatTanggalWaktu(getValue<string>())}</span>
    ),
  },
]

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PesananPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('manual')
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
    sumber: activeTab,
    sortBy: sorting[0]?.id,
    sortOrder: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
  })

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    setPage(1)
    setSearch('')
    setStatus('')
    setSorting([])
  }

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater
    setSorting(next)
    setPage(1)
  }

  const statusOpts = activeTab === 'manual' ? STATUS_OPTIONS : STATUS_POS_OPTIONS

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pesanan"
        subtitle={`${data?.meta.total ?? 0} pesanan ditemukan`}
        actions={
          activeTab === 'manual' && (
            <Button onClick={() => router.push('/pesanan/baru')}>
              <Plus className="h-4 w-4" />
              Buat Pesanan
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
        {([
          { id: 'pos', label: 'Transaksi POS' },
          { id: 'manual', label: 'Transaksi Manual' },
        ] as { id: TabId; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1) }}
              placeholder={activeTab === 'manual' ? 'Cari no. pesanan atau pelanggan...' : 'Cari no. transaksi atau kasir...'}
              className="w-full sm:w-72"
            />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {statusOpts.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <DataTable
            columns={activeTab === 'manual' ? columnsManual : columnsPOS}
            data={data?.data ?? []}
            loading={isLoading}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            emptyText={activeTab === 'manual' ? 'Belum ada transaksi manual' : 'Belum ada transaksi POS'}
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
