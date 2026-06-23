'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, FileSpreadsheet, RefreshCw, AlertTriangle, Package, Clock } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { reportsApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { formatRupiah } from '@/lib/utils'
import { printLaporanPdf, downloadLaporanCsv } from '@/lib/print'

type TabId = 'stok' | 'pembelian' | 'pengiriman'

// `gudangOnly`: hanya Admin Gudang & Superadmin yang relevan dengan laporan pembelian.
// Tanpa flag: semua role.
const ALL_TABS: { id: TabId; label: string; gudangOnly?: boolean }[] = [
  { id: 'stok', label: 'Stok' },
  { id: 'pembelian', label: 'Pembelian', gudangOnly: true },
  { id: 'pengiriman', label: 'Pengiriman' },
]

const tabToJenis: Record<TabId, string> = {
  stok: 'stok',
  pembelian: 'pembelian',
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
  const isSuperadmin = user?.role === 'superadmin'
  const canSeeGudang = isSuperadmin || user?.tipeCabang === 'gudang'

  const TABS = useMemo(
    () => ALL_TABS.filter((t) => !t.gudangOnly || canSeeGudang),
    [canSeeGudang]
  )

  const [activeTab, setActiveTab] = useState<TabId>('stok')
  const safeTab: TabId = TABS.some((t) => t.id === activeTab) ? activeTab : (TABS[0]?.id ?? 'stok')

  const [tanggalDari, setTanggalDari] = useState(get7DaysAgoStr())
  const [tanggalSampai, setTanggalSampai] = useState(getTodayStr())
  const [enabled, setEnabled] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)

  const params = { tanggalDari, tanggalSampai }

  const fetchFn = () => {
    switch (safeTab) {
      case 'stok':
        return reportsApi.getStok(params)
      case 'pembelian':
        return reportsApi.getPembelian(params)
      case 'pengiriman':
        return reportsApi.getPengiriman(params)
    }
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['laporan', safeTab, tanggalDari, tanggalSampai],
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

  const handleExportPdf = () => {
    if (!data) return
    setExportingPdf(true)
    try {
      printLaporanPdf(safeTab, data, { tanggalDari, tanggalSampai })
    } finally {
      setExportingPdf(false)
    }
  }

  const handleExportExcel = () => {
    if (!data) return
    setExportingExcel(true)
    try {
      const fileName = `laporan-${tabToJenis[safeTab]}-${tanggalDari}-${tanggalSampai}.csv`
      downloadLaporanCsv(safeTab, data, fileName)
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
  const stokData = safeTab === 'stok' ? d : null
  const pembelianData = safeTab === 'pembelian' ? d : null
  const pengirimanData = safeTab === 'pengiriman' ? d : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        subtitle="Analisis data stok, pembelian, dan pengiriman"
      />

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                safeTab === tab.id
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

      {/* Stok */}
      {safeTab === 'stok' && data && stokData && (
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
      {safeTab === 'stok' && data && stokData && (
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

      {/* Pembelian */}
      {safeTab === 'pembelian' && data && pembelianData && (
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

      {/* Pengiriman */}
      {safeTab === 'pengiriman' && data && pengirimanData && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard label="Total Pengiriman" value={pengirimanData.totalPengiriman ?? 0} />
          <SummaryCard label="Selesai" value={pengirimanData.selesai ?? 0} sub="Terkirim sukses" />
          <SummaryCard label="Gagal" value={pengirimanData.gagal ?? 0} sub="Tidak terkirim" />
          <SummaryCard label="Success Rate" value={`${pengirimanData.successRate ?? 0}%`} sub="Tingkat keberhasilan" />
        </div>
      )}

    </div>
  )
}
