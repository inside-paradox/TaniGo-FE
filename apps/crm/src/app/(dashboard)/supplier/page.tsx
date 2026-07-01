'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Pagination } from '@/components/shared/pagination'
import { SearchInput } from '@/components/shared/search-input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmModal } from '@/components/ui/modal'
import { SupplierForm } from '@/components/inventori/supplier-form'
import { SupplierProdukModal } from '@/components/inventori/supplier-produk-modal'
import { useSuppliers, useDeleteSupplier } from '@/hooks/use-inventory'
import { formatTanggal } from '@/lib/utils'
import type { Supplier } from '@/types'

function getSupplierColumns(
  onEdit: (s: Supplier) => void,
  onDelete: (s: Supplier) => void,
  onLihatProduk: (s: Supplier) => void
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
          <Button size="sm" variant="ghost" onClick={() => onLihatProduk(row.original)}>Lihat Produk</Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(row.original)}>Edit</Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => onDelete(row.original)}>Hapus</Button>
        </div>
      ),
    },
  ]
}

export default function SupplierPage() {
  const [supplierFormOpen, setSupplierFormOpen] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null)
  const [lihatProdukSupplier, setLihatProdukSupplier] = useState<Supplier | null>(null)
  const [supplierPage, setSupplierPage] = useState(1)
  const [supplierSearch, setSupplierSearch] = useState('')

  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers({
    page: supplierPage,
    limit: 25,
    search: supplierSearch || undefined,
  })
  const deleteMutation = useDeleteSupplier()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Supplier"
        subtitle="Kelola data pemasok yang terhubung dengan Purchase Order dan Produk"
      />

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
                (s) => setDeleteSupplier(s),
                (s) => setLihatProdukSupplier(s)
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

      <SupplierForm open={supplierFormOpen} onClose={() => { setSupplierFormOpen(false); setEditSupplier(null) }} supplier={editSupplier} />
      <SupplierProdukModal open={!!lihatProdukSupplier} onClose={() => setLihatProdukSupplier(null)} supplier={lihatProdukSupplier} />
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
