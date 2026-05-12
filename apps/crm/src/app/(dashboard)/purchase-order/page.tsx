'use client'

import { useState } from 'react'
import { Plus, FileText } from 'lucide-react'
import Link from 'next/link'
import type { SortingState } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Pagination } from '@/components/shared/pagination'
import { SearchInput } from '@/components/shared/search-input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePurchaseOrders } from '@/hooks/use-purchase-orders'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import type { PurchaseOrder, StatusPO } from '@/types'

function StatusPOBadge({ status }: { status: StatusPO }) {
  const map: Record<StatusPO, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
    Draft: { label: 'Draft', variant: 'default' },
    'Dikirim ke Supplier': { label: 'Dikirim', variant: 'info' },
    'Sebagian Diterima': { label: 'Sebagian Diterima', variant: 'warning' },
    Diterima: { label: 'Diterima', variant: 'success' },
    Dibatalkan: { label: 'Dibatalkan', variant: 'danger' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

function getPOColumns(): ColumnDef<PurchaseOrder>[] {
  return [
    {
      accessorKey: 'nomorPO',
      header: 'Nomor PO',
      enableSorting: true,
      cell: ({ row }) => (
        <Link href={`/purchase-order/${row.original.id}`} className="font-mono text-sm font-medium text-green-700 hover:underline">
          {row.original.nomorPO}
        </Link>
      ),
    },
    {
      accessorKey: 'supplierNama',
      header: 'Supplier',
      enableSorting: true,
      cell: ({ getValue }) => <span className="font-medium text-gray-900">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'totalQty',
      header: 'Item',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.items.length} jenis ({row.original.totalQty} unit)</span>
      ),
    },
    {
      accessorKey: 'totalKeseluruhan',
      header: 'Total',
      enableSorting: true,
      cell: ({ getValue }) => <span className="font-semibold text-gray-900">{formatRupiah(getValue<number>())}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status PO',
      cell: ({ getValue }) => <StatusPOBadge status={getValue<StatusPO>()} />,
    },
    {
      accessorKey: 'statusPembayaran',
      header: 'Pembayaran',
      cell: ({ getValue }) => {
        const s = getValue<string>()
        return <Badge variant={s === 'Lunas' ? 'success' : s === 'Sebagian' ? 'warning' : 'danger'}>{s}</Badge>
      },
    },
    {
      accessorKey: 'sisaHutang',
      header: 'Sisa Hutang',
      cell: ({ getValue }) => {
        const sisa = getValue<number>()
        return <span className={`text-sm font-medium ${sisa > 0 ? 'text-red-600' : 'text-gray-400'}`}>{sisa > 0 ? formatRupiah(sisa) : '—'}</span>
      },
    },
    {
      accessorKey: 'estimasiTanggalTiba',
      header: 'Est. Tiba',
      cell: ({ getValue }) => {
        const val = getValue<string | null>()
        return <span className="text-sm text-gray-500">{val ? formatTanggal(val) : '—'}</span>
      },
    },
    {
      id: 'aksi',
      header: '',
      cell: ({ row }) => (
        <Link href={`/purchase-order/${row.original.id}`}>
          <Button size="sm" variant="ghost"><FileText className="h-4 w-4 mr-1" />Detail</Button>
        </Link>
      ),
    },
  ]
}

export default function PurchaseOrderPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const { data, isLoading } = usePurchaseOrders({
    page, limit: 25,
    search: search || undefined,
    status: statusFilter || undefined,
    sortBy: sorting[0]?.id,
    sortOrder: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Order"
        subtitle={`${data?.meta.total ?? 0} PO terdaftar`}
        actions={
          <Link href="/purchase-order/baru">
            <Button><Plus className="h-4 w-4" />Buat PO Baru</Button>
          </Link>
        }
      />
      <Card>
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Cari nomor PO atau supplier..." className="w-full sm:w-64" />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-green-500 focus:outline-none">
              <option value="">Semua Status</option>
              {(['Draft', 'Dikirim ke Supplier', 'Sebagian Diterima', 'Diterima', 'Dibatalkan'] as StatusPO[]).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <DataTable
            columns={getPOColumns()}
            data={data?.data ?? []}
            loading={isLoading}
            sorting={sorting}
            onSortingChange={(u) => { const next = typeof u === 'function' ? u(sorting) : u; setSorting(next); setPage(1) }}
            emptyText="Belum ada Purchase Order"
          />
          {data && data.meta.total > 0 && (
            <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} limit={25} onPageChange={setPage} />
          )}
        </div>
      </Card>
    </div>
  )
}
