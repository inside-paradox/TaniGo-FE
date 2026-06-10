'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, AlertTriangle, Clock, Wallet, Users } from 'lucide-react'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Pagination } from '@/components/shared/pagination'
import { SearchInput } from '@/components/shared/search-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { InputNominal } from '@/components/ui/input-nominal'
import { Skeleton } from '@/components/ui/skeleton'
import { usePelangganVIP, useCreatePelangganVIP, useRingkasanPiutang } from '@/hooks/use-customers'
import { formatRupiah } from '@/lib/utils'
import type { PelangganVIP, StatusKreditPelanggan } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_KREDIT_OPTIONS = [
  { value: '', label: 'Semua Status Kredit' },
  { value: 'aman', label: 'Aman' },
  { value: 'mendekati_limit', label: 'Mendekati Limit' },
  { value: 'melebihi_limit', label: 'Melebihi Limit' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'suspend', label: 'Suspend' },
]

type StatusTagihanFilter = '' | 'ada_hutang' | 'mendekati_jt' | 'overdue'

const TAGIHAN_FILTER_TABS: { value: StatusTagihanFilter; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'ada_hutang', label: 'Ada Hutang' },
  { value: 'mendekati_jt', label: 'Mendekati JT' },
  { value: 'overdue', label: 'Overdue' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusKreditVariant(s: StatusKreditPelanggan) {
  switch (s) {
    case 'aman': return 'success'
    case 'mendekati_limit': return 'warning'
    case 'melebihi_limit': return 'danger'
    default: return 'default'
  }
}

function statusKreditLabel(s: StatusKreditPelanggan) {
  switch (s) {
    case 'aman': return 'Aman'
    case 'mendekati_limit': return 'Mendekati Limit'
    case 'melebihi_limit': return 'Melebihi Limit'
    default: return s
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KreditProgress({ terpakai, limit }: { terpakai: number; limit: number }) {
  const pct = limit > 0 ? Math.min((terpakai / limit) * 100, 100) : 0
  const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="w-24">
      <div className="mb-0.5 flex justify-between text-[10px] text-gray-500">
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function TagihanBadge({ customer }: { customer: PelangganVIP }) {
  const tt = customer.tagihanTerdekat
  const terpakai = customer.creditUsed ?? customer.kreditTerpakai ?? 0

  if (!tt || terpakai === 0) {
    return <span className="text-xs text-gray-400">—</span>
  }

  const { hariJatuhTempo, dueDate } = tt

  if (hariJatuhTempo === null || dueDate === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
        {formatRupiah(tt.nominal)}
      </span>
    )
  }

  if (hariJatuhTempo < 0) {
    // Overdue
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        <AlertTriangle className="h-3 w-3" />
        Lewat {Math.abs(hariJatuhTempo)} hari
      </span>
    )
  }

  if (hariJatuhTempo === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        <AlertTriangle className="h-3 w-3" />
        Hari ini!
      </span>
    )
  }

  if (hariJatuhTempo <= 7) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
        <Clock className="h-3 w-3" />
        {hariJatuhTempo} hari lagi
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
      <Clock className="h-3 w-3" />
      {hariJatuhTempo} hari lagi
    </span>
  )
}

function SummaryCards({
  loading,
  totalPelanggan,
  onFilterChange,
}: {
  loading: boolean
  totalPelanggan: number
  onFilterChange: (f: StatusTagihanFilter) => void
}) {
  const { data: ringkasan, isLoading: ringkasanLoading } = useRingkasanPiutang()
  const isLoading = loading || ringkasanLoading

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total pelanggan */}
      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-7 w-16" /></div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Total Pelanggan VIP</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{totalPelanggan}</p>
                <p className="mt-0.5 text-xs text-gray-400">Pelanggan terdaftar</p>
              </div>
              <div className="shrink-0 ml-3 rounded-xl bg-green-50 p-3">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total piutang */}
      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-7 w-32" /></div>
          ) : (
            <button
              className="w-full text-left"
              onClick={() => onFilterChange('ada_hutang')}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500">Total Piutang</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 break-words">
                    {formatRupiah(ringkasan?.totalPiutang ?? 0)}
                  </p>
                  <p className="mt-0.5 text-xs text-blue-600 hover:underline">Lihat yang berhutang →</p>
                </div>
                <div className="shrink-0 ml-3 rounded-xl bg-blue-50 p-3">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </button>
          )}
        </CardContent>
      </Card>

      {/* Mendekati jatuh tempo */}
      <Card className={ringkasan && ringkasan.mendekatiJatuhTempo.count > 0 ? 'border-orange-200' : ''}>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-7 w-12" /></div>
          ) : (
            <button
              className="w-full text-left"
              onClick={() => onFilterChange('mendekati_jt')}
              disabled={!ringkasan || ringkasan.mendekatiJatuhTempo.count === 0}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500">Mendekati Jatuh Tempo</p>
                  <p className={`mt-1 text-2xl font-bold ${ringkasan && ringkasan.mendekatiJatuhTempo.count > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                    {ringkasan?.mendekatiJatuhTempo.count ?? 0}
                    <span className="ml-1 text-sm font-normal text-gray-400">pelanggan</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {ringkasan && ringkasan.mendekatiJatuhTempo.count > 0
                      ? formatRupiah(ringkasan.mendekatiJatuhTempo.nominal)
                      : 'Tidak ada dalam 7 hari'}
                  </p>
                </div>
                <div className={`shrink-0 ml-3 rounded-xl p-3 ${ringkasan && ringkasan.mendekatiJatuhTempo.count > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                  <Clock className={`h-5 w-5 ${ringkasan && ringkasan.mendekatiJatuhTempo.count > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
                </div>
              </div>
            </button>
          )}
        </CardContent>
      </Card>

      {/* Overdue */}
      <Card className={ringkasan && ringkasan.sudahJatuhTempo.count > 0 ? 'border-red-200' : ''}>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-7 w-12" /></div>
          ) : (
            <button
              className="w-full text-left"
              onClick={() => onFilterChange('overdue')}
              disabled={!ringkasan || ringkasan.sudahJatuhTempo.count === 0}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500">Sudah Jatuh Tempo</p>
                  <p className={`mt-1 text-2xl font-bold ${ringkasan && ringkasan.sudahJatuhTempo.count > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {ringkasan?.sudahJatuhTempo.count ?? 0}
                    <span className="ml-1 text-sm font-normal text-gray-400">pelanggan</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {ringkasan && ringkasan.sudahJatuhTempo.count > 0
                      ? formatRupiah(ringkasan.sudahJatuhTempo.nominal)
                      : 'Semua tagihan on-track'}
                  </p>
                </div>
                <div className={`shrink-0 ml-3 rounded-xl p-3 ${ringkasan && ringkasan.sudahJatuhTempo.count > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <AlertTriangle className={`h-5 w-5 ${ringkasan && ringkasan.sudahJatuhTempo.count > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                </div>
              </div>
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Table columns ────────────────────────────────────────────────────────────

function buildColumns(): ColumnDef<PelangganVIP>[] {
  return [
    {
      accessorKey: 'namaLengkap',
      header: 'Nama',
      cell: ({ row }) => (
        <Link
          href={`/pelanggan-vip/${row.original.id}`}
          className="font-semibold text-gray-900 hover:text-green-700 hover:underline"
        >
          {row.original.namaLengkap}
        </Link>
      ),
    },
    {
      accessorKey: 'nomorTelepon',
      header: 'Telepon',
      cell: ({ getValue }) => <span className="text-gray-700">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'creditLimit',
      header: 'Limit Kredit',
      cell: ({ getValue }) => (
        <span className="font-medium text-gray-900">{formatRupiah(getValue<number>())}</span>
      ),
    },
    {
      id: 'creditUsed',
      header: 'Terpakai',
      cell: ({ row }) => {
        const terpakai = row.original.creditUsed ?? row.original.kreditTerpakai ?? 0
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">{formatRupiah(terpakai)}</span>
            <KreditProgress terpakai={terpakai} limit={row.original.creditLimit} />
          </div>
        )
      },
    },
    {
      accessorKey: 'sisaKredit',
      header: 'Sisa Kredit',
      cell: ({ getValue }) => (
        <span className="font-medium text-gray-900">{formatRupiah(getValue<number>())}</span>
      ),
    },
    {
      id: 'jatuhTempo',
      header: 'Jatuh Tempo',
      cell: ({ row }) => <TagihanBadge customer={row.original} />,
    },
    {
      accessorKey: 'statusKredit',
      header: 'Status Kredit',
      cell: ({ getValue }) => {
        const s = getValue<StatusKreditPelanggan>()
        return <Badge variant={statusKreditVariant(s)}>{statusKreditLabel(s)}</Badge>
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue<'aktif' | 'suspend'>()
        return (
          <Badge variant={s === 'aktif' ? 'success' : 'danger'}>
            {s === 'aktif' ? 'Aktif' : 'Suspend'}
          </Badge>
        )
      },
    },
  ]
}

// ─── Form types ───────────────────────────────────────────────────────────────

interface TambahForm {
  namaLengkap: string
  nomorTelepon: string
  alamat: string
  creditLimit: number
  catatan: string
}

type TambahFormErrors = Partial<Record<keyof TambahForm, string>>

const EMPTY_FORM: TambahForm = {
  namaLengkap: '',
  nomorTelepon: '',
  alamat: '',
  creditLimit: 0,
  catatan: '',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PelangganVIPPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')
  const [statusKredit, setStatusKredit] = useState('')
  const [status, setStatus] = useState('')
  const [statusTagihan, setStatusTagihan] = useState<StatusTagihanFilter>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<TambahForm>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<TambahFormErrors>({})

  const { data, isLoading } = usePelangganVIP({
    page,
    limit,
    search: search || undefined,
    statusKredit: statusKredit || undefined,
    status: status || undefined,
    statusTagihan: statusTagihan || undefined,
    sortBy: sorting[0]?.id,
    sortOrder: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
  })

  const createMutation = useCreatePelangganVIP()

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater
    setSorting(next)
    setPage(1)
  }

  const handleFilterChange = (f: StatusTagihanFilter) => {
    setStatusTagihan(f)
    setPage(1)
  }

  const validate = (): boolean => {
    const errors: TambahFormErrors = {}
    if (!form.namaLengkap.trim()) errors.namaLengkap = 'Nama wajib diisi'
    if (!form.nomorTelepon.trim()) errors.nomorTelepon = 'Nomor telepon wajib diisi'
    if (!form.alamat.trim()) errors.alamat = 'Alamat wajib diisi'
    if (!form.creditLimit || form.creditLimit <= 0)
      errors.creditLimit = 'Limit kredit harus angka positif'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await createMutation.mutateAsync({
      namaLengkap: form.namaLengkap,
      nomorTelepon: form.nomorTelepon,
      alamat: form.alamat,
      creditLimit: form.creditLimit,
      catatan: form.catatan || undefined,
    })
    setModalOpen(false)
    setForm(EMPTY_FORM)
    setFormErrors({})
  }

  const columns = buildColumns()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pelanggan VIP"
        subtitle={`${data?.meta.total ?? 0} pelanggan VIP terdaftar`}
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Tambah Pelanggan VIP
          </Button>
        }
      />

      {/* Summary Cards */}
      <SummaryCards
        loading={isLoading}
        totalPelanggan={data?.meta.total ?? 0}
        onFilterChange={handleFilterChange}
      />

      <Card>
        <div className="p-4 sm:p-6">

          {/* Filter Tabs */}
          <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
            {TAGIHAN_FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleFilterChange(tab.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  statusTagihan === tab.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(val) => { setSearch(val); setPage(1) }}
              placeholder="Cari nama atau telepon..."
              className="w-full sm:w-72"
            />
            <select
              value={statusKredit}
              onChange={(e) => { setStatusKredit(e.target.value); setPage(1) }}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {STATUS_KREDIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <DataTable
            columns={columns}
            data={data?.data ?? []}
            loading={isLoading}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            emptyText="Belum ada pelanggan VIP"
          />

          {data && data.meta.total > 0 && (
            <Pagination
              page={page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1) }}
            />
          )}
        </div>
      </Card>

      {/* Modal Tambah Pelanggan */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm(EMPTY_FORM); setFormErrors({}) }}
        title="Tambah Pelanggan VIP"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            required
            value={form.namaLengkap}
            onChange={(e) => setForm((f) => ({ ...f, namaLengkap: e.target.value }))}
            error={formErrors.namaLengkap}
            placeholder="Masukkan nama lengkap"
          />
          <Input
            label="Nomor Telepon"
            required
            value={form.nomorTelepon}
            onChange={(e) => setForm((f) => ({ ...f, nomorTelepon: e.target.value }))}
            error={formErrors.nomorTelepon}
            placeholder="Contoh: 08123456789"
          />
          <Input
            label="Alamat"
            required
            value={form.alamat}
            onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
            error={formErrors.alamat}
            placeholder="Masukkan alamat lengkap"
          />
          <InputNominal
            label="Limit Kredit (Rp)"
            required
            value={form.creditLimit}
            onChange={(v) => setForm((f) => ({ ...f, creditLimit: v }))}
            error={formErrors.creditLimit}
          />
          <Input
            label="Catatan (opsional)"
            value={form.catatan}
            onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
            placeholder="Catatan tambahan"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setModalOpen(false); setForm(EMPTY_FORM); setFormErrors({}) }}
            >
              Batal
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
