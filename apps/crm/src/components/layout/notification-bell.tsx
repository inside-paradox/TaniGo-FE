'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, ChevronRight } from 'lucide-react'
import { cn, formatTanggalWaktu } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { useNotifications, useMarkAllAsRead } from '@/hooks/use-notifications'
import type { Notifikasi } from '@/types'

const TIPE_STYLE: Record<string, { dot: string; bg: string }> = {
  info:       { dot: 'bg-blue-500',   bg: 'bg-blue-50' },
  peringatan: { dot: 'bg-orange-500', bg: 'bg-orange-50' },
  penting:    { dot: 'bg-red-500',    bg: 'bg-red-50' },
}

function isUnread(notif: Notifikasi, userId: string) {
  return !notif.readByUserIds.includes(userId)
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { data: notifikasi = [] } = useNotifications()
  const { mutate: markAll } = useMarkAllAsRead()

  const unreadCount = user
    ? notifikasi.filter((n) => isUnread(n, user.id)).length
    : 0

  const preview = notifikasi.slice(0, 5)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => setOpen((v) => !v)

  const handleLihatSemua = () => {
    setOpen(false)
    router.push('/notifikasi')
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="font-semibold text-gray-900">Notifikasi</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAll()}
                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                >
                  <Check className="h-3 w-3" />
                  Tandai semua dibaca
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {preview.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">Tidak ada notifikasi</p>
              ) : (
                preview.map((n) => {
                  const unread = user ? isUnread(n, user.id) : false
                  const style = TIPE_STYLE[n.tipe] ?? TIPE_STYLE.info
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        'flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-gray-50',
                        unread && 'bg-blue-50/40'
                      )}
                      onClick={handleLihatSemua}
                    >
                      <div className={cn('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', style.dot, !unread && 'opacity-30')} />
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm', unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>
                          {n.judul}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.pesan}</p>
                        <p className="mt-1 text-[10px] text-gray-400">{formatTanggalWaktu(n.createdAt)}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <button
              onClick={handleLihatSemua}
              className="flex w-full items-center justify-center gap-1 border-t border-gray-100 py-2.5 text-sm font-medium text-green-600 hover:bg-gray-50"
            >
              Lihat semua notifikasi
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
