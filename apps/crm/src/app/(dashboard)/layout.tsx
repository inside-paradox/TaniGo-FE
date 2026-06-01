'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'
import { canAccess } from '@/lib/rbac'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()
  const { sidebarCollapsed } = useUIStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    // Cek role + tipeCabang — redirect ke /dashboard jika tidak punya akses
    if (!canAccess(user, pathname)) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, user, _hasHydrated, pathname, router])

  if (!_hasHydrated) return null
  if (!isAuthenticated) return null
  if (!canAccess(user, pathname)) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300',
          sidebarCollapsed ? 'pl-16' : 'pl-64'
        )}
      >
        <div className="p-6">
          <div className="mb-4">
            <Breadcrumb />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
