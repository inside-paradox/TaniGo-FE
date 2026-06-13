import { DoorOpen, Calculator, Square, Boxes, type LucideIcon } from 'lucide-react'
import type { TipeElemen } from '@/types'

/** Pixel size of one grid cell on the editor canvas. */
export const CELL = 44

/** Accent palette for racks. Keys are stored in ElemenDenah.warna. */
export interface WarnaDef {
  key: string
  label: string
  bg: string
  border: string
  text: string
  dot: string
}

export const WARNA_RAK: WarnaDef[] = [
  { key: 'green', label: 'Hijau (Benih)', bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800', dot: 'bg-green-500' },
  { key: 'amber', label: 'Kuning (Pupuk)', bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800', dot: 'bg-amber-500' },
  { key: 'red', label: 'Merah (Pestisida)', bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800', dot: 'bg-red-500' },
  { key: 'blue', label: 'Biru (Alat & Mesin)', bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800', dot: 'bg-blue-500' },
  { key: 'purple', label: 'Ungu (Lainnya)', bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800', dot: 'bg-purple-500' },
  { key: 'gray', label: 'Abu-abu', bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700', dot: 'bg-gray-400' },
]

export function warnaDef(key: string | null | undefined): WarnaDef {
  return WARNA_RAK.find((w) => w.key === key) ?? WARNA_RAK[WARNA_RAK.length - 1]
}

/** Display + styling metadata per element kind. */
export interface ElemenMeta {
  label: string
  icon: LucideIcon
  /** Default size in cells when newly added. */
  defaultW: number
  defaultH: number
  /** True for racks, which hold products and use the color palette. */
  isRak: boolean
}

export const ELEMEN_META: Record<TipeElemen, ElemenMeta> = {
  rak: { label: 'Rak', icon: Boxes, defaultW: 2, defaultH: 1, isRak: true },
  kasir: { label: 'Kasir', icon: Calculator, defaultW: 3, defaultH: 1, isRak: false },
  pintu: { label: 'Pintu', icon: DoorOpen, defaultW: 2, defaultH: 1, isRak: false },
  dinding: { label: 'Dinding', icon: Square, defaultW: 4, defaultH: 1, isRak: false },
}

/** Classes for a non-rack fixture element. */
export const FIXTURE_STYLE: Record<Exclude<TipeElemen, 'rak'>, { bg: string; border: string; text: string }> = {
  kasir: { bg: 'bg-slate-200', border: 'border-slate-400', text: 'text-slate-700' },
  pintu: { bg: 'bg-sky-50', border: 'border-sky-400 border-dashed', text: 'text-sky-700' },
  dinding: { bg: 'bg-gray-300', border: 'border-gray-400', text: 'text-gray-600' },
}
