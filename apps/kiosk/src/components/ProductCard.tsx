'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { formatRupiah } from '@tanigo/utils'
import { ProductImage } from './ProductImage'
import { StockBadge } from './StockBadge'
import { cn } from '@/lib/cn'
import type { KioskProduct } from '@/types'

/** Large, touch-friendly product card for the grid. */
export function ProductCard({ product }: { product: KioskProduct }) {
  return (
    <Link
      href={`/produk/${product.id}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition-transform active:scale-[0.98]',
        product.stok <= 0 && 'opacity-90'
      )}
    >
      <div className="relative">
        <ProductImage
          src={product.foto}
          alt={product.nama}
          kategori={product.kategori}
          className="aspect-square w-full"
        />
        {product.lokasiRak && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-sm font-bold text-white shadow">
            <MapPin className="h-4 w-4" />
            {product.lokasiRak}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-xl font-bold leading-tight text-gray-900">
          {product.nama}
        </h3>
        <p className="mt-2 text-2xl font-extrabold text-green-700">
          {formatRupiah(product.harga)}
          <span className="ml-1 text-base font-medium text-gray-400">/ {product.satuan}</span>
        </p>
        <div className="mt-auto pt-3">
          <StockBadge stok={product.stok} />
        </div>
      </div>
    </Link>
  )
}
