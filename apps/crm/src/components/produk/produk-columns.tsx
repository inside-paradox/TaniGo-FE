'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/ui/modal'
import { TableActionMenu } from '@/components/ui/table-action-menu'
import { formatRupiah } from '@/lib/utils'
import { useDeleteProduct, useUpdateProduct } from '@/hooks/use-products'
import type { Produk } from '@/types'

function StatusStokBadge({ status }: { status: Produk['statusStok'] }) {
  if (status === 'habis') return <Badge variant="danger">Habis</Badge>
  if (status === 'menipis') return <Badge variant="warning">Menipis</Badge>
  return <Badge variant="success">Normal</Badge>
}

function AksiCell({
  produk,
  onEdit,
}: {
  produk: Produk
  onEdit: (produk: Produk) => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleteMutation = useDeleteProduct()
  const updateMutation = useUpdateProduct()

  return (
    <>
      <TableActionMenu
        items={[
          {
            label: 'Edit Produk',
            icon: <Pencil className="h-4 w-4 text-gray-400" />,
            onClick: () => onEdit(produk),
          },
          {
            label: produk.statusAktif ? 'Nonaktifkan' : 'Aktifkan',
            icon: produk.statusAktif
              ? <ToggleLeft className="h-4 w-4 text-gray-400" />
              : <ToggleRight className="h-4 w-4 text-green-500" />,
            onClick: () =>
              updateMutation.mutate({ id: produk.id, data: { statusAktif: !produk.statusAktif } }),
          },
          {
            label: 'Hapus Produk',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => setConfirmOpen(true),
            variant: 'danger',
            separator: true,
          },
        ]}
      />

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(produk.id)
          setConfirmOpen(false)
        }}
        title="Hapus Produk"
        description={`Yakin ingin menghapus produk "${produk.nama}"? Produk tidak bisa dihapus jika masih ada transaksi terkait.`}
        confirmLabel="Ya, Hapus"
        loading={deleteMutation.isPending}
      />
    </>
  )
}

export function getProdukColumns(
  onEdit: ((produk: Produk) => void) | null
): ColumnDef<Produk>[] {
  return [
    {
      id: 'foto',
      header: 'Foto',
      enableSorting: false,
      cell: ({ row }) => {
        const foto = row.original.foto
        return foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt={row.original.nama}
            className="h-10 w-10 rounded-lg border border-gray-200 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs font-medium text-gray-400">
            {row.original.nama.slice(0, 2).toUpperCase()}
          </div>
        )
      },
    },
    {
      accessorKey: 'nama',
      header: 'Nama Produk',
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.nama}</p>
          <p className="text-xs text-gray-400">{row.original.sku}</p>
        </div>
      ),
    },
    {
      accessorKey: 'kategori',
      header: 'Kategori',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'satuan',
      header: 'Satuan',
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'hargaJual',
      header: 'Harga Jual',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-sm font-medium text-gray-900">
          {formatRupiah(getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: 'stok',
      header: 'Stok',
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-gray-900">{row.original.stok}</span>
          <span className="ml-1 text-xs text-gray-400">{row.original.satuan}</span>
        </div>
      ),
    },
    {
      accessorKey: 'statusStok',
      header: 'Status Stok',
      enableSorting: false,
      cell: ({ row }) => <StatusStokBadge status={row.original.statusStok} />,
    },
    {
      accessorKey: 'statusAktif',
      header: 'Status',
      enableSorting: false,
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <Badge variant="success">Aktif</Badge>
        ) : (
          <Badge variant="default">Nonaktif</Badge>
        ),
    },
    ...(onEdit ? [{
      id: 'aksi',
      header: '',
      enableSorting: false,
      cell: ({ row }: { row: { original: Produk } }) => <AksiCell produk={row.original} onEdit={onEdit} />,
    }] : []),
  ]
}
