'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { KioskStore } from '@/types'

const STORAGE_KEY = 'tanigo-kiosk-store'

interface StoreContextValue {
  /** The currently selected store, or null until one is chosen. */
  store: KioskStore | null
  setStore: (store: KioskStore) => void
  clearStore: () => void
  /** False until we've read the persisted selection from localStorage. */
  hydrated: boolean
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStoreState] = useState<KioskStore | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Restore the persisted store selection on mount. A physical kiosk is tied to
  // one store, so the choice persists across reloads.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setStoreState(JSON.parse(raw) as KioskStore)
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true)
  }, [])

  const setStore = (s: KioskStore) => {
    setStoreState(s)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
      // ignore
    }
  }

  const clearStore = () => {
    setStoreState(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  return (
    <StoreContext.Provider value={{ store, setStore, clearStore, hydrated }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
