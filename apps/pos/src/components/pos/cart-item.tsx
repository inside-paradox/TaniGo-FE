'use client'

import { Trash2, Minus, Plus } from 'lucide-react'
import type { ItemKeranjang } from '@/types/pos'
import { formatRupiah } from '@tanigo/utils'
import { useCartStore } from '@/store/cartStore'
import { InputNominal } from '@/components/ui/input-nominal'
import { cn } from '@/lib/utils/cn'

interface CartItemProps {
  item: ItemKeranjang
}

export function CartItemRow({ item }: CartItemProps) {
  const { updateQty, updateDiskon, removeItem } = useCartStore()

  const handleDiskonChange = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return
    const maxDiskon = item.hargaSatuan * item.qty
    updateDiskon(item.produkId, Math.min(num, maxDiskon))
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-gray-100 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{item.nama}</p>
          <p className="text-xs text-gray-400">{item.satuan} &middot; {formatRupiah(item.hargaSatuan)}</p>
        </div>
        <button
          onClick={() => removeItem(item.produkId)}
          className="flex-shrink-0 rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className={cn(
          'flex items-center rounded-lg border overflow-hidden',
          item.qty >= item.stok ? 'border-orange-200' : 'border-gray-200'
        )}>
          <button
            onClick={() => updateQty(item.produkId, item.qty - 1)}
            className="flex h-7 w-7 items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Minus size={13} />
          </button>
          <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
          <button
            onClick={() => updateQty(item.produkId, item.qty + 1)}
            disabled={item.qty >= item.stok}
            className={cn(
              'flex h-7 w-7 items-center justify-center transition-colors',
              item.qty >= item.stok
                ? 'cursor-not-allowed text-gray-200'
                : 'text-gray-500 hover:bg-gray-50'
            )}
          >
            <Plus size={13} />
          </button>
        </div>
        {item.qty >= item.stok && (
          <span className="text-[10px] text-orange-500">maks stok</span>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-gray-400">Diskon</span>
          <InputNominal
            value={item.diskon}
            onChange={(v) => updateDiskon(item.produkId, Math.min(v, item.hargaSatuan * item.qty))}
            prefix="Rp"
            className="w-28 h-7 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-0.5">
        <span className="text-xs text-gray-400">Subtotal</span>
        <span className="text-sm font-semibold text-gray-900">{formatRupiah(item.subtotal)}</span>
      </div>
    </div>
  )
}
