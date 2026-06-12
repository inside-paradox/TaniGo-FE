'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sprout, Search, MapPin, Repeat, Loader2 } from 'lucide-react'
import { Clock } from '@/components/Clock'
import { StoreSelector } from '@/components/StoreSelector'
import { CATEGORIES } from '@/lib/categories'
import { useStore } from '@/lib/store-context'

export default function BerandaPage() {
  const router = useRouter()
  const { store, hydrated } = useStore()
  const [switching, setSwitching] = useState(false)

  // Wait for the persisted store selection to load to avoid a flash.
  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-green-50">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </main>
    )
  }

  // First run or explicit switch → show the store picker.
  if (!store || switching) {
    return <StoreSelector onDone={() => setSwitching(false)} />
  }

  const goSearch = (kategori?: string) => {
    router.push(kategori ? `/produk?kategori=${encodeURIComponent(kategori)}` : '/produk')
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-gradient-to-b from-green-50 to-white kiosk-fade-in">
      {/* Top bar: store + clock */}
      <header className="flex items-start justify-between p-8">
        <button
          onClick={() => setSwitching(true)}
          className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-2.5 text-left shadow-sm ring-1 ring-green-100"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight text-gray-900">{store.nama}</p>
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <Repeat className="h-3 w-3" /> Ganti toko
            </p>
          </div>
        </button>
        <Clock className="text-right" />
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-green-600 shadow-lg">
          <Sprout className="h-14 w-14 text-white" />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">TaniGo</h1>
        <p className="mt-4 max-w-2xl text-3xl font-bold text-gray-800">
          Cari Produk Pertanian Anda di Sini
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-lg text-gray-500">
          <MapPin className="h-5 w-5" /> {store.lokasi || store.nama}
        </p>

        <button
          onClick={() => goSearch()}
          className="mt-10 flex min-h-[72px] items-center gap-3 rounded-2xl bg-green-600 px-12 text-3xl font-bold text-white shadow-lg transition-transform hover:bg-green-700 active:scale-[0.98]"
        >
          <Search className="h-8 w-8" />
          Mulai Cari Produk
        </button>

        {/* Category shortcuts */}
        <div className="mt-12 w-full max-w-4xl">
          <p className="mb-4 text-lg font-semibold uppercase tracking-wide text-gray-400">
            Kategori Produk
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => {
              const Icon = c.icon
              return (
                <button
                  key={c.key}
                  onClick={() => goSearch(c.key)}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-transform hover:border-green-300 active:scale-[0.97]"
                >
                  <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${c.accent}`}>
                    <Icon className="h-8 w-8" />
                  </span>
                  <span className="text-lg font-bold text-gray-800">{c.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="p-6 text-center text-sm text-gray-400">
        Sentuh layar untuk mulai · TaniGo Luwu Utara
      </footer>
    </main>
  )
}
