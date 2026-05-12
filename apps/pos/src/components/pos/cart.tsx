'use client'

import { useState } from 'react'
import { ShoppingCart, PauseCircle, CreditCard, Trash2 } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatRupiah } from '@tanigo/utils'
import { Button } from '@/components/ui/button'
import { CartItemRow } from './cart-item'
import { PaymentModal } from './payment-modal'
import { HoldPanel } from './hold-panel'

export function Cart() {
  const { items, subtotal, totalDiskon, total, clearCart, holdCart, heldTransactions } = useCartStore()
  const [showPayment, setShowPayment] = useState(false)
  const [showHold, setShowHold] = useState(false)

  const isEmpty = items.length === 0

  return (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-900">Keranjang</h2>
          {items.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
              {items.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHold(true)}
            className="relative flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <PauseCircle size={14} />
            Tahan
            {heldTransactions.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {heldTransactions.length}
              </span>
            )}
          </button>

          {!isEmpty && (
            <button
              onClick={() => clearCart()}
              className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Kosongkan keranjang"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isEmpty ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-gray-300">
            <ShoppingCart size={40} />
            <p className="text-sm">Keranjang kosong</p>
            <p className="text-xs">Klik produk untuk menambahkan</p>
          </div>
        ) : (
          items.map((item) => <CartItemRow key={item.produkId} item={item} />)
        )}
      </div>

      {!isEmpty && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal ({items.length} item)</span>
              <span>{formatRupiah(subtotal())}</span>
            </div>
            {totalDiskon() > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Total Diskon</span>
                <span>-{formatRupiah(totalDiskon())}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900">
              <span>TOTAL BAYAR</span>
              <span>{formatRupiah(total())}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => holdCart()}
              className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white py-3 text-gray-600 transition-colors hover:bg-gray-50 active:scale-[0.98]"
            >
              <PauseCircle size={20} />
              <span className="text-xs font-medium">Tahan</span>
            </button>
            <button
              onClick={() => setShowPayment(true)}
              className="flex flex-[3] flex-col items-center justify-center gap-1 rounded-xl bg-green-600 py-3 text-white shadow-md shadow-green-200 transition-colors hover:bg-green-700 active:scale-[0.98]"
            >
              <CreditCard size={20} />
              <span className="text-sm font-bold">Proses Pembayaran</span>
            </button>
          </div>
        </div>
      )}

      <PaymentModal open={showPayment} onClose={() => setShowPayment(false)} />
      <HoldPanel open={showHold} onClose={() => setShowHold(false)} />
    </div>
  )
}
