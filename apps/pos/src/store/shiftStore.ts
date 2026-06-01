'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Shift } from '@/types/pos'

interface ShiftState {
  activeShift: Shift | null
  _hasHydrated: boolean
  setShift: (shift: Shift) => void
  clearShift: () => void
  setHasHydrated: (val: boolean) => void
}

export const useShiftStore = create<ShiftState>()(
  persist(
    (set) => ({
      activeShift: null,
      _hasHydrated: false,
      setShift: (shift) => set({ activeShift: shift }),
      clearShift: () => set({ activeShift: null }),
      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: 'tanigo-shift',
      partialize: (state) => ({ activeShift: state.activeShift }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
