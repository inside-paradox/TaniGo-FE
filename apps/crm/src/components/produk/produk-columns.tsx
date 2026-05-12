'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ui/modal'
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
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const deleteMutation = useDeleteProduct()
  const updateMutation = useUpdateProduct()

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(produk.id)
    setOpen(false)
  }

  const handleToggleStatus = () => {
    setMenuOpen(false)
    updateMutation.mutate({
      id: produk.id,
      data: { statusAktif: !produk.statusAktif },
    })
  }

  return (
    <>
      <div className="relative flex justify-end">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                onClick={() => { setMenuOpen(false); onEdit(produk) }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4 text-gray-400" />
                Edit Produk
              </button>
              <button
                onClick={handleToggleStatus}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {produk.statusAktif ? (
                  <>
                    <ToggleLeft className="h-4 w-4 text-gray-400" />
                    Nonaktifkan
                  </>
                ) : (
                  <>
                    <ToggleRight className="h-4 w-4 text-green-500" />
                    Aktifkan
                  </>
                )}
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => { setMenuOpen(false); setOpen(true) }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Hapus Produk
              </button>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Produk"
        description={`Yakin ingin menghapus produk "${produk.nama}"? Produk tidak bisa dihapus jika masih ada transaksi terkait.`}
        confirmLabel="Ya, Hapus"
        loading={deleteMutation.isPending}
      />
    </>
  )
}

export function getProdukColumns(
  onEdit: (produk: Produk) => void
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
      accessorKey: 'lokasiRak',
      header: 'Lokasi Rak',
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue<string>()}</span>
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
    {
      id: 'aksi',
      header: '',
      enableSorting: false,
      cell: ({ row }) => <AksiCell produk={row.original} onEdit={onEdit} />,
    },
  ]
}
