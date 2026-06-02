'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PendingShift {
  saldoAwal: number
  waktuBuka: string
}

interface OfflineState {
  queueCount: number
  isSyncing: boolean
  lastSynced: string | null
  pendingShift: PendingShift | null
  setQueueCount: (count: number) => void
  setIsSyncing: (v: boolean) => void
  setLastSynced: (ts: string) => void
  setPendingShift: (shift: PendingShift | null) => void
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      queueCount: 0,
      isSyncing: false,
      lastSynced: null,
      pendingShift: null,
      setQueueCount: (count) => set({ queueCount: count }),
      setIsSyncing: (isSyncing) => set({ isSyncing }),
      setLastSynced: (lastSynced) => set({ lastSynced }),
      setPendingShift: (pendingShift) => set({ pendingShift }),
    }),
    {
      name: 'tanigo-offline',
      // Persist pendingShift so an offline-opened shift survives a page reload /
      // browser restart. Without this, reloading while still offline drops the
      // pending shift, and on reconnect the queued transactions sync with no
      // active shift on the backend → "Tidak ada shift aktif".
      // lastSynced is persisted for display continuity. queueCount and isSyncing
      // are runtime-only: queueCount is re-derived from IndexedDB on mount.
      partialize: (state) => ({
        pendingShift: state.pendingShift,
        lastSynced: state.lastSynced,
      }),
    }
  )
)
