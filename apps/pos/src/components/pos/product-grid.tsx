'use client'

import { useRef, useEffect, useState } from 'react'
import { Search, PackageSearch } from 'lucide-react'
import type { Produk } from '@tanigo/types'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { ProductCard } from './product-card'
import { useProducts } from '@/hooks/useProducts'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'

export function ProductGrid() {
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const addItem = useCartStore((s) => s.addItem)

  const { data, isLoading, isFetching } = useProducts({
    search,
    limit: 50,
  })

  const products = data?.data ?? []

  const handleAdd = (produk: Produk) => {
    addItem({
      produkId: produk.id,
      nama: produk.nama,
      sku: produk.sku,
      satuan: produk.satuan,
      hargaSatuan: produk.hargaJual,
      qty: 1,
    })
    toast.success(`${produk.nama} ditambahkan`)
  }

  // Barcode scanner support: focus input on keydown if not already focused
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement
      const isTyping =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement
      if (!isTyping) {
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-gray-100">
        <Input
          ref={searchRef}
          placeholder="Cari produk, SKU, atau scan barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
          rightIcon={isFetching && !isLoading ? <Spinner size="sm" /> : undefined}
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-gray-400">
            <PackageSearch size={40} />
            <p className="text-sm">Produk tidak ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {products.map((produk) => (
              <ProductCard key={produk.id} produk={produk} onAdd={handleAdd} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
