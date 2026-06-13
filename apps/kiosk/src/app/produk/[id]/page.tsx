'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Loader2, PackageX, Map } from 'lucide-react'
import { formatRupiah } from '@tanigo/utils'
import { ProductImage } from '@/components/ProductImage'
import { ProductCard } from '@/components/ProductCard'
import { StockBadge } from '@/components/StockBadge'
import { StoreMapModal } from '@/components/StoreMapModal'
import { getCategoryDef } from '@/lib/categories'
import { useProducts } from '@/hooks/useProducts'
import { useDenah } from '@/hooks/useDenah'
import { useStore } from '@/lib/store-context'

export default function ProdukDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''
  const { store, hydrated } = useStore()
  const { data, isLoading } = useProducts(store?.id)
  const { data: denah } = useDenah(store?.id)
  const [mapOpen, setMapOpen] = useState(false)

  useEffect(() => {
    if (hydrated && !store) router.replace('/')
  }, [hydrated, store, router])

  const product = (data ?? []).find((p) => p.id === id)

  // Racks that actually carry this product in the saved layout. A product can
  // sit on more than one rack, so collect them all for the location label + map.
  const racks = useMemo(
    () => (denah && product ? denah.elemen.filter((e) => e.tipe === 'rak' && e.produkIds.includes(product.id)) : []),
    [denah, product]
  )
  const related = product
    ? (data ?? []).filter((p) => p.kategori === product.kategori && p.id !== product.id).slice(0, 4)
    : []

  if (!hydrated || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    )
  }

  if (!product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-green-50 p-8 text-center">
        <PackageX className="h-24 w-24 text-gray-300" />
        <h1 className="mt-6 text-3xl font-bold text-gray-800">Produk tidak ditemukan</h1>
        <p className="mt-2 text-lg text-gray-500">Produk mungkin sudah tidak tersedia.</p>
        <button
          onClick={() => router.push('/produk')}
          className="mt-8 min-h-[64px] rounded-2xl bg-green-600 px-10 text-xl font-bold text-white active:scale-[0.98]"
        >
          Kembali ke Daftar Produk
        </button>
      </main>
    )
  }

  const def = getCategoryDef(product.kategori)
  // Prefer the live layout (a product may be on several racks); fall back to the
  // product's own location fields when the store has no floor plan yet.
  const rackText = racks.length
    ? racks.map((r) => [r.kode, r.lorong].filter(Boolean).join(' · ')).join('   •   ')
    : ''
  const lokasiText = rackText || [product.lokasiRak, product.lorong].filter(Boolean).join(' · ')
  const canShowMap = !!denah && racks.length > 0

  return (
    <main className="min-h-screen bg-green-50 kiosk-fade-in">
      {/* Back */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 p-5 backdrop-blur">
        <button
          onClick={() => router.push('/produk')}
          className="flex min-h-[56px] items-center gap-2 rounded-2xl bg-gray-100 px-5 text-xl font-semibold text-gray-700 transition-colors hover:bg-gray-200 active:scale-95"
        >
          <ArrowLeft className="h-6 w-6" />
          Kembali
        </button>
      </header>

      <div className="mx-auto max-w-5xl p-6">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Photo */}
          <ProductImage
            src={product.foto}
            alt={product.nama}
            kategori={product.kategori}
            className="aspect-square w-full rounded-3xl border border-gray-200 shadow-sm"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />

          {/* Info */}
          <div className="flex flex-col">
            <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${def.accent}`}>
              <def.icon className="h-4 w-4" />
              {product.kategori}
            </span>

            <h1 className="mt-3 text-4xl font-extrabold leading-tight text-gray-900">
              {product.nama}
            </h1>
            <p className="mt-1 text-base text-gray-400">SKU: {product.sku}</p>

            <p className="mt-5 text-5xl font-extrabold text-green-700">
              {formatRupiah(product.harga)}
              <span className="ml-2 text-2xl font-medium text-gray-400">/ {product.satuan}</span>
            </p>

            <div className="mt-4">
              <StockBadge stok={product.stok} className="text-base" />
            </div>

            {/* Prominent rak location */}
            {lokasiText && (
              <div className="mt-6 rounded-2xl border-2 border-green-300 bg-green-100 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-green-600">
                    <MapPin className="h-9 w-9 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                      Lokasi Produk
                    </p>
                    <p className="text-3xl font-extrabold text-green-800">{lokasiText}</p>
                  </div>
                </div>
                {canShowMap && (
                  <button
                    onClick={() => setMapOpen(true)}
                    className="mt-4 flex min-h-[60px] w-full items-center justify-center gap-3 rounded-2xl bg-green-600 px-6 text-xl font-bold text-white transition-colors hover:bg-green-700 active:scale-[0.98]"
                  >
                    <Map className="h-6 w-6" />
                    Lihat di Peta Toko
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">Produk Serupa</h2>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {canShowMap && denah && (
        <StoreMapModal
          open={mapOpen}
          onClose={() => setMapOpen(false)}
          denah={denah}
          productId={product.id}
          productName={product.nama}
          lokasiText={lokasiText}
        />
      )}
    </main>
  )
}
