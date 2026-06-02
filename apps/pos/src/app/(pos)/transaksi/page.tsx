'use client'

import { ProductGrid } from '@/components/pos/product-grid'
import { Cart } from '@/components/pos/cart'

export default function TransaksiPage() {
  return (
    <div className="flex h-full">
      <div className="flex-[3] overflow-hidden">
        <ProductGrid />
      </div>
      <div className="flex-[2] overflow-hidden">
        <Cart />
      </div>
    </div>
  )
}
