'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Pagination } from '@/components/shared/pagination'
import { SearchInput } from '@/components/shared/search-input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { auditLogsApi, type AuditLog } from '@/lib/api/audit-logs'
import { formatTanggalWaktu } from '@/lib/utils'

const MODUL_OPTIONS = [
  'Produk', 'Inventori', 'Purchase Order', 'Pesanan',
  'Pelanggan VIP', 'Pengiriman', 'Pengguna', 'Pengaturan',
]

function getColumns(): ColumnDef<AuditLog>[] {
  return [
    {
      accessorKey: 'createdAt',
      header: 'Waktu',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">{formatTanggalWaktu(getValue<string>())}</span>
      ),
    },
    {
      accessorKey: 'userNama',
      header: 'Pengguna',
      cell: ({ getValue }) => <span className="font-medium text-gray-900">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'modul',
      header: 'Modul',
      cell: ({ getValue }) => (
        <Badge variant="info">{getValue<string>()}</Badge>
      ),
    },
    {
      accessorKey: 'aksi',
      header: 'Aksi',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-700">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'nilaiLama',
      header: 'Nilai Lama',
      cell: ({ getValue }) => {
        const val = getValue<Record<string, unknown> | null>()
        if (!val) return <span className="text-gray-400">—</span>
        return (
          <pre className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-500">
            {JSON.stringify(val)}
          </pre>
        )
      },
    },
    {
      accessorKey: 'nilaiBaru',
      header: 'Nilai Baru',
      cell: ({ getValue }) => {
        const val = getValue<Record<string, unknown> | null>()
        if (!val) return <span className="text-gray-400">—</span>
        return (
          <pre className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-green-700">
            {JSON.stringify(val)}
          </pre>
        )
      },
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-gray-400">{getValue<string>() || '—'}</span>
      ),
    },
  ]
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modulFilter, setModulFilter] = useState('')
  const [tanggalDari, setTanggalDari] = useState('')
  const [tanggalSampai, setTanggalSampai] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { page, search, modulFilter, tanggalDari, tanggalSampai, sorting }],
    queryFn: () =>
      auditLogsApi.getAll({
        page,
        limit: 25,
        search: search || undefined,
        modul: modulFilter || undefined,
        tanggalDari: tanggalDari || undefined,
        tanggalSampai: tanggalSampai || undefined,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
      }),
    placeholderData: (prev) => prev,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Audit"
        subtitle="Rekaman semua perubahan data penting — tidak bisa diedit atau dihapus"
      />

      <Card>
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap gap-3">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1) }}
              placeholder="Cari pengguna atau aksi..."
              className="w-full sm:w-56"
            />
            <select
              value={modulFilter}
              onChange={(e) => { setModulFilter(e.target.value); setPage(1) }}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-green-500 focus:outline-none"
            >
              <option value="">Semua Modul</option>
              {MODUL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={tanggalDari}
                onChange={(e) => { setTanggalDari(e.target.value); setPage(1) }}
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none"
              />
              <span className="text-gray-400 text-sm">s/d</span>
              <input
                type="date"
                value={tanggalSampai}
                onChange={(e) => { setTanggalSampai(e.target.value); setPage(1) }}
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <DataTable
            columns={getColumns()}
            data={data?.data ?? []}
            loading={isLoading}
            sorting={sorting}
            onSortingChange={(u) => {
              const next = typeof u === 'function' ? u(sorting) : u
              setSorting(next)
              setPage(1)
            }}
            emptyText="Belum ada log audit"
          />

          {data && data.meta.total > 0 && (
            <Pagination
              page={page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              limit={25}
              onPageChange={setPage}
            />
          )}
        </div>
      </Card>
    </div>
  )
}
