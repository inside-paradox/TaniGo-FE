'use client'

import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { createTransaksi } from '@/lib/api/transactions'
import { getQueue, removeFromQueue, incrementRetry, getQueueCount } from '@/lib/db/idb'
import { useOfflineStore } from '@/store/offlineStore'
import { useOnlineStatus } from './useOnlineStatus'

const MAX_RETRIES = 3

export function useSync() {
  const isOnline = useOnlineStatus()
  const { setQueueCount, setIsSyncing, setLastSynced } = useOfflineStore()
  const isSyncingRef = useRef(false)

  // Refresh queue count on mount
  useEffect(() => {
    getQueueCount().then(setQueueCount).catch(() => {})
  }, [setQueueCount])

  const runSync = useCallback(async () => {
    if (isSyncingRef.current) return
    if (!isOnline) {
      toast.error('Tidak ada koneksi internet')
      return
    }

    const queue = await getQueue()
    if (queue.length === 0) {
      toast.info('Tidak ada transaksi yang perlu disinkronkan')
      return
    }

    isSyncingRef.current = true
    setIsSyncing(true)

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
  }, [isOnline, setIsSyncing, setLastSynced, setQueueCount])

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
