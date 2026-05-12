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
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardStok, useDashboardPenjualan } from '@/hooks/use-dashboard'
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

export default function DashboardPage() {
  const { user } = useAuthStore()
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

      {isGudang ? <DashboardGudang /> : <DashboardToko />}
    </div>
  )
}
