'use client'

import { PackageSearch } from 'lucide-react'
import { ProductCard } from './ProductCard'
import type { KioskProduct } from '@/types'

function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="aspect-square w-full animate-pulse bg-gray-200" />
      <div className="space-y-3 p-4">
        <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-7 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-7 w-24 animate-pulse rounded-full bg-gray-200" />
      </div>
    </div>
  )
}

export function ProductGrid({
  products,
  loading,
}: {
  products: KioskProduct[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <PackageSearch className="h-20 w-20 text-gray-300" />
        <p className="mt-4 text-2xl font-bold text-gray-700">Produk tidak ditemukan</p>
        <p className="mt-1 text-lg text-gray-400">Coba kata kunci atau kategori lain</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
