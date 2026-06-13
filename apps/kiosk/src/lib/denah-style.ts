import { DoorOpen, Calculator, Square, Boxes, type LucideIcon } from 'lucide-react'
import type { TipeElemen } from '@tanigo/types'

/** Rack accent classes keyed by ElemenDenah.warna (set in the CRM editor). */
export const WARNA_RAK: Record<string, { bg: string; border: string; text: string }> = {
  green: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800' },
  amber: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800' },
  red: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800' },
  blue: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800' },
  gray: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
}

export function warnaRak(key: string | null | undefined) {
  return WARNA_RAK[key ?? 'gray'] ?? WARNA_RAK.gray
}

export const ELEMEN_ICON: Record<TipeElemen, LucideIcon> = {
  rak: Boxes,
  kasir: Calculator,
  pintu: DoorOpen,
  dinding: Square,
}

export const FIXTURE_STYLE: Record<Exclude<TipeElemen, 'rak'>, { bg: string; border: string; text: string }> = {
  kasir: { bg: 'bg-slate-200', border: 'border-slate-400', text: 'text-slate-700' },
  pintu: { bg: 'bg-sky-50', border: 'border-sky-400 border-dashed', text: 'text-sky-700' },
  dinding: { bg: 'bg-gray-300', border: 'border-gray-400', text: 'text-gray-600' },
}
