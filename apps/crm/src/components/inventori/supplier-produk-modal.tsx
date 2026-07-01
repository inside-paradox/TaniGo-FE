'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { Modal } from '@/components/ui/modal'
import { DataTable } from '@/components/shared/data-table'
import { useProducts } from '@/hooks/use-products'
import { formatRupiah } from '@/lib/utils'
import type { Produk, Supplier } from '@/types'

const columns: ColumnDef<Produk>[] = [
  {
    accessorKey: 'nama',
    header: 'Nama Produk',
    cell: ({ getValue }) => <span className="font-medium text-gray-900">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'hargaBeli',
    header: 'Harga Beli Terakhir',
    cell: ({ getValue }) => <span className="text-sm text-gray-600">{formatRupiah(getValue<number>())}</span>,
  },
]

interface SupplierProdukModalProps {
  open: boolean
  onClose: () => void
  supplier: Supplier | null
}

export function SupplierProdukModal({ open, onClose, supplier }: SupplierProdukModalProps) {
  const { data: products, isLoading } = useProducts(
    { page: 1, limit: 50, supplierId: supplier?.id },
    { enabled: open && !!supplier }
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Produk dari Supplier"
      description={supplier?.nama}
      size="lg"
    >
      <DataTable
        columns={columns}
        data={products?.data ?? []}
        loading={isLoading}
        emptyText="Belum ada produk yang terhubung dengan supplier ini"
      />
    </Modal>
  )
}
