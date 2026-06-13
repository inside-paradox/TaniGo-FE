'use client'

import { useEffect } from 'react'
import { X, MapPin } from 'lucide-react'
import { StoreMap } from './StoreMap'
import type { Denah } from '@tanigo/types'

interface StoreMapModalProps {
  open: boolean
  onClose: () => void
  denah: Denah
  productId: string
  productName: string
  /** Human-readable rack location(s), e.g. "Rak A1 · Lorong 1". */
  lokasiText: string
}

export function StoreMapModal({ open, onClose, denah, productId, productName, lokasiText }: StoreMapModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    // The whole overlay scrolls, so a tall map is never clipped off-screen.
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex min-h-full items-center justify-center p-3 sm:p-6">
        <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white shadow-2xl kiosk-fade-in">
          <header className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-gray-200 bg-white/95 p-4 backdrop-blur">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Lokasi di Toko</p>
              <h2 className="truncate text-xl font-extrabold text-gray-900 sm:text-2xl">{productName}</h2>
            </div>
            <button
              onClick={onClose}
              className="ml-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 active:scale-95"
              aria-label="Tutup peta"
            >
              <X className="h-6 w-6" />
            </button>
          </header>

          <div className="p-4">
            {lokasiText && (
              <div className="mb-3 flex items-center gap-3 rounded-2xl border-2 border-green-300 bg-green-100 p-3">
                <MapPin className="h-6 w-6 shrink-0 fill-green-500 text-green-700" />
                <p className="text-lg font-extrabold text-green-800">{lokasiText}</p>
              </div>
            )}
            <StoreMap denah={denah} highlightProductId={productId} />
            <p className="mt-3 text-center text-sm text-gray-500">
              Cari rak yang berkedip hijau untuk menemukan produk ini.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
