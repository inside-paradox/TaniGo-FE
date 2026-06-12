'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Search, X, Loader2 } from 'lucide-react'
import { CategoryChips } from '@/components/CategoryChips'
import { ProductGrid } from '@/components/ProductGrid'
import { LastUpdated } from '@/components/LastUpdated'
import { useProducts } from '@/hooks/useProducts'
import { useDebounce } from '@/hooks/useDebounce'
import { useStore } from '@/lib/store-context'
import { CATEGORIES, type KategoriFilter } from '@/lib/categories'

function isKategori(v: string | null): v is KategoriFilter {
  return v === 'Semua' || CATEGORIES.some((c) => c.key === v)
}

function ProdukContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { store, hydrated } = useStore()

  const initialKategori = searchParams.get('kategori')
  const [kategori, setKategori] = useState<KategoriFilter>(
    isKategori(initialKategori) ? initialKategori : 'Semua'
  )
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading, isFetching, dataUpdatedAt } = useProducts(store?.id)

  // Auto-focus the search bar when the page opens.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // No store selected → back to beranda to pick one.
  useEffect(() => {
    if (hydrated && !store) router.replace('/')
  }, [hydrated, store, router])

  const filtered = useMemo(() => {
    const all = data ?? []
    const q = debouncedSearch.trim().toLowerCase()
    return all.filter((p) => {
      const matchKategori = kategori === 'Semua' || p.kategori === kategori
      const matchSearch =
        !q || p.nama.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      return matchKategori && matchSearch
    })
  }, [data, kategori, debouncedSearch])

  if (!hydrated || !store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-green-50 kiosk-fade-in">
      {/* Sticky header: back, search, store, last updated */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="flex items-center gap-4 p-5">
          <button
            onClick={() => router.push('/')}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 active:scale-95"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeft className="h-7 w-7" />
          </button>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk..."
              className="h-16 w-full rounded-2xl border-2 border-gray-200 bg-white pl-16 pr-14 text-xl text-gray-900 outline-none focus:border-green-500"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('')
                  inputRef.current?.focus()
                }}
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-500"
                aria-label="Hapus pencarian"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 pb-4">
          <div className="min-w-0 flex-1">
            <CategoryChips active={kategori} onChange={setKategori} />
          </div>
          <LastUpdated
            timestamp={dataUpdatedAt || undefined}
            refreshing={isFetching}
            className="hidden shrink-0 lg:flex"
          />
        </div>
      </header>

      {/* Grid */}
      <div className="kiosk-scroll flex-1 overflow-auto p-6">
        <ProductGrid products={filtered} loading={isLoading} />
      </div>
    </main>
  )
}

export default function ProdukPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-green-50">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        </div>
      }
    >
      <ProdukContent />
    </Suspense>
  )
}
