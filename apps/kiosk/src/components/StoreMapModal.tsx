'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
  // Mounted gate so the portal only runs on the client.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open || !mounted) return null

  // Portal to <body> so the fixed overlay is positioned against the viewport.
  // The product page's <main> has an animated transform (kiosk-fade-in), which
  // would otherwise become the containing block for `position: fixed`.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Standard centered modal: capped at 90vh, body scrolls if it ever overflows. */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl kiosk-fade-in">
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4">
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

        <div className="overflow-y-auto p-4">
          {lokasiText && (
            <div className="mb-3 flex items-center gap-3 rounded-2xl border-2 border-green-300 bg-green-100 p-3">
              <MapPin className="h-6 w-6 shrink-0 fill-green-500 text-green-700" />
              <p className="text-lg font-extrabold text-green-800">{lokasiText}</p>
            </div>
          )}
          <div className="pt-4">
            <StoreMap denah={denah} highlightProductId={productId} />
          </div>
          <p className="mt-3 text-center text-sm text-gray-500">
            Cari rak yang berkedip hijau untuk menemukan produk ini.
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
