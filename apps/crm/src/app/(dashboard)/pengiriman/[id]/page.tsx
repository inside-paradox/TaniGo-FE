'use client'

import { useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Edit2,
  Package,
  Printer,
  Truck,
  Upload,
  XCircle,
  ClipboardCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmModal, Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { InputNominal } from '@/components/ui/input-nominal'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useDelivery,
  useUpdateDeliveryStatus,
  useUpdateBiayaPengiriman,
  useSubmitChecklistPengiriman,
  DELIVERIES_KEY,
} from '@/hooks/use-deliveries'
import { deliveriesApi } from '@/lib/api/deliveries'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { printSuratJalanPengiriman } from '@/lib/print'
import type { StatusPengiriman, StatusChecklistItem } from '@/types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function statusVariant(s: StatusPengiriman) {
  switch (s) {
    case 'Dijadwalkan': return 'info' as const
    case 'Dalam Perjalanan': return 'warning' as const
    case 'Selesai': return 'success' as const
    case 'Gagal': return 'danger' as const
    default: return 'default' as const
  }
}

// ─── Timeline ────────────────────────────────────────────────────────────────

const TIMELINE_STEPS: { status: StatusPengiriman; label: string; Icon: React.ElementType }[] = [
  { status: 'Dijadwalkan', label: 'Dijadwalkan', Icon: Clock },
  { status: 'Dalam Perjalanan', label: 'Dalam Perjalanan', Icon: Truck },
  { status: 'Selesai', label: 'Selesai', Icon: CheckCircle },
]

function TimelineStatus({ current }: { current: StatusPengiriman }) {
  const steps = current === 'Gagal'
    ? [...TIMELINE_STEPS, { status: 'Gagal' as StatusPengiriman, label: 'Gagal', Icon: XCircle }]
    : TIMELINE_STEPS

  const currentIdx = steps.findIndex((s) => s.status === current)

  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const isActive = step.status === current
        const isDone = i < currentIdx
        const isGagal = step.status === 'Gagal'

        return (
          <div key={step.status} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  isActive
                    ? isGagal
                      ? 'border-red-500 bg-red-100 text-red-600'
                      : 'border-green-600 bg-green-100 text-green-700'
                    : isDone
                    ? 'border-green-400 bg-green-50 text-green-500'
                    : 'border-gray-200 bg-gray-50 text-gray-300'
                }`}
              >
                <step.Icon className="h-4 w-4" />
              </div>
              {i < steps.length - 1 && (
                <div className={`h-6 w-0.5 ${isDone || isActive ? 'bg-green-300' : 'bg-gray-200'}`} />
              )}
            </div>
            <p
              className={`pt-1 text-sm ${
                isActive
                  ? isGagal
                    ? 'font-semibold text-red-600'
                    : 'font-semibold text-green-700'
                  : isDone
                  ? 'text-gray-600'
                  : 'text-gray-400'
              }`}
            >
              {step.label}
              {isActive && <span className="ml-2 text-xs font-normal text-gray-400">(sekarang)</span>}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Biaya Form ───────────────────────────────────────────────────────────────

interface BiayaForm {
  bbm: number
  upahDriver: number
  tol: number
  lainnya: number
  keteranganLainnya: string
}

const EMPTY_BIAYA: BiayaForm = { bbm: 0, upahDriver: 0, tol: 0, lainnya: 0, keteranganLainnya: '' }

interface BiayaPengirimanCardProps {
  pengirimanId: string
  biaya: {
    bbm: number
    upahDriver: number
    tol: number
    lainnya: number
    keteranganLainnya?: string
    total: number
  } | null
  editable: boolean
}

function BiayaPengirimanCard({ pengirimanId, biaya, editable }: BiayaPengirimanCardProps) {
  const [editMode, setEditMode] = useState(!biaya)
  const [form, setForm] = useState<BiayaForm>(
    biaya
      ? {
          bbm: biaya.bbm,
          upahDriver: biaya.upahDriver,
          tol: biaya.tol,
          lainnya: biaya.lainnya,
          keteranganLainnya: biaya.keteranganLainnya ?? '',
        }
      : EMPTY_BIAYA
  )

  const { mutateAsync, isPending } = useUpdateBiayaPengiriman()

  const total = form.bbm + form.upahDriver + form.tol + form.lainnya

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await mutateAsync({
      id: pengirimanId,
      biaya: {
        bbm: form.bbm,
        upahDriver: form.upahDriver,
        tol: form.tol,
        lainnya: form.lainnya,
        keteranganLainnya: form.keteranganLainnya || undefined,
      },
    })
    setEditMode(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Biaya Pengiriman</CardTitle>
          {biaya && editable && !editMode && (
            <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!editMode && biaya ? (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {[
                { label: 'BBM', value: biaya.bbm },
                { label: 'Upah Driver', value: biaya.upahDriver },
                { label: 'Tol', value: biaya.tol },
                {
                  label: biaya.keteranganLainnya ? `Lain-lain (${biaya.keteranganLainnya})` : 'Lain-lain',
                  value: biaya.lainnya,
                },
              ].map(({ label, value }) => (
                <tr key={label}>
                  <td className="py-2 text-gray-500">{label}</td>
                  <td className="py-2 text-right font-medium text-gray-900">{formatRupiah(value)}</td>
                </tr>
              ))}
              <tr className="border-t border-gray-200 bg-gray-50">
                <td className="py-2 font-semibold text-gray-900">Total</td>
                <td className="py-2 text-right text-lg font-bold text-green-700">{formatRupiah(biaya.total)}</td>
              </tr>
            </tbody>
          </table>
        ) : editMode ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <InputNominal
              label="BBM (Rp)"
              value={form.bbm}
              onChange={(v) => setForm((f) => ({ ...f, bbm: v }))}
            />
            <InputNominal
              label="Upah Driver (Rp)"
              value={form.upahDriver}
              onChange={(v) => setForm((f) => ({ ...f, upahDriver: v }))}
            />
            <InputNominal
              label="Tol (Rp)"
              value={form.tol}
              onChange={(v) => setForm((f) => ({ ...f, tol: v }))}
            />
            <InputNominal
              label="Lain-lain (Rp)"
              value={form.lainnya}
              onChange={(v) => setForm((f) => ({ ...f, lainnya: v }))}
            />
            <Input
              label="Keterangan Lain-lain (opsional)"
              value={form.keteranganLainnya}
              onChange={(e) => setForm((f) => ({ ...f, keteranganLainnya: e.target.value }))}
              placeholder="Mis: parkir, muat barang..."
            />
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
              <span className="text-sm font-medium text-gray-700">Total</span>
              <span className="text-base font-bold text-green-700">{formatRupiah(total)}</span>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              {biaya && (
                <Button type="button" variant="outline" onClick={() => setEditMode(false)} disabled={isPending}>
                  Batal
                </Button>
              )}
              <Button type="submit" loading={isPending}>
                Simpan Biaya
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-400 italic">Belum ada data biaya pengiriman.</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Bukti Pengiriman Card ────────────────────────────────────────────────────

function BuktiPengirimanCard({
  pengirimanId,
  buktiFoto,
  catatanHasil,
}: {
  pengirimanId: string
  buktiFoto?: string | null
  catatanHasil?: string | null
}) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const { mutate: uploadBukti, isPending } = useMutation({
    mutationFn: (file: File) => deliveriesApi.uploadBukti(pengirimanId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DELIVERIES_KEY, pengirimanId] })
    },
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadBukti(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bukti Pengiriman</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {buktiFoto ? (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={buktiFoto} alt="Bukti pengiriman" className="w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
            Belum ada foto bukti
          </div>
        )}

        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            loading={isPending}
          >
            <Upload className="h-4 w-4" />
            {buktiFoto ? 'Ganti Foto' : 'Unggah Foto Bukti'}
          </Button>
        </div>

        {catatanHasil && (
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <p className="mb-1 font-medium text-gray-500">Catatan Hasil</p>
            <p>{catatanHasil}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DetailPengirimanPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: pengiriman, isLoading } = useDelivery(id)
  const { mutateAsync: updateStatus, isPending: updatingStatus } = useUpdateDeliveryStatus()
  const { mutateAsync: submitChecklist, isPending: submittingChecklist } = useSubmitChecklistPengiriman()

  // Modals
  const [confirmMulaiOpen, setConfirmMulaiOpen] = useState(false)
  const [selesaiOpen, setSelesaiOpen] = useState(false)
  const [gagalOpen, setGagalOpen] = useState(false)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [catatanHasil, setCatatanHasil] = useState('')
  const [alasanGagal, setAlasanGagal] = useState('')
  const [alasanError, setAlasanError] = useState('')

  // Checklist state — per pesanan
  const [checklistMap, setChecklistMap] = useState<Record<string, StatusChecklistItem>>({})
  const [checklistCatatan, setChecklistCatatan] = useState<Record<string, string>>({})

  function initChecklist() {
    if (!pengiriman) return
    const map: Record<string, StatusChecklistItem> = {}
    const cat: Record<string, string> = {}
    pengiriman.pesananList.forEach((p) => {
      map[p.id] = pengiriman.checklistItems?.find((c) => c.pesananId === p.id)?.status ?? 'terkirim'
      cat[p.id] = pengiriman.checklistItems?.find((c) => c.pesananId === p.id)?.catatan ?? ''
    })
    setChecklistMap(map)
    setChecklistCatatan(cat)
    setChecklistOpen(true)
  }

  async function handleSubmitChecklist(e: React.FormEvent) {
    e.preventDefault()
    if (!pengiriman) return
    await submitChecklist({
      id,
      payload: {
        items: pengiriman.pesananList.map((p) => ({
          pesananId: p.id,
          status: checklistMap[p.id] ?? 'terkirim',
          catatan: checklistCatatan[p.id] || undefined,
        })),
      },
    })
    setChecklistOpen(false)
  }

  async function handleMulaiPengiriman() {
    await updateStatus({ id, status: 'Dalam Perjalanan' })
    setConfirmMulaiOpen(false)
  }

  async function handleSelesai(e: React.FormEvent) {
    e.preventDefault()
    await updateStatus({ id, status: 'Selesai', payload: { catatanHasil: catatanHasil || undefined } })
    setSelesaiOpen(false)
    setCatatanHasil('')
  }

  async function handleGagal(e: React.FormEvent) {
    e.preventDefault()
    if (!alasanGagal.trim()) {
      setAlasanError('Alasan gagal wajib diisi')
      return
    }
    await updateStatus({ id, status: 'Gagal', payload: { alasanGagal } })
    setGagalOpen(false)
    setAlasanGagal('')
    setAlasanError('')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!pengiriman) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-500">Data pengiriman tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/pengiriman')}>
          Kembali ke Daftar
        </Button>
      </div>
    )
  }

  const isEditable = pengiriman.status !== 'Selesai' && pengiriman.status !== 'Gagal'

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={pengiriman.nomorPengiriman}
        subtitle={`Driver: ${pengiriman.driverNama}`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={statusVariant(pengiriman.status)} className="text-sm px-3 py-1">
              {pengiriman.status}
            </Badge>

            <Button variant="outline" size="sm" onClick={() => printSuratJalanPengiriman(pengiriman)}>
              <Printer className="h-4 w-4" />
              Cetak Surat Jalan
            </Button>

            {pengiriman.status === 'Dijadwalkan' && (
              <Button onClick={() => setConfirmMulaiOpen(true)} loading={updatingStatus}>
                <Truck className="h-4 w-4" />
                Mulai Pengiriman
              </Button>
            )}

            {pengiriman.status === 'Dalam Perjalanan' && (
              <>
                <Button variant="outline" onClick={initChecklist}>
                  <ClipboardCheck className="h-4 w-4" />
                  Checklist
                </Button>
                <Button onClick={() => setSelesaiOpen(true)}>
                  <CheckCircle className="h-4 w-4" />
                  Tandai Selesai
                </Button>
                <Button variant="destructive" onClick={() => setGagalOpen(true)}>
                  <XCircle className="h-4 w-4" />
                  Laporkan Gagal
                </Button>
              </>
            )}

            {pengiriman.status === 'Selesai' && (
              <Button variant="outline" onClick={initChecklist}>
                <ClipboardCheck className="h-4 w-4" />
                {pengiriman.checklistItems?.length ? 'Edit Checklist' : 'Isi Checklist'}
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => router.push('/pengiriman')}>
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
              <CardTitle>Informasi Pengiriman</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-gray-500">Driver / Kurir</dt>
                  <dd className="mt-0.5 text-gray-900">{pengiriman.driverNama}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Tanggal Pengiriman</dt>
                  <dd className="mt-0.5 text-gray-900">{formatTanggal(pengiriman.tanggalPengiriman)}</dd>
                </div>
                {pengiriman.estimasiWaktu && (
                  <div>
                    <dt className="font-medium text-gray-500">Estimasi Waktu</dt>
                    <dd className="mt-0.5 text-gray-900">{pengiriman.estimasiWaktu}</dd>
                  </div>
                )}
                {pengiriman.catatan && (
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-gray-500">Catatan</dt>
                    <dd className="mt-0.5 text-gray-700">{pengiriman.catatan}</dd>
                  </div>
                )}
                {pengiriman.alasanGagal && (
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-red-500">Alasan Gagal</dt>
                    <dd className="mt-0.5 font-medium text-red-700">{pengiriman.alasanGagal}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Daftar Pesanan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Pesanan</CardTitle>
                <Badge variant="default">{pengiriman.pesananList.length} pesanan</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-100">
                {pengiriman.pesananList.map((p) => (
                  <div key={p.id} className="flex items-start gap-3 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{p.nomorPesanan}</p>
                      <p className="text-sm text-gray-600">{p.pelangganNama}</p>
                      <p className="text-xs text-gray-400">{p.alamat}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Biaya */}
          <BiayaPengirimanCard
            pengirimanId={id}
            biaya={pengiriman.biaya ?? null}
            editable={isEditable}
          />

          {/* Bukti */}
          <BuktiPengirimanCard
            pengirimanId={id}
            buktiFoto={pengiriman.buktiFoto}
            catatanHasil={pengiriman.catatanHasil}
          />

          {/* Rekap Checklist */}
          {pengiriman.checklistItems && pengiriman.checklistItems.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Rekap Checklist Pengiriman</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="success">
                      {pengiriman.checklistItems.filter((c) => c.status === 'terkirim').length} Terkirim
                    </Badge>
                    <Badge variant="danger">
                      {pengiriman.checklistItems.filter((c) => c.status === 'dikembalikan').length} Dikembalikan
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-gray-100">
                  {pengiriman.checklistItems.map((item) => (
                    <div key={item.pesananId} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{item.nomorPesanan}</p>
                        <p className="text-sm text-gray-500">{item.pelangganNama}</p>
                        {item.catatan && (
                          <p className="text-xs text-gray-400 mt-0.5">Catatan: {item.catatan}</p>
                        )}
                      </div>
                      <Badge variant={item.status === 'terkirim' ? 'success' : 'danger'}>
                        {item.status === 'terkirim' ? 'Terkirim' : 'Dikembalikan'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — Timeline */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Status Pengiriman</CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineStatus current={pengiriman.status} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Mulai */}
      <ConfirmModal
        open={confirmMulaiOpen}
        onClose={() => setConfirmMulaiOpen(false)}
        onConfirm={handleMulaiPengiriman}
        title="Mulai Pengiriman?"
        description={`Konfirmasi bahwa pengiriman ${pengiriman.nomorPengiriman} akan segera dimulai oleh driver ${pengiriman.driverNama}.`}
        confirmLabel="Ya, Mulai"
        cancelLabel="Batal"
        variant="default"
        loading={updatingStatus}
      />

      {/* Tandai Selesai Modal */}
      <Modal open={selesaiOpen} onClose={() => setSelesaiOpen(false)} title="Tandai Pengiriman Selesai" size="sm">
        <form onSubmit={handleSelesai} className="space-y-4">
          <Textarea
            label="Catatan Hasil (opsional)"
            value={catatanHasil}
            onChange={(e) => setCatatanHasil(e.target.value)}
            placeholder="Contoh: Semua barang diterima dengan baik..."
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setSelesaiOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={updatingStatus}>
              Tandai Selesai
            </Button>
          </div>
        </form>
      </Modal>

      {/* Checklist Modal */}
      <Modal open={checklistOpen} onClose={() => setChecklistOpen(false)} title="Checklist Pengiriman" size="md">
        <form onSubmit={handleSubmitChecklist} className="space-y-4">
          <p className="text-sm text-gray-500">Tandai status setiap pesanan setelah pengiriman.</p>
          <div className="space-y-3 rounded-lg border border-gray-200 p-3">
            {pengiriman.pesananList.map((p) => (
              <div key={p.id} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{p.nomorPesanan}</p>
                    <p className="text-xs text-gray-500">{p.pelangganNama} · {p.alamat}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {(['terkirim', 'dikembalikan'] as StatusChecklistItem[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setChecklistMap((m) => ({ ...m, [p.id]: s }))}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                          checklistMap[p.id] === s
                            ? s === 'terkirim'
                              ? 'bg-green-100 border-green-500 text-green-700'
                              : 'bg-red-100 border-red-500 text-red-700'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {s === 'terkirim' ? '✓ Terkirim' : '✗ Dikembalikan'}
                      </button>
                    ))}
                  </div>
                </div>
                {checklistMap[p.id] === 'dikembalikan' && (
                  <input
                    type="text"
                    placeholder="Alasan dikembalikan (opsional)"
                    value={checklistCatatan[p.id] ?? ''}
                    onChange={(e) => setChecklistCatatan((c) => ({ ...c, [p.id]: e.target.value }))}
                    className="h-8 w-full rounded-lg border border-gray-300 px-3 text-xs text-gray-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setChecklistOpen(false)}>Batal</Button>
            <Button type="submit" loading={submittingChecklist}>Simpan Checklist</Button>
          </div>
        </form>
      </Modal>

      {/* Laporkan Gagal Modal */}
      <Modal open={gagalOpen} onClose={() => setGagalOpen(false)} title="Laporkan Pengiriman Gagal" size="sm">
        <form onSubmit={handleGagal} className="space-y-4">
          <Textarea
            label="Alasan Gagal"
            required
            value={alasanGagal}
            onChange={(e) => {
              setAlasanGagal(e.target.value)
              if (alasanError) setAlasanError('')
            }}
            error={alasanError}
            placeholder="Jelaskan alasan pengiriman gagal..."
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setGagalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="destructive" loading={updatingStatus}>
              Laporkan Gagal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
