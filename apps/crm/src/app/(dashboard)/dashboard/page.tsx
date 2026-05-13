'use client'

import {
  Package,
  AlertTriangle,
  TrendingUp,
  Truck,
  ShoppingCart,
  Users,
  ArrowLeftRight,
  ClipboardList,
  Clock,
  Store,
  Warehouse,
  TrendingDown,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useDashboardStok, useDashboardPenjualan } from '@/hooks/use-dashboard'
import { useCabangList } from '@/hooks/use-cabang'
import { useAuthStore } from '@/store/auth-store'
import { formatRupiah } from '@/lib/utils'

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626']

const penjualanHarianMock = [
  { tanggal: 'Sen', total: 4500000 },
  { tanggal: 'Sel', total: 3200000 },
  { tanggal: 'Rab', total: 6100000 },
  { tanggal: 'Kam', total: 5400000 },
  { tanggal: 'Jum', total: 7800000 },
  { tanggal: 'Sab', total: 8200000 },
  { tanggal: 'Min', total: 3900000 },
]

const metodePembayaranMock = [
  { name: 'Tunai', value: 45 },
  { name: 'Transfer Bank', value: 30 },
  { name: 'QRIS', value: 15 },
  { name: 'Kredit VIP', value: 10 },
]

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  loading,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
            </div>
            <div className={`rounded-xl p-3 ${color}`}>{icon}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DashboardGudang() {
  const { data: stok, isLoading: stokLoading } = useDashboardStok()

  return (
    <div className="space-y-6">
      {/* Stok Overview */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Stok
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Produk"
            value={stok?.totalProduk ?? 0}
            subtitle="Produk aktif di katalog"
            icon={<Package className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50"
            loading={stokLoading}
          />
          <StatCard
            title="Stok Menipis"
            value={stok?.produkMenipis ?? 0}
            subtitle="Perlu segera di-restock"
            icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />}
            color="bg-yellow-50"
            loading={stokLoading}
          />
          <StatCard
            title="Stok Habis"
            value={stok?.produkHabis ?? 0}
            subtitle="Tidak tersedia"
            icon={<Package className="h-5 w-5 text-red-600" />}
            color="bg-red-50"
            loading={stokLoading}
          />
          <StatCard
            title="Kedaluwarsa 30 Hari"
            value={stok?.produkKedaluwarsa30Hari ?? 0}
            subtitle="Perlu perhatian segera"
            icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
            color="bg-orange-50"
            loading={stokLoading}
          />
        </div>
      </div>

      {/* Purchase Order & Transfer Stok */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Aktivitas
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="PO Menunggu"
            value={4}
            subtitle="Menunggu konfirmasi supplier"
            icon={<ClipboardList className="h-5 w-5 text-indigo-600" />}
            color="bg-indigo-50"
          />
          <StatCard
            title="Transfer Masuk"
            value={7}
            subtitle="Menunggu persetujuan"
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            color="bg-amber-50"
          />
          <StatCard
            title="Siap Dikirim"
            value={3}
            subtitle="Transfer sudah disetujui"
            icon={<ArrowLeftRight className="h-5 w-5 text-teal-600" />}
            color="bg-teal-50"
          />
        </div>
      </div>
    </div>
  )
}

function DashboardToko() {
  const { data: penjualan, isLoading: penjualanLoading } = useDashboardPenjualan()
  const { data: stok, isLoading: stokLoading } = useDashboardStok()

  const penjualanHarian = penjualan?.harian || penjualanHarianMock
  const metodePembayaran = penjualan?.metodePembayaran || metodePembayaranMock

  return (
    <div className="space-y-6">
      {/* Penjualan Stats */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Penjualan Minggu Ini
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Pendapatan"
            value={
              penjualan?.totalPendapatan
                ? formatRupiah(penjualan.totalPendapatan)
                : formatRupiah(39100000)
            }
            subtitle="7 hari terakhir"
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            color="bg-green-50"
            loading={penjualanLoading}
          />
          <StatCard
            title="Total Transaksi"
            value={penjualan?.totalTransaksi ?? 142}
            subtitle="7 hari terakhir"
            icon={<ShoppingCart className="h-5 w-5 text-purple-600" />}
            color="bg-purple-50"
            loading={penjualanLoading}
          />
          <StatCard
            title="Rata-rata Transaksi"
            value={
              penjualan?.rataRataTransaksi
                ? formatRupiah(penjualan.rataRataTransaksi)
                : formatRupiah(275352)
            }
            subtitle="Per transaksi"
            icon={<Users className="h-5 w-5 text-indigo-600" />}
            color="bg-indigo-50"
            loading={penjualanLoading}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Grafik Penjualan 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            {penjualanLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={penjualanHarian}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="tanggal"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                  />
                  <Tooltip
                    formatter={(value) => [formatRupiah(Number(value)), 'Penjualan']}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#16a34a"
                    strokeWidth={2}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {penjualanLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={metodePembayaran}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {metodePembayaran.map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: 11, color: '#374151' }}>{value}</span>
                    )}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, '']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operasional Hari Ini */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Operasional Hari Ini
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pengiriman"
            value={8}
            subtitle="3 sedang dalam perjalanan"
            icon={<Truck className="h-5 w-5 text-teal-600" />}
            color="bg-teal-50"
          />
          <StatCard
            title="Pesanan Baru"
            value={12}
            subtitle="Menunggu diproses"
            icon={<ShoppingCart className="h-5 w-5 text-amber-600" />}
            color="bg-amber-50"
          />
          <StatCard
            title="Tagihan Jatuh Tempo"
            value={3}
            subtitle="Pelanggan VIP"
            icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
            color="bg-rose-50"
          />
          <StatCard
            title="Transfer Stok Pending"
            value={2}
            subtitle="Menunggu konfirmasi gudang"
            icon={<ArrowLeftRight className="h-5 w-5 text-violet-600" />}
            color="bg-violet-50"
            loading={stokLoading}
          />
        </div>
      </div>

      {/* Stok Menipis */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Perhatian Stok
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            title="Stok Menipis"
            value={stok?.produkMenipis ?? 0}
            subtitle="Pertimbangkan transfer dari gudang"
            icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />}
            color="bg-yellow-50"
            loading={stokLoading}
          />
          <StatCard
            title="Stok Habis"
            value={stok?.produkHabis ?? 0}
            subtitle="Tidak tersedia untuk dijual"
            icon={<Package className="h-5 w-5 text-red-600" />}
            color="bg-red-50"
            loading={stokLoading}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Mock performance data per toko (replace with API when available) ──────────
const performanceTokoMock = [
  { nama: 'Toko Utama', pendapatan: 39100000, transaksi: 142, pertumbuhan: 12.4 },
  { nama: 'Toko Selatan', pendapatan: 28500000, transaksi: 103, pertumbuhan: -3.2 },
  { nama: 'Toko Barat', pendapatan: 31200000, transaksi: 118, pertumbuhan: 8.7 },
  { nama: 'Toko Timur', pendapatan: 19800000, transaksi: 76, pertumbuhan: 21.1 },
]

function DashboardSuperadmin() {
  const { data: cabangData, isLoading: cabangLoading } = useCabangList()
  const allCabang = cabangData?.data ?? []
  const tokoList = allCabang.filter((c) => c.tipe === 'toko')
  const gudangList = allCabang.filter((c) => c.tipe === 'gudang')
  const activeCount = allCabang.filter((c) => c.aktif).length

  const totalPendapatan = performanceTokoMock.reduce((s, t) => s + t.pendapatan, 0)
  const totalTransaksi = performanceTokoMock.reduce((s, t) => s + t.transaksi, 0)

  return (
    <div className="space-y-6">
      {/* Global summary */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Overview Jaringan</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Toko"
            value={cabangLoading ? '...' : tokoList.length}
            subtitle={`${tokoList.filter((c) => c.aktif).length} aktif`}
            icon={<Store className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50"
            loading={cabangLoading}
          />
          <StatCard
            title="Total Gudang"
            value={cabangLoading ? '...' : gudangList.length}
            subtitle={`${gudangList.filter((c) => c.aktif).length} aktif`}
            icon={<Warehouse className="h-5 w-5 text-yellow-600" />}
            color="bg-yellow-50"
            loading={cabangLoading}
          />
          <StatCard
            title="Pendapatan Minggu Ini"
            value={formatRupiah(totalPendapatan)}
            subtitle="Semua toko"
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            color="bg-green-50"
          />
          <StatCard
            title="Total Transaksi"
            value={totalTransaksi}
            subtitle="7 hari terakhir"
            icon={<ShoppingCart className="h-5 w-5 text-purple-600" />}
            color="bg-purple-50"
          />
        </div>
      </div>

      {/* Bar chart performa toko */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Pendapatan per Toko (7 Hari Terakhir)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={performanceTokoMock} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="nama" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                <Tooltip
                  formatter={(value) => [formatRupiah(Number(value)), 'Pendapatan']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="pendapatan" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cabang aktif/nonaktif */}
        <Card>
          <CardHeader><CardTitle>Status Cabang</CardTitle></CardHeader>
          <CardContent>
            {cabangLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="space-y-3">
                {allCabang.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-2 w-2 shrink-0 rounded-full ${c.aktif ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="truncate text-gray-800">{c.nama}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant={c.tipe === 'toko' ? 'info' : 'warning'}>
                        {c.tipe === 'toko' ? 'Toko' : 'Gudang'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {allCabang.length === 0 && (
                  <p className="text-sm text-gray-400">Belum ada cabang terdaftar</p>
                )}
                <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
                  {activeCount} dari {allCabang.length} cabang aktif
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performa per toko */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Performa per Toko</h2>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Toko</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Pendapatan</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Transaksi</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Pertumbuhan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {performanceTokoMock.map((toko) => (
                <tr key={toko.nama} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{toko.nama}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatRupiah(toko.pendapatan)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{toko.transaksi}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`flex items-center justify-end gap-1 font-medium ${toko.pertumbuhan >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {toko.pertumbuhan >= 0
                        ? <TrendingUp className="h-3.5 w-3.5" />
                        : <TrendingDown className="h-3.5 w-3.5" />}
                      {Math.abs(toko.pertumbuhan)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const isSuperadmin = user?.role === 'superadmin'
  const isGudang = user?.tipeCabang === 'gudang'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Selamat datang kembali,{' '}
          <span className="font-medium">{user?.nama}</span>
          {user?.cabang && (
            <span className="ml-1 text-gray-400">· {user.cabang}</span>
          )}
        </p>
      </div>

      {isSuperadmin ? <DashboardSuperadmin /> : isGudang ? <DashboardGudang /> : <DashboardToko />}
    </div>
  )
}
