'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Package } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useCreateDelivery } from '@/hooks/use-deliveries'
import { useOrders } from '@/hooks/use-orders'
import type { Pesanan } from '@/types'

// ─── Inner form (uses useSearchParams) ───────────────────────────────────────

function BuatPengirimanForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('pesananId')

  // Pesanan data
  const { data: pesananData, isLoading: loadingPesanan } = useOrders({
    page: 1,
    limit: 100,
    status: 'Siap',
  })
  const pesananList: Pesanan[] = pesananData?.data ?? []

  // Form state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    preselectedId ? new Set([preselectedId]) : new Set()
  )
  const [driverNama, setDriverNama] = useState('')
  const [driverId, setDriverId] = useState('')
  const [tanggalPengiriman, setTanggalPengiriman] = useState('')
  const [estimasiWaktu, setEstimasiWaktu] = useState('')
  const [catatan, setCatatan] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const { mutateAsync, isPending } = useCreateDelivery()

  // Pre-check preselectedId once pesanan loaded
  useEffect(() => {
    if (preselectedId && pesananList.length > 0) {
      const exists = pesananList.some((p) => p.id === preselectedId)
      if (exists) {
        setSelectedIds((prev) => new Set([...prev, preselectedId]))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pesananList.length])

  function togglePesanan(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    if (errors.pesanan) setErrors((e) => ({ ...e, pesanan: '' }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (selectedIds.size === 0) e.pesanan = 'Pilih minimal 1 pesanan'
    if (!driverNama.trim()) e.driverNama = 'Nama driver/kurir wajib diisi'
    if (!tanggalPengiriman) e.tanggalPengiriman = 'Tanggal pengiriman wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await mutateAsync({
      pesananIds: [...selectedIds],
      driverNama: driverNama.trim(),
      driverId: driverId.trim() || undefined,
      tanggalPengiriman,
      estimasiWaktu: estimasiWaktu || undefined,
      catatan: catatan.trim() || undefined,
    })
    router.push('/pengiriman')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Pilih Pesanan ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pilih Pesanan</CardTitle>
            {selectedIds.size > 0 && (
              <Badge variant="success">{selectedIds.size} dipilih</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingPesanan ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : pesananList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Package className="mb-2 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-400">Tidak ada pesanan dengan status &quot;Siap Kirim&quot;</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pesananList.map((p) => {
                const checked = selectedIds.has(p.id)
                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      checked
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePesanan(p.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{p.nomorPesanan}</p>
                      <p className="text-sm text-gray-600">{p.pelangganNama}</p>
                      {p.alamatPengiriman && (
                        <p className="truncate text-xs text-gray-400">{p.alamatPengiriman}</p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
          {errors.pesanan && (
            <p className="mt-2 text-xs text-red-500">{errors.pesanan}</p>
          )}
        </CardContent>
      </Card>

      {/* ── Driver ── */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Driver / Kurir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nama Driver / Kurir"
            required
            value={driverNama}
            onChange={(e) => {
              setDriverNama(e.target.value)
              if (errors.driverNama) setErrors((err) => ({ ...err, driverNama: '' }))
            }}
            error={errors.driverNama}
            placeholder="Masukkan nama driver atau kurir"
          />
          <Input
            label="ID Driver (opsional)"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            placeholder="Opsional, untuk driver internal"
            helperText="Opsional — isi jika driver terdaftar di sistem internal"
          />
        </CardContent>
      </Card>

      {/* ── Jadwal ── */}
      <Card>
        <CardHeader>
          <CardTitle>Jadwal Pengiriman</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Tanggal Pengiriman"
            type="date"
            required
            value={tanggalPengiriman}
            onChange={(e) => {
              setTanggalPengiriman(e.target.value)
              if (errors.tanggalPengiriman) setErrors((err) => ({ ...err, tanggalPengiriman: '' }))
            }}
            error={errors.tanggalPengiriman}
          />
          <Input
            label="Estimasi Waktu (opsional)"
            type="time"
            value={estimasiWaktu}
            onChange={(e) => setEstimasiWaktu(e.target.value)}
            helperText="Estimasi jam keberangkatan atau tiba"
          />
        </CardContent>
      </Card>

      {/* ── Catatan ── */}
      <Card>
        <CardHeader>
          <CardTitle>Catatan Tambahan</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            label="Catatan (opsional)"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Instruksi khusus atau informasi tambahan untuk driver..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* ── Actions ── */}
      <div className="flex justify-end gap-3 pb-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/pengiriman')}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button type="submit" loading={isPending}>
          Buat Jadwal Pengiriman
        </Button>
      </div>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuatPengirimanPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Jadwal Pengiriman"
        subtitle="Pilih pesanan dan atur jadwal pengiriman baru"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/pengiriman')}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        }
      />

      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        }
      >
        <BuatPengirimanForm />
      </Suspense>
    </div>
  )
}
