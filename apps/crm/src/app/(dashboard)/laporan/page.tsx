'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, FileSpreadsheet, RefreshCw, AlertTriangle, Package, Clock } from 'lucide-react'
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
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { reportsApi } from '@/lib/api'
import { formatRupiah, downloadBlob } from '@/lib/utils'

type TabId = 'penjualan' | 'stok' | 'shift' | 'pembelian' | 'pelangganVIP' | 'pengiriman'

const TABS: { id: TabId; label: string }[] = [
  { id: 'penjualan', label: 'Penjualan' },
  { id: 'stok', label: 'Stok' },
  { id: 'shift', label: 'Shift' },
  { id: 'pembelian', label: 'Pembelian' },
  { id: 'pelangganVIP', label: 'Pelanggan VIP' },
  { id: 'pengiriman', label: 'Pengiriman' },
]

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed']

const tabToJenis: Record<TabId, string> = {
  penjualan: 'penjualan',
  stok: 'stok',
  shift: 'shift',
  pembelian: 'pembelian',
  pelangganVIP: 'pelanggan-vip',
  pengiriman: 'pengiriman',
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

function get7DaysAgoStr() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<TabId>('penjualan')
  const [tanggalDari, setTanggalDari] = useState(get7DaysAgoStr())
  const [tanggalSampai, setTanggalSampai] = useState(getTodayStr())
  const [enabled, setEnabled] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)

  const params = { tanggalDari, tanggalSampai }

  const fetchFn = () => {
    switch (activeTab) {
      case 'penjualan':
        return reportsApi.getPenjualan(params)
      case 'stok':
        return reportsApi.getStok(params)
      case 'shift':
        return reportsApi.getShift(params)
      case 'pembelian':
        return reportsApi.getPembelian(params)
      case 'pelangganVIP':
        return reportsApi.getPelangganVIP(params)
      case 'pengiriman':
        return reportsApi.getPengiriman(params)
    }
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['laporan', activeTab, tanggalDari, tanggalSampai],
    queryFn: fetchFn,
    enabled,
  })

  const handleMuatData = () => {
    if (!enabled) {
      setEnabled(true)
    } else {
      refetch()
    }
  }

  const handleExportPdf = async () => {
    setExportingPdf(true)
    try {
      const blob = await reportsApi.exportPdf(tabToJenis[activeTab], params)
      downloadBlob(blob, `laporan-${tabToJenis[activeTab]}-${tanggalDari}-${tanggalSampai}.pdf`)
    } finally {
      setExportingPdf(false)
    }
  }

  const handleExportExcel = async () => {
    setExportingExcel(true)
    try {
      const blob = await reportsApi.exportExcel(tabToJenis[activeTab], params)
      downloadBlob(blob, `laporan-${tabToJenis[activeTab]}-${tanggalDari}-${tanggalSampai}.xlsx`)
    } finally {
      setExportingExcel(false)
    }
  }

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    setEnabled(false)
  }

  // Type-safe data accessors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const penjualanData = activeTab === 'penjualan' ? (data as any) : null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stokData = activeTab === 'stok' ? (data as any) : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        subtitle="Analisis data penjualan, stok, shift, dan pengiriman"
      />

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters + Actions */}
      <Card>
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:p-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Tanggal Dari</label>
            <input
              type="date"
              value={tanggalDari}
              max={tanggalSampai}
              onChange={(e) => {
                setTanggalDari(e.target.value)
                setEnabled(false)
              }}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Tanggal Sampai</label>
            <input
              type="date"
              value={tanggalSampai}
              min={tanggalDari}
              onChange={(e) => {
                setTanggalSampai(e.target.value)
                setEnabled(false)
              }}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <Button onClick={handleMuatData} loading={isLoading}>
            <RefreshCw className="h-4 w-4" />
            Muat Data
          </Button>
          <div className="flex gap-2 sm:ml-auto">
            <Button
              variant="outline"
              onClick={handleExportPdf}
              loading={exportingPdf}
              disabled={!data}
            >
              <FileText className="h-4 w-4" />
              Ekspor PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              loading={exportingExcel}
              disabled={!data}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Ekspor Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Tab Content */}
      {!enabled && !data && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
            <RefreshCw className="h-10 w-10" />
            <p className="text-sm">Pilih rentang tanggal dan klik Muat Data</p>
          </CardContent>
        </Card>
      )}

      {/* Penjualan */}
      {activeTab === 'penjualan' && data && penjualanData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Total Transaksi"
              value={penjualanData.totalTransaksi ?? 0}
              sub="Dalam periode ini"
            />
            <SummaryCard
              label="Total Pendapatan"
              value={formatRupiah(penjualanData.totalPendapatan ?? 0)}
              sub="Dalam periode ini"
            />
            <SummaryCard
              label="Rata-rata Transaksi"
              value={formatRupiah(penjualanData.rataRataTransaksi ?? 0)}
              sub="Per transaksi"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Grafik Penjualan Harian</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={penjualanData.harian ?? []}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="tanggal"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
                    />
                    <Tooltip
                      formatter={(value) => [formatRupiah(Number(value)), 'Penjualan']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metode Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={penjualanData.metodePembayaran ?? []}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {(penjualanData.metodePembayaran ?? []).map(
                        (_: unknown, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        )
                      )}
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
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Stok */}
      {activeTab === 'stok' && data && stokData && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="rounded-xl bg-yellow-100 p-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800">Produk Menipis</p>
                <p className="mt-1 text-3xl font-bold text-yellow-900">
                  {stokData.produkMenipis ?? 0}
                </p>
                <p className="mt-0.5 text-xs text-yellow-700">Stok di bawah batas minimum</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="rounded-xl bg-red-100 p-3">
                <Package className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">Produk Habis</p>
                <p className="mt-1 text-3xl font-bold text-red-900">
                  {stokData.produkHabis ?? 0}
                </p>
                <p className="mt-0.5 text-xs text-red-700">Tidak tersedia untuk dijual</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="rounded-xl bg-orange-100 p-3">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-800">Produk Kedaluwarsa</p>
                <p className="mt-1 text-3xl font-bold text-orange-900">
                  {stokData.produkKedaluwarsa ?? 0}
                </p>
                <p className="mt-0.5 text-xs text-orange-700">Sudah atau hampir kedaluwarsa</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Other tabs placeholder */}
      {(['shift', 'pembelian', 'pelangganVIP', 'pengiriman'] as TabId[]).includes(activeTab) &&
        data && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
              <FileText className="h-10 w-10 text-gray-300" />
              <p className="text-sm">
                Data laporan{' '}
                <span className="font-medium">
                  {TABS.find((t) => t.id === activeTab)?.label}
                </span>{' '}
                berhasil dimuat.
              </p>
              <p className="text-xs text-gray-400">
                Gunakan tombol Ekspor PDF atau Ekspor Excel untuk mengunduh laporan.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
