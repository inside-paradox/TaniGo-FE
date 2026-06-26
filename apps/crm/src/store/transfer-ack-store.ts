'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Melacak dokumen transfer stok yang sudah "diakui" (acknowledged) oleh user,
 * sebagai dasar badge notifikasi di sidebar.
 *
 * Key per dokumen menyertakan status saat ini (`${userId}:${transferId}:${status}`)
 * sehingga ketika Gudang mengubah status (mis. Disetujui → Dikirim), dokumen
 * tersebut kembali dianggap "belum diakui" dan badge muncul lagi untuk role Toko.
 *
 * Catatan: di backend nyata, acknowledgement ini sebaiknya disimpan server-side
 * (lihat docs/spec-backend-transfer-stok-badge.md). Di sini disimpan lokal agar
 * fitur tetap berjalan di mode demo.
 */
interface TransferAckState {
  seen: Record<string, true>
  markSeen: (keys: string[]) => void
}

export const useTransferAckStore = create<TransferAckState>()(
  persist(
    (set) => ({
      seen: {},
      markSeen: (keys) =>
        set((state) => {
          let changed = false
          const next = { ...state.seen }
          for (const key of keys) {
            if (!next[key]) {
              next[key] = true
              changed = true
            }
          }
          return changed ? { seen: next } : state
        }),
    }),
    { name: 'tanigo-crm-transfer-ack' }
  )
)
