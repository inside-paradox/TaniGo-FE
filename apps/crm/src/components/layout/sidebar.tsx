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
  ChevronRight,
  ShoppingBag,
  ClipboardList,
  ClipboardCheck,
  Star,
  Sprout,
  ArrowLeftRight,
  Store,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import type { UserRole, TipeCabang } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles: UserRole[]
  tipeCabang?: TipeCabang[]
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ['superadmin', 'admin', 'manajer', 'kasir', 'staf_gudang'],
  },
  // ── Superadmin only ──
  {
    href: '/cabang',
    label: 'Cabang',
    icon: <Store className="h-5 w-5" />,
    roles: ['superadmin'],
  },
  {
    href: '/pengguna',
    label: 'Pengguna',
    icon: <Users className="h-5 w-5" />,
    roles: ['superadmin'],
  },
  // ── Operasional ──
  {
    href: '/produk',
    label: 'Produk',
    icon: <Package className="h-5 w-5" />,
    roles: ['superadmin', 'admin', 'manajer', 'staf_gudang'],
  },
  {
    href: '/inventori',
    label: 'Inventori',
    icon: <Warehouse className="h-5 w-5" />,
    roles: ['admin', 'manajer', 'staf_gudang'],
  },
  {
    href: '/purchase-order',
    label: 'Purchase Order',
    icon: <ShoppingBag className="h-5 w-5" />,
    roles: ['admin', 'manajer', 'staf_gudang'],
    tipeCabang: ['gudang'],
  },
  {
    href: '/transfer-stok',
    label: 'Transfer Stok',
    icon: <ArrowLeftRight className="h-5 w-5" />,
    roles: ['admin', 'manajer', 'staf_gudang'],
  },
  {
    href: '/stok-opname',
    label: 'Stok Opname',
    icon: <ClipboardCheck className="h-5 w-5" />,
    roles: ['admin', 'manajer', 'staf_gudang'],
  },
  {
    href: '/pesanan',
    label: 'Pesanan',
    icon: <ShoppingCart className="h-5 w-5" />,
    roles: ['admin', 'manajer', 'kasir'],
    tipeCabang: ['toko'],
  },
  {
    href: '/pelanggan-vip',
    label: 'Pelanggan VIP',
    icon: <Star className="h-5 w-5" />,
    roles: ['admin', 'manajer'],
    tipeCabang: ['toko'],
  },
  {
    href: '/pengiriman',
    label: 'Pengiriman',
    icon: <Truck className="h-5 w-5" />,
    roles: ['admin', 'manajer', 'kasir'],
    tipeCabang: ['toko'],
  },
  {
    href: '/laporan',
    label: 'Laporan',
    icon: <BarChart2 className="h-5 w-5" />,
    roles: ['admin', 'manajer', 'kasir'],
  },
  {
    href: '/pengguna',
    label: 'Pengguna',
    icon: <Users className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    href: '/audit-log',
    label: 'Log Audit',
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    href: '/pengaturan',
    label: 'Pengaturan',
    icon: <Settings className="h-5 w-5" />,
    roles: ['admin', 'manajer'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()

  const visibleItems = navItems.filter((item) => {
    if (!user) return false
    if (!item.roles.includes(user.role)) return false
    if (item.tipeCabang && user.tipeCabang && !item.tipeCabang.includes(user.tipeCabang)) return false
    return true
  })

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
              <Sprout className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">TaniGo</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white font-bold text-sm">
            TG
          </div>
        )}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
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
                  <span className={cn(isActive ? 'text-green-600' : 'text-gray-400')}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse button when collapsed */}
      {sidebarCollapsed && (
        <div className="border-t border-gray-200 p-2">
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  )
}
