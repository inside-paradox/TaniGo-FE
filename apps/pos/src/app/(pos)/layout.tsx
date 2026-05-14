'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FlaskConical, WifiOff, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useOfflineStore } from '@/store/offlineStore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { Sidebar } from '@/components/shared/sidebar'

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken } = useAuthStore()
  const router = useRouter()
  const isDemo = accessToken === 'demo-token'
  const isOnline = useOnlineStatus()
  const { queueCount, isSyncing } = useOfflineStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated()) router.replace('/login')
  }, [isAuthenticated, router])

  if (!mounted || !isAuthenticated()) return null

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {isDemo && (
        <div className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-xs font-semibold text-amber-900">
          <FlaskConical size={13} />
          Mode Demo — Data tidak terhubung ke server dan tidak akan tersimpan
        </div>
      )}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-red-500 px-4 py-1.5 text-xs font-semibold text-white">
          <WifiOff size={13} />
          Mode Offline — Transaksi akan disimpan dan dikirim saat koneksi pulih
          {queueCount > 0 && (
            <span className="ml-1 rounded-full bg-white/30 px-1.5 py-0.5">
              {queueCount} antrian
            </span>
          )}
        </div>
      )}
      {isOnline && isSyncing && (
        <div className="flex items-center justify-center gap-2 bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white">
          <RefreshCw size={13} className="animate-spin" />
          Menyinkronkan transaksi offline...
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
