'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Clock, CheckCircle, Printer } from 'lucide-react'
import { formatRupiah, formatTanggalWaktu } from '@tanigo/utils'
import { bukaShift, tutupShift, fetchActiveShift } from '@/lib/api/shifts'
import { useShiftStore } from '@/store/shiftStore'
import { useAuthStore } from '@/store/authStore'
import { bukaShiftSchema, tutupShiftSchema, type BukaShiftFormValues, type TutupShiftFormValues } from '@/lib/validations/payment'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InputNominal } from '@/components/ui/input-nominal'

function formatRupiahInput(value: string): number {
  return parseFloat(value.replace(/\D/g, '')) || 0
}

export default function ShiftPage() {
  const { activeShift, setShift, clearShift } = useShiftStore()
  const user = useAuthStore((s) => s.user)

  const { refetch } = useQuery({
    queryKey: ['active-shift'],
    queryFn: async () => {
      const shift = await fetchActiveShift()
      if (shift) setShift(shift)
      return shift
    },
  })

  const bukaForm = useForm<BukaShiftFormValues>({
    resolver: zodResolver(bukaShiftSchema),
    defaultValues: { saldoAwal: 0 },
  })

  const tutupForm = useForm<TutupShiftFormValues>({
    resolver: zodResolver(tutupShiftSchema),
    defaultValues: { saldoAkhir: 0 },
  })

  const { mutate: doBukaShift, isPending: bukaLoading } = useMutation({
    mutationFn: (dto: BukaShiftFormValues) => bukaShift(dto),
    onSuccess: (shift) => {
      setShift(shift)
      toast.success('Shift berhasil dibuka')
      refetch()
    },
    onError: () => toast.error('Gagal membuka shift'),
  })

  const { mutate: doTutupShift, isPending: tutupLoading } = useMutation({
    mutationFn: (dto: TutupShiftFormValues) => tutupShift(dto),
    onSuccess: (shift) => {
      clearShift()
      toast.success('Shift berhasil ditutup')
    },
    onError: () => toast.error('Gagal menutup shift'),
  })

  if (!activeShift) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
              <Clock className="text-green-600" size={28} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Buka Shift</h1>
            <p className="mt-1 text-sm text-gray-500">Masukkan saldo awal kas untuk memulai shift</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <form
              onSubmit={bukaForm.handleSubmit((v) => doBukaShift(v))}
              className="space-y-4"
            >
              <Controller
                name="saldoAwal"
                control={bukaForm.control}
                render={({ field }) => (
                  <InputNominal
                    label="Saldo Awal Kas"
                    value={field.value ?? 0}
                    onChange={field.onChange}
                    error={bukaForm.formState.errors.saldoAwal?.message}
                  />
                )}
              />

              {user && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="text-gray-500">Kasir: <span className="font-medium text-gray-900">{user.nama}</span></p>
                  <p className="text-gray-500">Cabang: <span className="font-medium text-gray-900">{user.cabang}</span></p>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" loading={bukaLoading}>
                Buka Shift
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const saldoAkhir = tutupForm.watch('saldoAkhir') ?? 0
  const expectedCash = (activeShift.saldoAwal ?? 0) + (activeShift.totalPenjualanTunai ?? 0) - (activeShift.totalRetur ?? 0)
  const selisih = saldoAkhir - expectedCash

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Manajemen Shift</h1>
        <Badge variant="success">Shift Aktif</Badge>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 font-semibold text-gray-700">Info Shift Aktif</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400">Kasir</p>
            <p className="font-medium">{activeShift.kasirNama}</p>
          </div>
          <div>
            <p className="text-gray-400">Mulai</p>
            <p className="font-medium">{formatTanggalWaktu(activeShift.waktuBuka)}</p>
          </div>
          <div>
            <p className="text-gray-400">Saldo Awal</p>
            <p className="font-medium">{formatRupiah(activeShift.saldoAwal ?? 0)}</p>
          </div>
          <div>
            <p className="text-gray-400">Cabang</p>
            <p className="font-medium">{activeShift.cabang}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 font-semibold text-gray-700">Ringkasan Penjualan</h2>
        <div className="space-y-2 text-sm">
          {[
            { label: 'Total Transaksi', value: `${activeShift.totalTransaksi ?? 0} transaksi` },
            { label: 'Total Penjualan', value: formatRupiah(activeShift.totalPenjualan ?? 0) },
            { label: 'Tunai', value: formatRupiah(activeShift.totalPenjualanTunai ?? 0) },
            { label: 'QRIS', value: formatRupiah(activeShift.totalPenjualanQRIS ?? 0) },
            { label: 'Transfer Bank', value: formatRupiah(activeShift.totalPenjualanTransfer ?? 0) },
            { label: 'Total Diskon', value: `-${formatRupiah(activeShift.totalDiskon ?? 0)}` },
            { label: 'Total Retur', value: `-${formatRupiah(activeShift.totalRetur ?? 0)}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 font-semibold text-gray-700">Tutup Shift</h2>
        <form onSubmit={tutupForm.handleSubmit((v) => doTutupShift(v))} className="space-y-4">
          <Controller
            name="saldoAkhir"
            control={tutupForm.control}
            render={({ field }) => (
              <InputNominal
                label="Saldo Akhir Kas Aktual"
                value={field.value ?? 0}
                onChange={field.onChange}
              />
            )}
          />

          {saldoAkhir > 0 && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
              <div className="flex justify-between text-gray-500">
                <span>Ekspektasi kas</span>
                <span>{formatRupiah(expectedCash)}</span>
              </div>
              <div className={`flex justify-between font-semibold ${selisih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>Selisih</span>
                <span>{selisih >= 0 ? '+' : ''}{formatRupiah(selisih)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" type="button" onClick={() => window.print()} className="flex-shrink-0">
              <Printer size={16} />
              Cetak Laporan
            </Button>
            <Button
              type="submit"
              variant="danger"
              className="flex-1"
              loading={tutupLoading}
            >
              <CheckCircle size={16} />
              Tutup Shift
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
