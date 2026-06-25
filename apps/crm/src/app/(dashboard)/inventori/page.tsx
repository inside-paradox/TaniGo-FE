'use client'

import { useState } from 'react'
import { Plus, Package, AlertTriangle, XCircle, CalendarClock, History, Truck } from 'lucide-react'
import type { SortingState } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Pagination } from '@/components/shared/pagination'
import { SearchInput } from '@/components/shared/search-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmModal } from '@/components/ui/modal'
import { SupplierForm } from '@/components/inventori/supplier-form'
import {
  useDashboardInventori,
  usePergerakanStok,
  useSuppliers,
  useDeleteSupplier,
} from '@/hooks/use-inventory'
import { useAuthStore } from '@/store/auth-store'
import { formatTanggalWaktu, formatTanggal } from '@/lib/utils'
import type { PergerakanStok, Supplier } from '@/types'

type TabKey = 'stok' | 'riwayat' | 'supplier'

function StatCard({
  icon,
  label,
  value,
  color,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-12" />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className={`rounded-xl p-3 ${color}`}>{icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getPergerakanColumns(showLokasi: boolean): ColumnDef<PergerakanStok>[] {
  return [
    {
      accessorKey: 'createdAt',
      header: 'Waktu',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{formatTanggalWaktu(getValue<string>())}</span>
      ),
    },
    {
      accessorKey: 'produkNama',
      header: 'Produk',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.produkNama}</p>
          <p className="text-xs text-gray-400">{row.original.produkSku}</p>
        </div>
      ),
    },
    ...(showLokasi
      ? [
          {
            accessorKey: 'cabangNama',
            header: 'Lokasi',
            cell: ({ getValue }) => (
              <Badge variant="default">{getValue<string>()}</Badge>
            ),
          } as ColumnDef<PergerakanStok>,
        ]
      : []),
    {
      accessorKey: 'jenis',
      header: 'Jenis',
      cell: ({ getValue }) => {
        const jenis = getValue<string>()
        return (
          <Badge variant={jenis === 'masuk' ? 'success' : jenis === 'keluar' ? 'danger' : 'warning'}>
            {jenis === 'masuk' ? 'Masuk' : jenis === 'keluar' ? 'Keluar' : 'Penyesuaian'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'jumlah',
      header: 'Jumlah',
      cell: ({ row }) => {
        const { jumlah, jenis } = row.original
        return (
          <span className={`font-semibold ${jenis === 'masuk' ? 'text-green-600' : jenis === 'keluar' ? 'text-red-600' : 'text-yellow-600'}`}>
            {jenis === 'masuk' ? '+' : jenis === 'keluar' ? '-' : '±'}{Math.abs(jumlah)}
          </span>
        )
      },
    },
    {
      accessorKey: 'stokSebelum',
      header: 'Stok Sebelum',
      cell: ({ getValue }) => <span className="text-sm">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'stokSesudah',
      header: 'Stok Sesudah',
      cell: ({ getValue }) => <span className="text-sm font-medium">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'referensi',
      header: 'Referensi',
      cell: ({ getValue }) => <span className="text-sm text-gray-500">{getValue<string>() || '—'}</span>,
    },
    {
      accessorKey: 'userNama',
      header: 'User',
      cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'catatan',
      header: 'Catatan',
      cell: ({ getValue }) => <span className="text-sm text-gray-500">{getValue<string>() || '—'}</span>,
    },
  ]
}

function getSupplierColumns(
  onEdit: (s: Supplier) => void,
  onDelete: (s: Supplier) => void
): ColumnDef<Supplier>[] {
  return [
    {
      accessorKey: 'nama',
      header: 'Nama Supplier',
      cell: ({ getValue }) => <span className="font-medium text-gray-900">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'kontak',
      header: 'Kontak',
      cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'alamat',
      header: 'Alamat',
      cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Bergabung',
      cell: ({ getValue }) => <span className="text-sm text-gray-500">{formatTanggal(getValue<string>())}</span>,
    },
    {
      id: 'aksi',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(row.original)}>Edit</Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => onDelete(row.original)}>Hapus</Button>
        </div>
      ),
    },
  ]
}

export default function InventoriPage() {
  const { user } = useAuthStore()
  const isGudang = user?.tipeCabang === 'gudang' || user?.role === 'superadmin'
  const isSuperadmin = user?.role === 'superadmin'

  const [tab, setTab] = useState<TabKey>('stok')
  const [supplierFormOpen, setSupplierFormOpen] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null)
  const [riwayatPage, setRiwayatPage] = useState(1)
  const [riwayatSearch, setRiwayatSearch] = useState('')
  const [riwayatSorting, setRiwayatSorting] = useState<SortingState>([])
  const [supplierPage, setSupplierPage] = useState(1)
  const [supplierSearch, setSupplierSearch] = useState('')

  const { data: dashboard, isLoading: dashLoading } = useDashboardInventori()
  const { data: riwayat, isLoading: riwayatLoading } = usePergerakanStok({
    page: riwayatPage,
    limit: 25,
    search: riwayatSearch || undefined,
    sortBy: riwayatSorting[0]?.id,
    sortOrder: riwayatSorting[0] ? (riwayatSorting[0].desc ? 'desc' : 'asc') : undefined,
  })
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers({
    page: supplierPage,
    limit: 25,
    search: supplierSearch || undefined,
  })
  const deleteMutation = useDeleteSupplier()

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'stok', label: 'Dashboard Stok', icon: <Package className="h-4 w-4" /> },
    { key: 'riwayat', label: 'Riwayat Pergerakan', icon: <History className="h-4 w-4" /> },
    ...(isGudang ? [{ key: 'supplier' as TabKey, label: 'Supplier', icon: <Truck className="h-4 w-4" /> }] : []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Inventori"
        subtitle={isGudang ? 'Monitor stok, pergerakan barang, dan supplier' : 'Monitor stok dan pergerakan barang'}
      />

      <div className="flex border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stok' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={<Package className="h-5 w-5 text-blue-600" />} label="Total Produk" value={dashboard?.totalProduk ?? 0} color="bg-blue-50" loading={dashLoading} />
            <StatCard icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />} label="Stok Menipis" value={dashboard?.produkMenipis ?? 0} color="bg-yellow-50" loading={dashLoading} />
            <StatCard icon={<XCircle className="h-5 w-5 text-red-600" />} label="Stok Habis" value={dashboard?.produkHabis ?? 0} color="bg-red-50" loading={dashLoading} />
            <StatCard icon={<CalendarClock className="h-5 w-5 text-orange-600" />} label="Kadaluwarsa ≤ 30 Hari" value={dashboard?.produkKedaluwarsa30Hari ?? 0} color="bg-orange-50" loading={dashLoading} />
          </div>

          {!dashLoading && (dashboard?.produkHabis ?? 0) > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <XCircle className="h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm text-red-700"><strong>{dashboard?.produkHabis} produk</strong> stoknya habis dan tidak tersedia untuk penjualan.</p>
            </div>
          )}
          {!dashLoading && (dashboard?.produkMenipis ?? 0) > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-500" />
              <p className="text-sm text-yellow-700"><strong>{dashboard?.produkMenipis} produk</strong> mendekati ambang batas stok. Segera lakukan restock.</p>
            </div>
          )}

          <Card>
            <CardHeader><CardTitle>Aksi Cepat</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { icon: <History className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-100', label: 'Riwayat Pergerakan', desc: 'Lacak masuk & keluar barang', action: () => setTab('riwayat'), hover: 'hover:border-blue-300 hover:bg-blue-50' },
                  isGudang ? { icon: <Truck className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-100', label: 'Manajemen Supplier', desc: 'Kelola data supplier', action: () => setTab('supplier'), hover: 'hover:border-purple-300 hover:bg-purple-50' } : null,
                ].filter(Boolean).map((item) => (
                  <button key={item!.label} onClick={item!.action} className={`flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left ${item!.hover} transition-colors`}>
                    <div className={`rounded-lg ${item!.bg} p-2`}>{item!.icon}</div>
                    <div>
                      <p className="font-medium text-gray-900">{item!.label}</p>
                      <p className="text-xs text-gray-500">{item!.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'riwayat' && (
        <Card>
          <div className="p-4 sm:p-6">
            <div className="mb-4">
              <SearchInput value={riwayatSearch} onChange={(v) => { setRiwayatSearch(v); setRiwayatPage(1) }} placeholder="Cari nama produk atau SKU..." className="w-full sm:w-72" />
            </div>
            <DataTable
              columns={getPergerakanColumns(isSuperadmin)}
              data={riwayat?.data ?? []}
              loading={riwayatLoading}
              sorting={riwayatSorting}
              onSortingChange={(u) => { const next = typeof u === 'function' ? u(riwayatSorting) : u; setRiwayatSorting(next); setRiwayatPage(1) }}
              emptyText="Belum ada riwayat pergerakan stok"
            />
            {riwayat && riwayat.meta.total > 0 && (
              <Pagination page={riwayatPage} totalPages={riwayat.meta.totalPages} total={riwayat.meta.total} limit={25} onPageChange={setRiwayatPage} />
            )}
          </div>
        </Card>
      )}

      {tab === 'supplier' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SearchInput value={supplierSearch} onChange={(v) => { setSupplierSearch(v); setSupplierPage(1) }} placeholder="Cari supplier..." className="w-full sm:w-72" />
            <Button onClick={() => { setEditSupplier(null); setSupplierFormOpen(true) }}>
              <Plus className="h-4 w-4" />
              Tambah Supplier
            </Button>
          </div>
          <Card>
            <div className="p-4 sm:p-6">
              <DataTable
                columns={getSupplierColumns(
                  (s) => { setEditSupplier(s); setSupplierFormOpen(true) },
                  (s) => setDeleteSupplier(s)
                )}
                data={suppliers?.data ?? []}
                loading={suppliersLoading}
                emptyText="Belum ada supplier"
              />
              {suppliers && suppliers.meta.total > 0 && (
                <Pagination page={supplierPage} totalPages={suppliers.meta.totalPages} total={suppliers.meta.total} limit={25} onPageChange={setSupplierPage} />
              )}
            </div>
          </Card>
        </div>
      )}

      <SupplierForm open={supplierFormOpen} onClose={() => { setSupplierFormOpen(false); setEditSupplier(null) }} supplier={editSupplier} />
      <ConfirmModal
        open={!!deleteSupplier}
        onClose={() => setDeleteSupplier(null)}
        onConfirm={async () => {
          if (deleteSupplier) { await deleteMutation.mutateAsync(deleteSupplier.id); setDeleteSupplier(null) }
        }}
        title="Hapus Supplier"
        description={`Yakin ingin menghapus supplier "${deleteSupplier?.nama}"?`}
        confirmLabel="Ya, Hapus"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
