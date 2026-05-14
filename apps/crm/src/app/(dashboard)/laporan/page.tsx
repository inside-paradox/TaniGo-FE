'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, FileSpreadsheet, RefreshCw, AlertTriangle, Package, Clock, CheckCircle } from 'lucide-react'
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
import { useAuthStore } from '@/store/auth-store'
import { formatRupiah, formatTanggalWaktu, downloadBlob } from '@/lib/utils'
import type { Shift } from '@/types'

type TabId = 'penjualan' | 'stok' | 'shift' | 'pembelian' | 'pelangganVIP' | 'pengiriman'

const ALL_TABS: { id: TabId; label: string; gudangOnly?: boolean }[] = [
  { id: 'penjualan', label: 'Penjualan' },
  { id: 'stok', label: 'Stok' },
  { id: 'shift', label: 'Shift' },
  { id: 'pembelian', label: 'Pembelian', gudangOnly: true },
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
  const { user } = useAuthStore()
  const isGudang = user?.tipeCabang === 'gudang' || user?.role === 'superadmin'
  const TABS = ALL_TABS.filter((t) => !t.gudangOnly || isGudang)

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any
  const penjualanData = activeTab === 'penjualan' ? d : null
  const stokData = activeTab === 'stok' ? d : null
  const pembelianData = activeTab === 'pembelian' ? d : null
  const vipData = activeTab === 'pelangganVIP' ? d : null
  const pengirimanData = activeTab === 'pengiriman' ? d : null
  const shiftData = activeTab === 'shift' ? d : null

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

      {/* Stok — detail tables */}
      {activeTab === 'stok' && data && stokData && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {stokData.itemsMenipis?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-yellow-700">Produk Menipis</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-2 text-left">Produk</th>
                    <th className="px-4 py-2 text-center">Stok</th>
                    <th className="px-4 py-2 text-center">Min</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {stokData.itemsMenipis.map((i: { nama: string; sku: string; stok: number; threshold: number; satuan: string }) => (
                      <tr key={i.sku}>
                        <td className="px-4 py-2"><p className="font-medium">{i.nama}</p><p className="text-xs text-gray-400">{i.sku}</p></td>
                        <td className="px-4 py-2 text-center text-yellow-700 font-semibold">{i.stok} {i.satuan}</td>
                        <td className="px-4 py-2 text-center text-gray-400">{i.threshold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
          {stokData.itemsHabis?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-red-700">Produk Habis</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-2 text-left">Produk</th>
                    <th className="px-4 py-2 text-left">SKU</th>
                    <th className="px-4 py-2 text-left">Satuan</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {stokData.itemsHabis.map((i: { nama: string; sku: string; satuan: string }) => (
                      <tr key={i.sku}>
                        <td className="px-4 py-2 font-medium">{i.nama}</td>
                        <td className="px-4 py-2 text-gray-400 text-xs">{i.sku}</td>
                        <td className="px-4 py-2 text-gray-500">{i.satuan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Penjualan — top produk */}
      {activeTab === 'penjualan' && data && penjualanData?.topProduk?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Top Produk Terjual</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <th className="px-4 py-3 text-left">Produk</th>
                <th className="px-4 py-3 text-center">Qty Terjual</th>
              </tr></thead>
              <tbody className="divide-y">
                {penjualanData.topProduk.map((p: { nama: string; qty: number }, i: number) => (
                  <tr key={p.nama}>
                    <td className="px-4 py-3"><span className="mr-2 text-gray-400">#{i + 1}</span>{p.nama}</td>
                    <td className="px-4 py-3 text-center font-semibold">{p.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Pembelian */}
      {activeTab === 'pembelian' && data && pembelianData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard label="Total PO" value={pembelianData.totalPO ?? 0} sub="Purchase order" />
            <SummaryCard label="Total Nilai" value={formatRupiah(pembelianData.totalNilai ?? 0)} sub="Nilai pembelian" />
            <SummaryCard label="Total Dibayar" value={formatRupiah(pembelianData.totalDibayar ?? 0)} sub="Sudah dilunasi" />
            <SummaryCard label="Sisa Hutang" value={formatRupiah(pembelianData.sisaHutang ?? 0)} sub="Belum dibayar" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Status Purchase Order</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-2 text-left">Status</th><th className="px-4 py-2 text-center">Jumlah</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {(pembelianData.statusBreakdown ?? []).map((s: { status: string; count: number }) => (
                      <tr key={s.status}><td className="px-4 py-2 font-medium">{s.status}</td><td className="px-4 py-2 text-center">{s.count}</td></tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Top Supplier</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-2 text-left">Supplier</th><th className="px-4 py-2 text-right">Total Nilai</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {(pembelianData.topSupplier ?? []).map((s: { nama: string; nilai: number }) => (
                      <tr key={s.nama}><td className="px-4 py-2 font-medium">{s.nama}</td><td className="px-4 py-2 text-right">{formatRupiah(s.nilai)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Pelanggan VIP */}
      {activeTab === 'pelangganVIP' && data && vipData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard label="Total Pelanggan VIP" value={vipData.totalPelanggan ?? 0} />
            <SummaryCard label="Total Kredit Limit" value={formatRupiah(vipData.totalKreditLimit ?? 0)} />
            <SummaryCard label="Kredit Terpakai" value={formatRupiah(vipData.totalKreditTerpakai ?? 0)} />
            <SummaryCard label="Tagihan Outstanding" value={formatRupiah(vipData.totalTagihanOutstanding ?? 0)} sub="Belum lunas" />
          </div>
          <Card>
            <CardHeader><CardTitle>Status Kredit Pelanggan</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-center">Jumlah Pelanggan</th>
                </tr></thead>
                <tbody className="divide-y">
                  {(vipData.statusKredit ?? []).map((s: { status: string; count: number }) => (
                    <tr key={s.status}>
                      <td className="px-4 py-3 font-medium capitalize">{s.status.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-center">{s.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pengiriman */}
      {activeTab === 'pengiriman' && data && pengirimanData && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard label="Total Pengiriman" value={pengirimanData.totalPengiriman ?? 0} />
          <SummaryCard label="Selesai" value={pengirimanData.selesai ?? 0} sub="Terkirim sukses" />
          <SummaryCard label="Gagal" value={pengirimanData.gagal ?? 0} sub="Tidak terkirim" />
          <SummaryCard label="Success Rate" value={`${pengirimanData.successRate ?? 0}%`} sub="Tingkat keberhasilan" />
        </div>
      )}

      {/* Shift */}
      {activeTab === 'shift' && data && shiftData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <SummaryCard label="Total Shift" value={shiftData.totalShift ?? 0} sub="Dalam periode ini" />
            <SummaryCard label="Total Transaksi" value={shiftData.totalTransaksi ?? 0} sub="Semua kasir" />
            <SummaryCard label="Total Pendapatan" value={formatRupiah(shiftData.totalPendapatan ?? 0)} sub="Dalam periode ini" />
            <SummaryCard label="Tunai" value={formatRupiah(shiftData.totalTunai ?? 0)} />
            <SummaryCard label="Non-Tunai" value={formatRupiah(shiftData.totalNonTunai ?? 0)} />
            <SummaryCard label="Total Diskon" value={formatRupiah(shiftData.totalDiskon ?? 0)} />
          </div>
          <Card>
            <CardHeader><CardTitle>Riwayat Shift</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                      <th className="px-4 py-3 text-left">Kasir</th>
                      <th className="px-4 py-3 text-left">Cabang</th>
                      <th className="px-4 py-3 text-left">Mulai</th>
                      <th className="px-4 py-3 text-left">Selesai</th>
                      <th className="px-4 py-3 text-center">Transaksi</th>
                      <th className="px-4 py-3 text-right">Pendapatan</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(shiftData.shifts ?? []).map((sh: Shift) => (
                      <tr key={sh.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{sh.kasirNama}</td>
                        <td className="px-4 py-3 text-gray-500">{sh.cabangNama}</td>
                        <td className="px-4 py-3 text-gray-600">{formatTanggalWaktu(sh.mulaiAt)}</td>
                        <td className="px-4 py-3 text-gray-600">{sh.selesaiAt ? formatTanggalWaktu(sh.selesaiAt) : '—'}</td>
                        <td className="px-4 py-3 text-center">{sh.totalTransaksi}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatRupiah(sh.totalPendapatan)}</td>
                        <td className="px-4 py-3 text-center">
                          {sh.status === 'Aktif'
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />Aktif</span>
                            : <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"><CheckCircle className="h-3 w-3" />Selesai</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
