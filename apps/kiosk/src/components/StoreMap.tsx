'use client'

import { MapPin } from 'lucide-react'
import { cn } from '@/lib/cn'
import { warnaRak, ELEMEN_ICON, FIXTURE_STYLE } from '@/lib/denah-style'
import type { Denah, ElemenDenah } from '@tanigo/types'

interface StoreMapProps {
  denah: Denah
  /** Rack elements containing this product are highlighted. */
  highlightProductId?: string
  className?: string
}

/**
 * Read-only floor plan rendered for customers. Uses percentage-based positioning
 * so it scales to fill any container while preserving the grid aspect ratio.
 */
export function StoreMap({ denah, highlightProductId, className }: StoreMapProps) {
  const { kolom, baris, elemen } = denah

  const isHighlighted = (el: ElemenDenah) =>
    !!highlightProductId && el.tipe === 'rak' && el.produkIds.includes(highlightProductId)

  return (
    <div
      className={cn('relative w-full rounded-2xl border border-gray-200 bg-gray-50', className)}
      // Keep the grid aspect ratio, but enforce a minimum row height (~46px) so
      // each cell is tall enough for its icon + label (e.g. "Pintu Masuk") without
      // clipping on narrow viewports. The container can grow taller than the
      // aspect ratio; %-based element positions scale to the actual height.
      style={{ aspectRatio: `${kolom} / ${baris}`, minHeight: `${baris * 46}px` }}
    >
      {elemen.map((el) => {
        const highlighted = isHighlighted(el)
        const Icon = ELEMEN_ICON[el.tipe]
        const palette = el.tipe === 'rak' ? warnaRak(el.warna) : null
        const fixture = el.tipe !== 'rak' ? FIXTURE_STYLE[el.tipe] : null

        return (
          <div
            key={el.id}
            className={cn(
              'absolute flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg border-2 px-0.5 py-1 text-center leading-none',
              palette && [palette.bg, palette.border, palette.text],
              fixture && [fixture.bg, fixture.border, fixture.text],
              highlighted
                ? 'z-20 animate-pulse border-green-600 ring-4 ring-green-400'
                : highlightProductId && el.tipe === 'rak'
                  ? 'opacity-50'
                  : ''
            )}
            style={{
              left: `${(el.x / kolom) * 100}%`,
              top: `${(el.y / baris) * 100}%`,
              width: `${(el.w / kolom) * 100}%`,
              height: `${(el.h / baris) * 100}%`,
            }}
          >
            {highlighted && (
              <MapPin className="absolute -top-7 h-7 w-7 animate-bounce fill-green-500 text-green-700" />
            )}
            <Icon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <span className="line-clamp-2 max-w-full text-[11px] font-bold leading-[1.1] sm:text-sm">{el.kode}</span>
          </div>
        )
      })}
    </div>
  )
}
