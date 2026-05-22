'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Pagination } from '@/components/shared/pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { InputNominal } from '@/components/ui/input-nominal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  usePelanggan,
  useTagihanPelanggan,
  useCatatPembayaranVIP,
  useUpdatePelangganVIP,
  CUSTOMERS_KEY,
} from '@/hooks/use-customers'
import { customersApi } from '@/lib/api/customers'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import type { TagihanVIP, StatusTagihan, StatusKreditPelanggan } from '@/types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function statusKreditLabel(s: StatusKreditPelanggan) {
  switch (s) {
    case 'aman': return 'Aman'
    case 'mendekati_limit': return 'Mendekati Limit'
    case 'melebihi_limit': return 'Melebihi Limit'
    default: return s
  }
}

function statusKreditVariant(s: StatusKreditPelanggan) {
  switch (s) {
    case 'aman': return 'success' as const
    case 'mendekati_limit': return 'warning' as const
    case 'melebihi_limit': return 'danger' as const
    default: return 'default' as const
  }
}

function statusTagihanVariant(s: StatusTagihan) {
  switch (s) {
    case 'Lunas': return 'success' as const
    case 'Sebagian': return 'warning' as const
    case 'Belum Bayar': return 'danger' as const
    case 'Jatuh Tempo': return 'danger' as const
    default: return 'default' as const
  }
}

function KreditProgressBar({ terpakai, limit }: { terpakai: number; limit: number }) {
  const pct = limit > 0 ? Math.min((terpakai / limit) * 100, 100) : 0
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-400' : 'bg-green-500'
  return (
    <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className={`h-3 rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'tagihan' | 'riwayat' | 'info-kredit'

// ─── Catat Pembayaran Modal ───────────────────────────────────────────────────

interface CatatPembayaranModalProps {
  open: boolean
  onClose: () => void
  tagihan: TagihanVIP | null
}

const METODE_OPTIONS = [
  { value: 'Tunai', label: 'Tunai' },
  { value: 'Transfer', label: 'Transfer Bank' },
  { value: 'QRIS', label: 'QRIS' },
]

function CatatPembayaranModal({ open, onClose, tagihan }: CatatPembayaranModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const [nominal, setNominal] = useState(0)
  const [tanggal, setTanggal] = useState(today)
  const [metode, setMetode] = useState('Tunai')
  const [catatan, setCatatan] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { mutateAsync, isPending } = useCatatPembayaranVIP()

  function validate() {
    const e: Record<string, string> = {}
    const nom = nominal
    if (!nominal || nom <= 0) e.nominal = 'Nominal harus lebih dari 0'
    if (tagihan && nom > tagihan.sisaTagihan) e.nominal = `Nominal tidak boleh melebihi sisa tagihan (${formatRupiah(tagihan.sisaTagihan)})`
    if (!tanggal) e.tanggal = 'Tanggal wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tagihan || !validate()) return
    await mutateAsync({
      customerId: tagihan.pelangganId,
      invoiceId: tagihan.id,
      nominal: nominal,
      tanggal,
      metode,
      catatan: catatan || undefined,
    })
    handleClose()
  }

  function handleClose() {
    setNominal(0)
    setTanggal(today)
    setMetode('Tunai')
    setCatatan('')
    setErrors({})
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Catat Pembayaran" size="md">
      {tagihan && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <p className="font-medium">No. Order: {tagihan.nomorPesanan ?? tagihan.nomorOrder ?? '—'}</p>
            <p>Sisa Tagihan: <span className="font-semibold text-red-600">{formatRupiah(tagihan.sisaTagihan)}</span></p>
          </div>
          <InputNominal
            label="Nominal Pembayaran"
            required
            value={nominal}
            onChange={(v) => setNominal(Math.min(v, tagihan.sisaTagihan))}
            error={errors.nominal}
          />
          <Input
            label="Tanggal Pembayaran"
            type="date"
            required
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            error={errors.tanggal}
          />
          <Select
            label="Metode Pembayaran"
            required
            options={METODE_OPTIONS}
            value={metode}
            onChange={(e) => setMetode(e.target.value)}
          />
          <Textarea
            label="Catatan (opsional)"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan tambahan..."
            rows={2}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" loading={isPending}>
              Simpan Pembayaran
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

// ─── Tab Tagihan ─────────────────────────────────────────────────────────────

function TabTagihan({ pelangganId }: { pelangganId: string }) {
  const [page, setPage] = useState(1)
  const [tampilSemua, setTampilSemua] = useState(false)
  const [selectedTagihan, setSelectedTagihan] = useState<TagihanVIP | null>(null)
  const [modalBayarOpen, setModalBayarOpen] = useState(false)

  const { data, isLoading } = useTagihanPelanggan(pelangganId, {
    page,
    limit: 20,
    ...(tampilSemua ? {} : { status: 'belum_lunas' }),
  })

  const columns: ColumnDef<TagihanVIP>[] = [
    {
      id: 'nomorPesanan',
      header: 'No. Order',
      cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.nomorPesanan ?? row.original.nomorOrder ?? '—'}</span>,
    },
    {
      id: 'createdAt',
      header: 'Tanggal',
      cell: ({ row }) => {
        const v = row.original.createdAt ?? row.original.tanggal ?? ''
        return <span className="whitespace-nowrap text-gray-700">{v ? formatTanggal(v) : '—'}</span>
      },
    },
    {
      id: 'nominal',
      header: 'Total',
      cell: ({ row }) => <span className="font-medium">{formatRupiah(row.original.nominal ?? row.original.total ?? 0)}</span>,
    },
    {
      id: 'nominalTerbayar',
      header: 'Dibayar',
      cell: ({ row }) => <span className="text-green-700">{formatRupiah(row.original.nominalTerbayar ?? row.original.jumlahDibayar)}</span>,
    },
    {
      accessorKey: 'sisaTagihan',
      header: 'Sisa',
      cell: ({ getValue }) => {
        const v = getValue<number>()
        return <span className={v > 0 ? 'font-semibold text-red-600' : 'text-gray-500'}>{formatRupiah(v)}</span>
      },
    },
    {
      id: 'tanggalJatuhTempo',
      header: 'Jatuh Tempo',
      cell: ({ row }) => {
        const v = row.original.tanggalJatuhTempo ?? row.original.dueDate ?? null
        return <span className="whitespace-nowrap text-gray-700">{v ? formatTanggal(v) : '—'}</span>
      },
    },
    {
      id: 'statusTagihan',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.statusTagihan ?? row.original.status
        if (!s) return null
        return (
          <Badge
            variant={statusTagihanVariant(s)}
            className={s === 'Jatuh Tempo' ? 'font-bold' : undefined}
          >
            {s}
          </Badge>
        )
      },
    },
    {
      id: 'aksi',
      header: '',
      cell: ({ row }) => {
        const s = row.original.statusTagihan ?? row.original.status
        if (s === 'Lunas') return null
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedTagihan(row.original)
              setModalBayarOpen(true)
            }}
          >
            Catat Pembayaran
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={tampilSemua}
            onChange={(e) => {
              setTampilSemua(e.target.checked)
              setPage(1)
            }}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          Tampilkan semua tagihan (termasuk yang sudah lunas)
        </label>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        emptyText="Tidak ada tagihan ditemukan"
      />

      {data && data.meta.total > 0 && (
        <Pagination
          page={page}
          totalPages={data.meta.totalPages}
          total={data.meta.total}
          limit={20}
          onPageChange={setPage}
        />
      )}

      <CatatPembayaranModal
        open={modalBayarOpen}
        onClose={() => {
          setModalBayarOpen(false)
          setSelectedTagihan(null)
        }}
        tagihan={selectedTagihan}
      />
    </div>
  )
}

// ─── Tab Riwayat Transaksi ────────────────────────────────────────────────────

interface RiwayatItem {
  id: string
  nomorPesanan: string
  tanggal: string
  total: number
  metodePembayaran: string
  status: string
}

function TabRiwayat({ pelangganId }: { pelangganId: string }) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: [CUSTOMERS_KEY, pelangganId, 'riwayat', { page, limit: 20 }],
    queryFn: () => customersApi.getRiwayatTransaksi(pelangganId, { page, limit: 20 }),
    enabled: !!pelangganId,
    placeholderData: (prev) => prev,
  })

  const columns: ColumnDef<RiwayatItem>[] = [
    {
      accessorKey: 'nomorPesanan',
      header: 'No. Pesanan',
      cell: ({ getValue }) => <span className="font-medium text-gray-900">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'tanggal',
      header: 'Tanggal',
      cell: ({ getValue }) => <span className="whitespace-nowrap text-gray-700">{formatTanggal(getValue<string>())}</span>,
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ getValue }) => <span className="font-medium">{formatRupiah(getValue<number>())}</span>,
    },
    {
      accessorKey: 'metodePembayaran',
      header: 'Metode Bayar',
      cell: ({ getValue }) => <span className="text-gray-700">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue<string>()
        return <Badge variant="default">{s}</Badge>
      },
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        emptyText="Belum ada riwayat transaksi"
      />
      {data && data.meta.total > 0 && (
        <Pagination
          page={page}
          totalPages={data.meta.totalPages}
          total={data.meta.total}
          limit={20}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

// ─── Tab Info Kredit ──────────────────────────────────────────────────────────

function TabInfoKredit({ creditLimit, creditUsed, sisaKredit, statusKredit }: {
  creditLimit: number
  creditUsed?: number
  sisaKredit: number
  statusKredit: StatusKreditPelanggan
}) {
  const used = creditUsed ?? 0
  const pct = creditLimit > 0 ? Math.min((used / creditLimit) * 100, 100) : 0
  const colorText = pct > 90 ? 'text-red-600' : pct > 70 ? 'text-yellow-600' : 'text-green-600'

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
        <p className="mb-1 text-sm font-medium text-gray-500">Limit Kredit</p>
        <p className="text-2xl font-bold text-gray-900">{formatRupiah(creditLimit)}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
        <p className="mb-1 text-sm font-medium text-gray-500">Kredit Terpakai</p>
        <p className={`text-2xl font-bold ${colorText}`}>{formatRupiah(used)}</p>
        <p className="mt-1 text-xs text-gray-400">{pct.toFixed(1)}% dari limit</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
        <p className="mb-1 text-sm font-medium text-gray-500">Sisa Kredit</p>
        <p className="text-2xl font-bold text-green-700">{formatRupiah(sisaKredit)}</p>
      </div>
      <div className="col-span-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Penggunaan Kredit</p>
          <Badge variant={statusKreditVariant(statusKredit)}>{statusKreditLabel(statusKredit)}</Badge>
        </div>
        <KreditProgressBar terpakai={used} limit={creditLimit} />
        <p className="mt-2 text-right text-xs text-gray-500">{pct.toFixed(1)}%</p>
      </div>
    </div>
  )
}

// ─── Edit Pelanggan Modal ─────────────────────────────────────────────────────

interface EditForm {
  namaLengkap: string
  nomorTelepon: string
  alamat: string
  creditLimit: number
  catatan: string
  status: 'aktif' | 'suspend'
}

interface EditModalProps {
  open: boolean
  onClose: () => void
  pelangganId: string
  initial: EditForm
}

function EditPelangganModal({ open, onClose, pelangganId, initial }: EditModalProps) {
  const [form, setForm] = useState<EditForm>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof EditForm, string>>>({})
  const { mutateAsync, isPending } = useUpdatePelangganVIP()

  function validate() {
    const e: Partial<Record<keyof EditForm, string>> = {}
    if (!form.namaLengkap.trim()) e.namaLengkap = 'Nama wajib diisi'
    if (!form.nomorTelepon.trim()) e.nomorTelepon = 'Nomor telepon wajib diisi'
    if (!form.alamat.trim()) e.alamat = 'Alamat wajib diisi'
    if (!form.creditLimit || form.creditLimit <= 0)
      e.creditLimit = 'Limit kredit harus angka positif'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await mutateAsync({
      id: pelangganId,
      data: {
        namaLengkap: form.namaLengkap,
        nomorTelepon: form.nomorTelepon,
        alamat: form.alamat,
        creditLimit: form.creditLimit,
        catatan: form.catatan || undefined,
        status: form.status,
      },
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Data Pelanggan" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Lengkap"
          required
          value={form.namaLengkap}
          onChange={(e) => setForm((f) => ({ ...f, namaLengkap: e.target.value }))}
          error={errors.namaLengkap}
        />
        <Input
          label="Nomor Telepon"
          required
          value={form.nomorTelepon}
          onChange={(e) => setForm((f) => ({ ...f, nomorTelepon: e.target.value }))}
          error={errors.nomorTelepon}
        />
        <Input
          label="Alamat"
          required
          value={form.alamat}
          onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
          error={errors.alamat}
        />
        <InputNominal
          label="Limit Kredit (Rp)"
          required
          value={form.creditLimit}
          onChange={(v) => setForm((f) => ({ ...f, creditLimit: v }))}
          error={errors.creditLimit}
        />
        <Textarea
          label="Catatan (opsional)"
          value={form.catatan}
          onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
          rows={2}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Status Pelanggan</label>
          <div className="flex gap-4">
            {(['aktif', 'suspend'] as const).map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-2 text-sm capitalize text-gray-700">
                <input
                  type="radio"
                  name="status-pelanggan"
                  value={s}
                  checked={form.status === s}
                  onChange={() => setForm((f) => ({ ...f, status: s }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                />
                {s === 'aktif' ? 'Aktif' : 'Suspend'}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" loading={isPending}>
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DetailPelangganVIPPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('tagihan')
  const [editOpen, setEditOpen] = useState(false)

  const { data: pelanggan, isLoading } = usePelanggan(id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!pelanggan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-500">Pelanggan tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/pelanggan-vip')}>
          Kembali ke Daftar
        </Button>
      </div>
    )
  }

  const pelangganCreditUsed = pelanggan.creditUsed ?? pelanggan.kreditTerpakai ?? 0
  const pct = pelanggan.creditLimit > 0
    ? Math.min((pelangganCreditUsed / pelanggan.creditLimit) * 100, 100)
    : 0
  const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-400' : 'bg-green-500'

  const tabs: { key: Tab; label: string }[] = [
    { key: 'tagihan', label: 'Tagihan' },
    { key: 'riwayat', label: 'Riwayat Transaksi' },
    { key: 'info-kredit', label: 'Info Kredit' },
  ]

  const editInitial: EditForm = {
    namaLengkap: pelanggan.namaLengkap,
    nomorTelepon: pelanggan.nomorTelepon,
    alamat: pelanggan.alamat,
    creditLimit: pelanggan.creditLimit,
    catatan: pelanggan.catatan ?? '',
    status: pelanggan.status,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={pelanggan.namaLengkap}
        subtitle={pelanggan.nomorTelepon}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant={pelanggan.status === 'aktif' ? 'success' : 'danger'} className="text-sm px-3 py-1">
              {pelanggan.status === 'aktif' ? 'Aktif' : 'Suspend'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/pelanggan-vip')}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pelanggan</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Alamat</dt>
                  <dd className="mt-0.5 text-gray-900">{pelanggan.alamat}</dd>
                </div>
                {pelanggan.catatan && (
                  <div>
                    <dt className="font-medium text-gray-500">Catatan</dt>
                    <dd className="mt-0.5 text-gray-700">{pelanggan.catatan}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card>
            <div className="border-b border-gray-200">
              <nav className="flex gap-1 px-6 pt-4">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
                      activeTab === t.key
                        ? 'border-green-600 text-green-700 bg-green-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-6">
              {activeTab === 'tagihan' && <TabTagihan pelangganId={id} />}
              {activeTab === 'riwayat' && <TabRiwayat pelangganId={id} />}
              {activeTab === 'info-kredit' && (
                <TabInfoKredit
                  creditLimit={pelanggan.creditLimit}
                  creditUsed={pelangganCreditUsed}
                  sisaKredit={pelanggan.sisaKredit}
                  statusKredit={pelanggan.statusKredit}
                />
              )}
            </div>
          </Card>
        </div>

        {/* Right column — Kredit Card */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Status Kredit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Limit Kredit</span>
                  <span className="font-semibold text-gray-900">{formatRupiah(pelanggan.creditLimit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Kredit Terpakai</span>
                  <span className="font-semibold text-red-600">{formatRupiah(pelangganCreditUsed)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sisa Kredit</span>
                  <span className="font-semibold text-green-700">{formatRupiah(pelanggan.sisaKredit)}</span>
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>Penggunaan</span>
                  <span>{pct.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-3 rounded-full transition-all ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-center pt-1">
                <Badge variant={statusKreditVariant(pelanggan.statusKredit)} className="text-sm px-3 py-1">
                  {statusKreditLabel(pelanggan.statusKredit)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <EditPelangganModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        pelangganId={id}
        initial={editInitial}
      />
    </div>
  )
}
