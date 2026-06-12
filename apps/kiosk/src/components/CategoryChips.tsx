'use client'

import { CATEGORIES, type KategoriFilter } from '@/lib/categories'
import { cn } from '@/lib/cn'

const ALL: { key: KategoriFilter; label: string } = { key: 'Semua', label: 'Semua' }

/** Horizontally scrollable category filter chips (large touch targets). */
export function CategoryChips({
  active,
  onChange,
}: {
  active: KategoriFilter
  onChange: (k: KategoriFilter) => void
}) {
  const chips: { key: KategoriFilter; label: string }[] = [
    ALL,
    ...CATEGORIES.map((c) => ({ key: c.key as KategoriFilter, label: c.label })),
  ]

  return (
    <div className="kiosk-scroll flex gap-3 overflow-x-auto pb-1">
      {chips.map((chip) => {
        const isActive = active === chip.key
        return (
          <button
            key={chip.key}
            onClick={() => onChange(chip.key)}
            className={cn(
              'min-h-[48px] shrink-0 rounded-full border-2 px-6 text-lg font-semibold transition-colors',
              isActive
                ? 'border-green-600 bg-green-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
            )}
          >
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}
