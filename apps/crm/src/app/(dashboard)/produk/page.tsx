'use client'

import { useState } from 'react'
import { Plus, PackageX, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { SortingState } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Pagination } from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProdukForm } from '@/components/produk/produk-form'
import { ProdukFilter } from '@/components/produk/produk-filter'
import { getProdukColumns } from '@/components/produk/produk-columns'
import { useProducts } from '@/hooks/use-products'
import { useAuthStore } from '@/store/auth-store'
import type { Produk, StatusStok } from '@/types'

interface FilterState {
  search: string
  kategori: string
  statusStok: StatusStok | ''
  satuan: string
}

export default function ProdukPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const canManage = user?.role === 'superadmin'
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    kategori: '',
    statusStok: '',
    satuan: '',
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editProduk, setEditProduk] = useState<Produk | null>(null)

  const { data, isLoading } = useProducts({
    page,
    limit,
    search: filter.search || undefined,
    kategori: filter.kategori || undefined,
    statusStok: filter.statusStok || undefined,
    satuan: filter.satuan || undefined,
    sortBy: sorting[0]?.id,
    sortOrder: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
  })

  const handleFilterChange = (newFilter: FilterState) => {
    setFilter(newFilter)
    setPage(1)
  }

  const handleSortingChange = (
    updater: SortingState | ((prev: SortingState) => SortingState)
  ) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater
    setSorting(newSorting)
    setPage(1)
  }

  const handleEdit = (produk: Produk) => {
    setEditProduk(produk)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setEditProduk(null)
  }

  const columns = getProdukColumns(canManage ? handleEdit : null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Katalog Produk"
        subtitle={`${data?.meta.total ?? 0} produk terdaftar`}
        actions={
          canManage ? (
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => router.push('/produk/kategori')}>
                <Tag className="h-4 w-4" />
                Kelola Kategori
              </Button>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Tambah Produk
              </Button>
            </div>
          ) : undefined
        }
      />

      <Card>
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <ProdukFilter filter={filter} onChange={handleFilterChange} />
          </div>

          {!isLoading && data?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
              <PackageX className="h-12 w-12" />
              <p className="text-sm">
                {filter.search || filter.kategori || filter.statusStok
                  ? 'Tidak ada produk yang sesuai filter'
                  : 'Belum ada produk. Klik "Tambah Produk" untuk mulai.'}
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              loading={isLoading}
              sorting={sorting}
              onSortingChange={handleSortingChange}
              emptyText="Belum ada produk"
            />
          )}

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

      {canManage && <ProdukForm open={formOpen} onClose={handleCloseForm} produk={editProduk} />}
    </div>
  )
}
