import { Sprout, FlaskConical, Bug, Wrench, Package, type LucideIcon } from 'lucide-react'
import type { KioskKategori } from '@/types'

export interface CategoryDef {
  key: KioskKategori
  label: string
  icon: LucideIcon
  /** Tailwind classes for the category accent (icon bg + text). */
  accent: string
}

/** Ordered list of categories used for chips and beranda shortcuts. */
export const CATEGORIES: CategoryDef[] = [
  { key: 'Benih', label: 'Benih', icon: Sprout, accent: 'bg-green-100 text-green-700' },
  { key: 'Pupuk', label: 'Pupuk', icon: Package, accent: 'bg-amber-100 text-amber-700' },
  { key: 'Pestisida', label: 'Pestisida', icon: Bug, accent: 'bg-red-100 text-red-700' },
  { key: 'Alat & Mesin', label: 'Alat & Mesin', icon: Wrench, accent: 'bg-blue-100 text-blue-700' },
  { key: 'Lainnya', label: 'Lainnya', icon: FlaskConical, accent: 'bg-purple-100 text-purple-700' },
]

/** "Semua" + all category keys, used for the filter chips on the product list. */
export type KategoriFilter = 'Semua' | KioskKategori

export function getCategoryDef(key: KioskKategori): CategoryDef {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1]
}

/**
 * Normalize a free-text backend category string into one of the canonical
 * kiosk categories so filtering and icons stay consistent.
 */
export function normalizeKategori(raw: string | null | undefined): KioskKategori {
  const v = (raw ?? '').toLowerCase()
  if (v.includes('benih') || v.includes('bibit')) return 'Benih'
  if (v.includes('pupuk')) return 'Pupuk'
  if (v.includes('pestisida') || v.includes('insektisida') || v.includes('herbisida')) return 'Pestisida'
  if (v.includes('alat') || v.includes('mesin') || v.includes('sprayer')) return 'Alat & Mesin'
  return 'Lainnya'
}
