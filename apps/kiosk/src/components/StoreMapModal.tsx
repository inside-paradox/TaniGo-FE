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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl kiosk-fade-in">
        <header className="flex items-center justify-between border-b border-gray-200 p-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Lokasi di Toko</p>
            <h2 className="text-2xl font-extrabold text-gray-900">{productName}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 active:scale-95"
            aria-label="Tutup peta"
          >
            <X className="h-7 w-7" />
          </button>
        </header>

        <div className="overflow-auto p-5">
          {lokasiText && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-green-300 bg-green-100 p-4">
              <MapPin className="h-7 w-7 shrink-0 fill-green-500 text-green-700" />
              <p className="text-xl font-extrabold text-green-800">{lokasiText}</p>
            </div>
          )}
          <StoreMap denah={denah} highlightProductId={productId} />
          <p className="mt-3 text-center text-base text-gray-500">
            Cari rak yang berkedip hijau untuk menemukan produk ini.
          </p>
        </div>
      </div>
    </div>
  )
}
