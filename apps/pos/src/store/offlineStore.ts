'use client'

import { create } from 'zustand'

interface OfflineState {
  queueCount: number
  isSyncing: boolean
  lastSynced: string | null
  setQueueCount: (count: number) => void
  setIsSyncing: (v: boolean) => void
  setLastSynced: (ts: string) => void
}

export const useOfflineStore = create<OfflineState>()((set) => ({
  queueCount: 0,
  isSyncing: false,
  lastSynced: null,
  setQueueCount: (count) => set({ queueCount: count }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setLastSynced: (lastSynced) => set({ lastSynced }),
}))
