'use client'

import { useSyncExternalStore } from 'react'

// ── Global online-state store ────────────────────────────────────────────────
// Stored on `window` so it survives Next.js HMR module re-evaluation and is
// shared across every import of this hook in every bundle chunk.
declare global {
  interface Window {
    // Optional: these are populated lazily by the init block below. Declaring
    // them as required makes TS treat `!('__posOnlineListeners__' in window)` as
    // impossible and narrow `window` to `never`, which breaks `next build`.
    __posOnline__?: boolean
    __posOnlineListeners__?: Set<() => void>
  }
}

if (typeof window !== 'undefined' && !('__posOnlineListeners__' in window)) {
  window.__posOnline__ = navigator.onLine
  window.__posOnlineListeners__ = new Set()
  window.addEventListener('online', () => {
    window.__posOnline__ = true
    window.__posOnlineListeners__?.forEach((l) => l())
  })
  window.addEventListener('offline', () => {
    window.__posOnline__ = false
    window.__posOnlineListeners__?.forEach((l) => l())
  })
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (listener) => {
      if (typeof window === 'undefined') return () => {}
      window.__posOnlineListeners__?.add(listener)
      return () => window.__posOnlineListeners__?.delete(listener)
    },
    () => (typeof window !== 'undefined' ? window.__posOnline__ ?? true : true),
    () => true,
  )
}
