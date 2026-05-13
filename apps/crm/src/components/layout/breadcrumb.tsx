'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

// Full-path overrides — checked first for specific routes
const fullPathLabels: Record<string, string> = {
  '/transfer-stok/baru': 'Permintaan Baru',
  '/stok-opname/baru': 'Buat Stok Opname',
  '/produk/baru': 'Tambah Produk',
  '/purchase-order/baru': 'Buat PO',
  '/pesanan/baru': 'Buat Pesanan',
  '/cabang/baru': 'Tambah Cabang',
  '/pengiriman/baru': 'Tambah Pengiriman',
  '/pengguna/baru': 'Tambah Pengguna',
}

// Segment-level fallback labels
const segmentLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  produk: 'Produk',
  inventori: 'Inventori',
  'purchase-order': 'Purchase Order',
  'transfer-stok': 'Transfer Stok',
  'stok-opname': 'Stok Opname',
  pesanan: 'Pesanan',
  'pelanggan-vip': 'Pelanggan VIP',
  pengiriman: 'Pengiriman',
  laporan: 'Laporan',
  pengguna: 'Pengguna',
  cabang: 'Cabang',
  'audit-log': 'Log Audit',
  pengaturan: 'Pengaturan',
  baru: 'Baru',
  edit: 'Edit',
  detail: 'Detail',
  supplier: 'Supplier',
  riwayat: 'Riwayat',
  tagihan: 'Tagihan',
  profil: 'Profil',
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500">
      <Link href="/dashboard" className="flex items-center hover:text-gray-700">
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/')
        const isLast = index === segments.length - 1
        const label = fullPathLabels[href] ?? segmentLabels[segment] ?? segment

        return (
          <div key={href} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="font-medium text-gray-900">{label}</span>
            ) : (
              <Link href={href} className="hover:text-gray-700">
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
