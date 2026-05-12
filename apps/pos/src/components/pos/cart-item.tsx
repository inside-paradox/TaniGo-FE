'use client'

import { Trash2, Minus, Plus } from 'lucide-react'
import type { ItemKeranjang } from '@/types/pos'
import { formatRupiah } from '@tanigo/utils'
import { useCartStore } from '@/store/cartStore'
import { InputNominal } from '@/components/ui/input-nominal'
import { cn } from '@/lib/utils/cn'

const SATUAN_DESIMAL = ['kg', 'liter', 'gram', 'ml', 'ltr', 'ton', 'kwintal', 'ons']

function isDecimalUnit(satuan: string) {
  return SATUAN_DESIMAL.includes(satuan.toLowerCase())
}

interface CartItemProps {
  item: ItemKeranjang
}

export function CartItemRow({ item }: CartItemProps) {
  const { updateQty, updateDiskon, removeItem } = useCartStore()
  const isDecimal = isDecimalUnit(item.satuan)

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
        <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => updateQty(item.produkId, isDecimal ? item.qty - 0.5 : item.qty - 1)}
            className="flex h-7 w-7 items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Minus size={13} />
          </button>
          {isDecimal ? (
            <input
              type="number"
              min="0.01"
              step="0.5"
              value={item.qty}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v) && v > 0) updateQty(item.produkId, v)
              }}
              className="w-14 border-x border-gray-200 text-center text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          ) : (
            <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
          )}
          <button
            onClick={() => updateQty(item.produkId, isDecimal ? item.qty + 0.5 : item.qty + 1)}
            className="flex h-7 w-7 items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>

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
