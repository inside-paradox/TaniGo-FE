'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  Truck,
  BarChart2,
  Settings,
  ChevronLeft,
  ShoppingBag,
  ClipboardList,
  ClipboardCheck,
  Star,
  Sprout,
  ArrowLeftRight,
  Store,
  Bell,
  LayoutGrid,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { canAccess } from '@/lib/rbac'
import { useNotifications } from '@/hooks/use-notifications'
import { useTransferStokBadge } from '@/hooks/use-transfer-stok'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { href: '/dashboard',      label: 'Dashboard',      icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/cabang',         label: 'Cabang',         icon: <Store className="h-5 w-5" /> },
  { href: '/pengguna',       label: 'Pengguna',       icon: <Users className="h-5 w-5" /> },
  { href: '/produk',         label: 'Produk',         icon: <Package className="h-5 w-5" /> },
  { href: '/inventori',      label: 'Inventori',      icon: <Warehouse className="h-5 w-5" /> },
  { href: '/denah-toko',     label: 'Denah Toko',     icon: <LayoutGrid className="h-5 w-5" /> },
  { href: '/purchase-order', label: 'Purchase Order', icon: <ShoppingBag className="h-5 w-5" /> },
  { href: '/supplier',       label: 'Supplier',       icon: <Building2 className="h-5 w-5" /> },
  { href: '/transfer-stok',  label: 'Transfer Stok',  icon: <ArrowLeftRight className="h-5 w-5" /> },
  { href: '/stok-opname',    label: 'Stok Opname',    icon: <ClipboardCheck className="h-5 w-5" /> },
  { href: '/pesanan',        label: 'Pesanan',        icon: <ShoppingCart className="h-5 w-5" /> },
  { href: '/pelanggan-vip',  label: 'Pelanggan VIP',  icon: <Star className="h-5 w-5" /> },
  { href: '/pengiriman',     label: 'Pengiriman',     icon: <Truck className="h-5 w-5" /> },
  { href: '/laporan',        label: 'Laporan',        icon: <BarChart2 className="h-5 w-5" /> },
  { href: '/audit-log',      label: 'Log Audit',      icon: <ClipboardList className="h-5 w-5" /> },
  { href: '/notifikasi',     label: 'Notifikasi',     icon: <Bell className="h-5 w-5" /> },
  { href: '/pengaturan',     label: 'Pengaturan',     icon: <Settings className="h-5 w-5" /> },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()
  const { data: notifikasi = [] } = useNotifications()
  const { count: transferCount } = useTransferStokBadge()

  const unreadCount = user
    ? notifikasi.filter((n) => !n.readByUserIds.includes(user.id)).length
    : 0

  /** Jumlah badge per menu (0 = tanpa badge). */
  const badgeCounts: Record<string, number> = {
    '/notifikasi': unreadCount,
    '/transfer-stok': transferCount,
  }

  const visibleItems = navItems.filter((item) => canAccess(user, item.href))

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        {sidebarCollapsed ? (
          <button
            onClick={toggleSidebar}
            title="Buka sidebar"
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 hover:bg-green-700 transition-colors"
          >
            <Sprout className="h-4 w-4 text-white" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
                <Sprout className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">TaniGo</span>
            </div>
            <button
              onClick={toggleSidebar}
              title="Tutup sidebar"
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const badgeCount = badgeCounts[item.href] ?? 0
            const showBadge = badgeCount > 0
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className={cn('relative', isActive ? 'text-green-600' : 'text-gray-400')}>
                    {item.icon}
                    {showBadge && sidebarCollapsed && (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {showBadge && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                          {badgeCount > 9 ? '9+' : badgeCount}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
