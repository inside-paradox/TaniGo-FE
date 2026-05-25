'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Clock, RotateCcw, LogOut, Sprout, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useAuthStore } from '@/store/authStore'
import { useShiftStore } from '@/store/shiftStore'
import { useLogout } from '@/hooks/useAuth'
import { useOfflineStore } from '@/store/offlineStore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useSync } from '@/hooks/useSync'
import { Badge } from '@/components/ui/badge'
import { formatTanggalWaktu } from '@tanigo/utils'

const navItems = [
  { href: '/transaksi', label: 'Transaksi', icon: ShoppingCart },
  { href: '/shift', label: 'Shift', icon: Clock },
  { href: '/retur', label: 'Retur', icon: RotateCcw },
]

export function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const activeShift = useShiftStore((s) => s.activeShift)
  const { mutate: doLogout, isPending } = useLogout()
  const { queueCount, isSyncing, lastSynced } = useOfflineStore()
  const isOnline = useOnlineStatus()
  const { manualSync } = useSync()

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
          <Sprout className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">TaniGo POS</p>
          {user && <p className="text-xs text-gray-500">{user.cabang}</p>}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-green-50 text-green-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-4 space-y-3">
        {/* Sync button */}
        <div className="rounded-lg bg-gray-50 px-3 py-2 space-y-1.5">
          <button
            onClick={manualSync}
            disabled={isSyncing || !isOnline}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              isSyncing || !isOnline
                ? 'cursor-not-allowed text-gray-400'
                : 'text-green-700 hover:bg-green-100'
            )}
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Menyinkronkan...' : 'Sync Sekarang'}
            {queueCount > 0 && !isSyncing && (
              <span className="ml-auto rounded-full bg-orange-100 px-1.5 py-0.5 text-orange-700">
                {queueCount}
              </span>
            )}
          </button>
          {lastSynced && (
            <p className="text-[10px] text-gray-400 px-2">
              Terakhir: {formatTanggalWaktu(lastSynced)}
            </p>
          )}
          {!isOnline && (
            <p className="text-[10px] text-orange-500 px-2">Offline — sync saat koneksi pulih</p>
          )}
        </div>

        {activeShift ? (
          <div className="rounded-lg bg-green-50 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Badge variant="success">Shift Aktif</Badge>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formatTanggalWaktu(activeShift.waktuBuka)}
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-yellow-50 px-3 py-2">
            <Badge variant="warning">Shift Belum Dibuka</Badge>
          </div>
        )}

        {user && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
              {user.nama.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{user.nama}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => doLogout()}
          disabled={isPending}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  )
}
