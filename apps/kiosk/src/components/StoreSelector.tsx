'use client'

import { Store, MapPin, ChevronRight, Loader2 } from 'lucide-react'
import { useStores } from '@/hooks/useStores'
import { useStore } from '@/lib/store-context'
import type { KioskStore } from '@/types'

/**
 * Full-screen store picker. Shown on first run (no store chosen) and reachable
 * later to switch which store's catalog the kiosk displays.
 */
export function StoreSelector({ onDone }: { onDone?: () => void }) {
  const { data: stores, isLoading } = useStores()
  const { store: current, setStore } = useStore()

  const choose = (s: KioskStore) => {
    setStore(s)
    onDone?.()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 p-8 kiosk-fade-in">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600">
            <Store className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Pilih Toko</h1>
          <p className="mt-2 text-lg text-gray-500">
            Pilih toko yang akan ditampilkan pada layar ini
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {(stores ?? []).map((s) => {
              const isCurrent = current?.id === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => choose(s)}
                  className={`flex w-full items-center gap-4 rounded-2xl border-2 bg-white p-5 text-left transition-colors active:scale-[0.99] ${
                    isCurrent ? 'border-green-600' : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-green-100">
                    <Store className="h-7 w-7 text-green-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-bold text-gray-900">{s.nama}</p>
                    {s.lokasi && (
                      <p className="mt-0.5 flex items-center gap-1 text-base text-gray-500">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{s.lokasi}</span>
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-7 w-7 shrink-0 text-gray-300" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
