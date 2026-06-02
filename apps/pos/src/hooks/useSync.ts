'use client'

import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { createTransaksi } from '@/lib/api/transactions'
import { bukaShift } from '@/lib/api/shifts'
import { getQueue, removeFromQueue, incrementRetry, getQueueCount } from '@/lib/db/idb'
import { useOfflineStore } from '@/store/offlineStore'
import { useShiftStore } from '@/store/shiftStore'
import { useOnlineStatus } from './useOnlineStatus'

const MAX_RETRIES = 3

export function useSync() {
  const isOnline = useOnlineStatus()
  const { setQueueCount, setIsSyncing, setLastSynced, pendingShift, setPendingShift } = useOfflineStore()
  const setShift = useShiftStore((s) => s.setShift)
  const isSyncingRef = useRef(false)

  // Refresh queue count on mount
  useEffect(() => {
    getQueueCount().then(setQueueCount).catch(() => {})
  }, [setQueueCount])

  const runSync = useCallback(async () => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true  // guard before any await so StrictMode double-invoke is blocked

    if (!isOnline) {
      toast.error('Tidak ada koneksi internet')
      isSyncingRef.current = false
      return
    }

    const queue = await getQueue()
    if (queue.length === 0 && !pendingShift) {
      toast.info('Tidak ada transaksi yang perlu disinkronkan')
      isSyncingRef.current = false
      return
    }

    setIsSyncing(true)

    // Sync pending offline shift first before submitting transactions
    if (pendingShift) {
      try {
        const realShift = await bukaShift({ saldoAwal: pendingShift.saldoAwal })
        setShift(realShift)
        setPendingShift(null)
      } catch {
        toast.error('Gagal membuka shift offline. Coba buka shift ulang secara manual.')
        isSyncingRef.current = false
        setIsSyncing(false)
        return
      }
    }

    if (queue.length === 0) {
      setIsSyncing(false)
      setLastSynced(new Date().toISOString())
      isSyncingRef.current = false
      return
    }

    const toastId = toast.loading(`Menyinkronkan ${queue.length} transaksi offline...`)
    let successCount = 0

    for (const item of queue) {
      if (item.retries >= MAX_RETRIES) {
        await removeFromQueue(item.id!)
        continue
      }

      try {
        await createTransaksi(item.payload)
        await removeFromQueue(item.id!)
        successCount++
      } catch {
        await incrementRetry(item.id!)
      }
    }

    const remaining = await getQueueCount()
    setQueueCount(remaining)
    setIsSyncing(false)
    setLastSynced(new Date().toISOString())
    isSyncingRef.current = false

    toast.dismiss(toastId)
    if (successCount > 0) {
      toast.success(`${successCount} transaksi offline berhasil disinkronkan`)
    }
    if (remaining > 0) {
      toast.warning(`${remaining} transaksi gagal disinkronkan, akan dicoba ulang`)
    }
  }, [isOnline, pendingShift, setIsSyncing, setLastSynced, setQueueCount, setPendingShift, setShift])

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOnline) return
    runSync().catch(() => {
      isSyncingRef.current = false
      setIsSyncing(false)
    })
  }, [isOnline]) // eslint-disable-line react-hooks/exhaustive-deps

  const manualSync = useCallback(() => {
    runSync().catch(() => {
      isSyncingRef.current = false
      setIsSyncing(false)
    })
  }, [runSync, setIsSyncing])

  return { manualSync }
}
