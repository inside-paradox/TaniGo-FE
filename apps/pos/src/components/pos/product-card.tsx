'use client'

import { ShoppingCart } from 'lucide-react'
import type { POSInventoryItem } from '@/lib/demo/inventory'
import { formatRupiah } from '@tanigo/utils'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/badge'

interface ProductCardProps {
  item: POSInventoryItem
  onAdd: (item: POSInventoryItem) => void
}

function getStokStatus(stok: number): { label: string; variant: 'success' | 'warning' | 'danger' } {
  if (stok === 0) return { label: 'Habis', variant: 'danger' }
  if (stok <= 5) return { label: 'Menipis', variant: 'warning' }
  return { label: 'Stok OK', variant: 'success' }
}

export function ProductCard({ item, onAdd }: ProductCardProps) {
  const isHabis = item.stok === 0
  const { label, variant } = getStokStatus(item.stok)

  return (
    <button
      onClick={() => !isHabis && onAdd(item)}
      disabled={isHabis}
      className={cn(
        'group relative flex flex-col rounded-xl border bg-white p-3 text-left shadow-sm transition-all',
        'hover:border-green-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500',
        isHabis && 'cursor-not-allowed opacity-50'
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-1">
        <p className="line-clamp-2 text-sm font-semibold text-gray-900 leading-snug">{item.produkNama}</p>
        <Badge variant={variant} className="flex-shrink-0">
          {label}
        </Badge>
      </div>

      <p className="text-xs text-gray-400 mb-1">{item.produkSku}</p>

      <div className="mt-auto pt-2 flex items-end justify-between">
        <div>
          <p className="text-base font-bold text-green-700">{formatRupiah(item.hargaJual)}</p>
          <p className="text-xs text-gray-500">
            Stok: {item.stok} {item.satuan}
          </p>
        </div>
        {!isHabis && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <ShoppingCart size={14} />
          </span>
        )}
      </div>
    </button>
  )
}
