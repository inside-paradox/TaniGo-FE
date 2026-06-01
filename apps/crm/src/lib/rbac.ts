import type { UserRole, TipeCabang } from '@/types'

/**
 * Aturan akses per route.
 * - roles     : role yang diizinkan
 * - tipeCabang: jika diisi, user.tipeCabang HARUS cocok.
 *               Jika tidak diisi, semua tipeCabang diizinkan.
 *
 * Superadmin selalu diizinkan ke semua route (dihandle di canAccess).
 */
export interface RouteAccess {
  /** Prefix path, mis. '/pesanan' cocok dengan '/pesanan' dan '/pesanan/123' */
  href: string
  roles: UserRole[]
  tipeCabang?: TipeCabang[]
}

export const ROUTE_ACCESS: RouteAccess[] = [
  // ── Semua role terautentikasi ──
  { href: '/dashboard', roles: ['superadmin', 'admin', 'manajer', 'kasir', 'staf_gudang'] },
  { href: '/notifikasi', roles: ['superadmin', 'admin', 'manajer', 'kasir', 'staf_gudang'] },

  // ── Superadmin only ──
  { href: '/cabang', roles: ['superadmin'] },
  { href: '/pengguna', roles: ['superadmin'] },

  // ── Operasional (semua tipeCabang) ──
  { href: '/produk', roles: ['superadmin', 'admin', 'manajer', 'staf_gudang'] },
  { href: '/stok-opname', roles: ['superadmin', 'admin', 'manajer', 'staf_gudang'] },
  { href: '/transfer-stok', roles: ['admin', 'manajer', 'staf_gudang'] },
  { href: '/laporan', roles: ['admin', 'manajer', 'kasir'] },
  { href: '/audit-log', roles: ['admin'] },
  { href: '/pengaturan', roles: ['admin', 'manajer'] },

  // ── Gudang only ──
  { href: '/inventori', roles: ['admin', 'manajer', 'staf_gudang'], tipeCabang: ['gudang'] },
  { href: '/purchase-order', roles: ['admin', 'manajer', 'staf_gudang'], tipeCabang: ['gudang'] },

  // ── Toko only ──
  { href: '/pesanan', roles: ['admin', 'manajer', 'kasir'], tipeCabang: ['toko'] },
  { href: '/pelanggan-vip', roles: ['admin', 'manajer'], tipeCabang: ['toko'] },
  { href: '/pengiriman', roles: ['admin', 'manajer', 'kasir'], tipeCabang: ['toko'] },
]

export interface RbacUser {
  role: UserRole
  tipeCabang: TipeCabang | null
}

/**
 * Cek apakah user boleh mengakses pathname tertentu.
 * Superadmin selalu diizinkan.
 * Route yang tidak terdaftar → diizinkan (pengaturan profil, dsb.).
 */
export function canAccess(user: RbacUser | null | undefined, pathname: string): boolean {
  if (!user) return false
  if (user.role === 'superadmin') return true

  const rule = ROUTE_ACCESS.find(
    (r) => pathname === r.href || pathname.startsWith(r.href + '/')
  )

  // Route tidak terdaftar → izinkan (halaman umum seperti /pengaturan/profil)
  if (!rule) return true

  if (!rule.roles.includes(user.role)) return false

  if (rule.tipeCabang) {
    if (!user.tipeCabang || !rule.tipeCabang.includes(user.tipeCabang)) return false
  }

  return true
}
