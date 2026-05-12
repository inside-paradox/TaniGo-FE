'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Shift } from '@/types/pos'

interface ShiftState {
  activeShift: Shift | null
  setShift: (shift: Shift) => void
  clearShift: () => void
}

export const useShiftStore = create<ShiftState>()(
  persist(
    (set) => ({
      activeShift: null,
      setShift: (shift) => set({ activeShift: shift }),
      clearShift: () => set({ activeShift: null }),
    }),
    { name: 'tanigo-shift' }
  )
)
