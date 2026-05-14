'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, ArrowLeft, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared'
import { InputNominal } from '@/components/ui/input-nominal'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Combobox,
  Input,
  Textarea,
  Select,
} from '@/components/ui'
import { useCreateOrder } from '@/hooks/use-orders'
import { useProducts } from '@/hooks/use-products'
import { usePelangganVIP } from '@/hooks/use-customers'
import { formatRupiah } from '@/lib/utils'
import type { MetodePembayaran, MetodePengiriman } from '@/types'
import type { Produk } from '@/types'
import type { PelangganVIP } from '@/types'

interface ItemBaris {
  id: string
  produkId: string
  produkNama: string
  produkSku: string
  stok: number
  satuan: string
  qty: number
  hargaSatuan: number
  subtotal: number
}

const METODE_PEMBAYARAN_OPTIONS: { value: MetodePembayaran; label: string }[] = [
  { value: 'Tunai', label: 'Tunai' },
  { value: 'Transfer Bank', label: 'Transfer Bank' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'Kartu Debit', label: 'Kartu Debit' },
  { value: 'Kredit VIP', label: 'Kredit VIP' },
]

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}


export default function PesananBaruPage() {
  const router = useRouter()
  const { mutateAsync: createOrder, isPending } = useCreateOrder()

  // Pelanggan
  const [jenisPelanggan, setJenisPelanggan] = useState<'umum' | 'vip'>('umum')
  const [pelangganUmumNama, setPelangganUmumNama] = useState('')
  const [pelangganUmumTelepon, setPelangganUmumTelepon] = useState('')
  const [pelangganVipId, setPelangganVipId] = useState('')

  // Items
  const [items, setItems] = useState<ItemBaris[]>([])

  // Keuangan
  const [diskon, setDiskon] = useState(0)

  // Pengiriman
  const [metodePengiriman, setMetodePengiriman] = useState<MetodePengiriman>('ambil_sendiri')
  const [alamatPengiriman, setAlamatPengiriman] = useState('')

  // Pembayaran
  const [metodePembayaran, setMetodePembayaran] = useState<MetodePembayaran>('Tunai')

  // Catatan
  const [catatan, setCatatan] = useState('')

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Data
  const { data: produksData } = useProducts({ page: 1, limit: 200 })
  const { data: vipData } = usePelangganVIP({ page: 1, limit: 200 })

  const produkList: Produk[] = useMemo(() => produksData?.data ?? [], [produksData])
  const vipList: PelangganVIP[] = useMemo(() => [
    // mock — hapus setelah review
    {
      id: '__mock__',
      namaLengkap: 'Budi Santoso (Demo)',
      nomorTelepon: '081234567890',
      alamat: 'Jl. Merdeka No. 1',
      creditLimit: 5_000_000,
      kreditTerpakai: 3_200_000,
      sisaKredit: 1_800_000,
      statusKredit: 'mendekati_limit' as const,
      status: 'aktif' as const,
      catatan: null,
      createdAt: '',
      updatedAt: '',
    },
    ...(vipData?.data ?? []),
  ], [vipData])

  const pelangganVipSelected = useMemo(
    () => vipList.find((v) => v.id === pelangganVipId) ?? null,
    [vipList, pelangganVipId]
  )

  // Kalkulasi
  const subtotalKeseluruhan = useMemo(
    () => items.reduce((sum, item) => sum + item.subtotal, 0),
    [items]
  )
  const total = Math.max(0, subtotalKeseluruhan - diskon)

  const isVipSuspend = jenisPelanggan === 'vip' && pelangganVipSelected?.status === 'suspend'
  const kreditTidakCukup =
    jenisPelanggan === 'vip' &&
    metodePembayaran === 'Kredit VIP' &&
    pelangganVipSelected !== null &&
    total > pelangganVipSelected.sisaKredit
  const sisaKreditSetelahPesanan =
    metodePembayaran === 'Kredit VIP' && pelangganVipSelected
      ? pelangganVipSelected.sisaKredit - total
      : null

  // Tambah baris item kosong
  const handleTambahItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: generateId(),
        produkId: '',
        produkNama: '',
        produkSku: '',
        stok: 0,
        satuan: '',
        qty: 1,
        hargaSatuan: 0,
        subtotal: 0,
      },
    ])
  }

  // Hapus item
  const handleHapusItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Update produk pada baris
  const handlePilihProduk = (itemId: string, produkId: string) => {
    const produk = produkList.find((p) => p.id === produkId)
    if (!produk) return
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              produkId: produk.id,
              produkNama: produk.nama,
              produkSku: produk.sku,
              stok: produk.stok,
              satuan: produk.satuan,
              hargaSatuan: produk.hargaJual,
              subtotal: item.qty * produk.hargaJual,
            }
          : item
      )
    )
  }

  // Update qty pada baris
  const handleUbahQty = (itemId: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const safeQty = Math.max(1, Math.min(qty, item.stok || qty))
        return { ...item, qty: safeQty, subtotal: safeQty * item.hargaSatuan }
      })
    )
  }

  // Update harga satuan pada baris
  const handleUbahHarga = (itemId: string, harga: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, hargaSatuan: harga, subtotal: item.qty * harga }
          : item
      )
    )
  }

  // Validasi
  const validate = (): boolean => {
    const errs: Record<string, string> = {}

    if (jenisPelanggan === 'umum') {
      if (!pelangganUmumNama.trim()) errs.pelangganNama = 'Nama pelanggan wajib diisi'
    } else {
      if (!pelangganVipId) errs.pelangganVip = 'Pilih pelanggan VIP'
      else if (isVipSuspend) errs.pelangganVip = 'Pelanggan VIP ini sedang suspend'
    }

    if (items.length === 0) {
      errs.items = 'Minimal 1 item harus ditambahkan'
    }

    const itemTidakLengkap = items.some((item) => !item.produkId || item.qty < 1)
    if (itemTidakLengkap) errs.items = 'Semua item harus memiliki produk dan qty valid'

    if (metodePengiriman === 'dikirim' && !alamatPengiriman.trim()) {
      errs.alamatPengiriman = 'Alamat pengiriman wajib diisi'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const pelangganNama =
      jenisPelanggan === 'vip' ? (pelangganVipSelected?.namaLengkap ?? '') : pelangganUmumNama

    await createOrder({
      pelangganId: jenisPelanggan === 'vip' ? pelangganVipId : undefined,
      pelangganNama,
      pelangganTelepon:
        jenisPelanggan === 'vip'
          ? pelangganVipSelected?.nomorTelepon
          : pelangganUmumTelepon || undefined,
      items: items.map((item) => ({
        produkId: item.produkId,
        qty: item.qty,
        hargaSatuan: item.hargaSatuan,
      })),
      diskon: diskon || undefined,
      metodePembayaran,
      metodePengiriman,
      alamatPengiriman: metodePengiriman === 'dikirim' ? alamatPengiriman : undefined,
      catatan: catatan || undefined,
      sumber: 'manual',
    })

    router.push('/pesanan')
  }

  const metodePembayaranOptions = METODE_PEMBAYARAN_OPTIONS.filter(
    (opt) => opt.value !== 'Kredit VIP' || (jenisPelanggan === 'vip' && !isVipSuspend)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Pesanan Baru"
        subtitle="Transaksi VIP melalui telepon atau WhatsApp"
        actions={
          <Button variant="outline" onClick={() => router.push('/pesanan')}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seksi Pelanggan */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pelanggan</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Toggle Jenis Pelanggan */}
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setJenisPelanggan('umum')
                  if (metodePembayaran === 'Kredit VIP') setMetodePembayaran('Tunai')
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  jenisPelanggan === 'umum'
                    ? 'bg-green-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Pelanggan Umum
              </button>
              <button
                type="button"
                onClick={() => setJenisPelanggan('vip')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  jenisPelanggan === 'vip'
                    ? 'bg-green-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Pelanggan VIP
              </button>
            </div>

            {jenisPelanggan === 'umum' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nama Pelanggan"
                  required
                  placeholder="Masukkan nama pelanggan"
                  value={pelangganUmumNama}
                  onChange={(e) => setPelangganUmumNama(e.target.value)}
                  error={errors.pelangganNama}
                />
                <Input
                  label="Nomor Telepon"
                  placeholder="Contoh: 08123456789"
                  value={pelangganUmumTelepon}
                  onChange={(e) => setPelangganUmumTelepon(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <Combobox<PelangganVIP>
                  label="Pelanggan VIP"
                  required
                  options={vipList}
                  value={pelangganVipId}
                  onChange={(id) => {
                    setPelangganVipId(id)
                    if (metodePembayaran === 'Kredit VIP') setMetodePembayaran('Tunai')
                  }}
                  getOptionValue={(v) => v.id}
                  getOptionLabel={(v) => v.namaLengkap}
                  filterFn={(v, q) =>
                    v.namaLengkap.toLowerCase().includes(q.toLowerCase()) ||
                    v.nomorTelepon.includes(q)
                  }
                  renderOption={(v) => (
                    <div className="flex items-center justify-between">
                      <div>
                        <span>{v.namaLengkap}</span>
                        <span className="ml-2 text-xs text-gray-500">{v.nomorTelepon}</span>
                        {v.status === 'suspend' && (
                          <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">Suspend</span>
                        )}
                      </div>
                      <span className="ml-4 shrink-0 text-xs text-gray-500">
                        Sisa {formatRupiah(v.sisaKredit)}
                      </span>
                    </div>
                  )}
                  placeholder="Cari nama atau nomor telepon..."
                  error={errors.pelangganVip}
                />
                {pelangganVipSelected && (
                  <div className={`rounded-lg border p-3 text-sm ${isVipSuspend ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{pelangganVipSelected.namaLengkap}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isVipSuspend ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {isVipSuspend ? 'Suspend' : 'Aktif'}
                      </span>
                    </div>
                    <p className="text-gray-600">{pelangganVipSelected.nomorTelepon}</p>
                    {isVipSuspend ? (
                      <p className="mt-2 font-medium text-red-700">Pelanggan ini sedang suspend dan tidak dapat melakukan pembelian kredit.</p>
                    ) : (
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-md bg-white/70 px-2 py-1">
                          <p className="text-[10px] uppercase tracking-wide text-gray-500">Limit</p>
                          <p className="font-semibold text-gray-900">{formatRupiah(pelangganVipSelected.creditLimit)}</p>
                        </div>
                        <div className="rounded-md bg-white/70 px-2 py-1">
                          <p className="text-[10px] uppercase tracking-wide text-gray-500">Terpakai</p>
                          <p className="font-semibold text-red-600">{formatRupiah(pelangganVipSelected.kreditTerpakai)}</p>
                        </div>
                        <div className="rounded-md bg-white/70 px-2 py-1">
                          <p className="text-[10px] uppercase tracking-wide text-gray-500">Sisa</p>
                          <p className="font-semibold text-green-700">{formatRupiah(pelangganVipSelected.sisaKredit)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seksi Item Pesanan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Item Pesanan</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleTambahItem}>
                <Plus className="h-4 w-4" />
                Tambah Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {errors.items && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errors.items}
              </div>
            )}

            {items.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-200 py-10 text-center">
                <p className="text-sm text-gray-500">Belum ada item. Klik &quot;Tambah Item&quot; untuk mulai.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Header tabel */}
                <div className="hidden grid-cols-12 gap-2 text-xs font-medium uppercase text-gray-500 sm:grid">
                  <div className="col-span-4">Produk</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-3">Harga Satuan</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                  <div className="col-span-1" />
                </div>

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 items-start gap-2 rounded-lg border border-gray-100 p-3 sm:border-0 sm:p-0"
                  >
                    {/* Pilih Produk */}
                    <div className="col-span-12 sm:col-span-4">
                      <Combobox<Produk>
                        options={produkList.filter((p) => p.statusAktif && p.stok > 0)}
                        value={item.produkId}
                        onChange={(id) => handlePilihProduk(item.id, id)}
                        getOptionValue={(p) => p.id}
                        getOptionLabel={(p) => p.nama}
                        filterFn={(p, q) =>
                          p.nama.toLowerCase().includes(q.toLowerCase()) ||
                          p.sku.toLowerCase().includes(q.toLowerCase())
                        }
                        renderOption={(p) => (
                          <div className="flex items-center justify-between">
                            <div>
                              <span>{p.nama}</span>
                              <span className="ml-2 text-xs text-gray-500">{p.sku}</span>
                            </div>
                            <span className="ml-4 shrink-0 text-xs text-gray-500">
                              Stok {p.stok} {p.satuan}
                            </span>
                          </div>
                        )}
                        placeholder="Cari produk..."
                      />
                    </div>

                    {/* Qty */}
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min={1}
                        max={item.stok || undefined}
                        value={item.qty}
                        onChange={(e) => handleUbahQty(item.id, Number(e.target.value))}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="Qty"
                      />
                      {item.satuan && (
                        <p className="mt-0.5 text-center text-xs text-gray-500">{item.satuan}</p>
                      )}
                    </div>

                    {/* Harga Satuan */}
                    <div className="col-span-5 sm:col-span-3">
                      <InputNominal
                        value={item.hargaSatuan}
                        onChange={(v) => handleUbahHarga(item.id, v)}
                        placeholder="Harga"
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="col-span-2 flex items-center justify-end sm:col-span-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>

                    {/* Hapus */}
                    <div className="col-span-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleHapusItem(item.id)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seksi Pengiriman & Pembayaran */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pengiriman */}
          <Card>
            <CardHeader>
              <CardTitle>Pengiriman</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Metode Pengiriman</label>
                  <div className="flex gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="metodePengiriman"
                        value="ambil_sendiri"
                        checked={metodePengiriman === 'ambil_sendiri'}
                        onChange={() => setMetodePengiriman('ambil_sendiri')}
                        className="h-4 w-4 accent-green-600"
                      />
                      <span>Ambil Sendiri</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="metodePengiriman"
                        value="dikirim"
                        checked={metodePengiriman === 'dikirim'}
                        onChange={() => setMetodePengiriman('dikirim')}
                        className="h-4 w-4 accent-green-600"
                      />
                      <span>Dikirim</span>
                    </label>
                  </div>
                </div>

                {metodePengiriman === 'dikirim' && (
                  <Textarea
                    label="Alamat Pengiriman"
                    required
                    placeholder="Masukkan alamat lengkap pengiriman..."
                    value={alamatPengiriman}
                    onChange={(e) => setAlamatPengiriman(e.target.value)}
                    error={errors.alamatPengiriman}
                    rows={3}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pembayaran */}
          <Card>
            <CardHeader>
              <CardTitle>Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                label="Metode Pembayaran"
                value={metodePembayaran}
                onChange={(e) => setMetodePembayaran(e.target.value as MetodePembayaran)}
                options={metodePembayaranOptions}
                required
              />
            </CardContent>
          </Card>
        </div>

        {/* Catatan */}
        <Card>
          <CardHeader>
            <CardTitle>Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Catatan tambahan untuk pesanan ini (opsional)..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Ringkasan */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatRupiah(subtotalKeseluruhan)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Diskon (Rp)</span>
                <div className="w-40">
                  <InputNominal
                    value={diskon}
                    onChange={(v) => setDiskon(Math.min(v, subtotalKeseluruhan))}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-green-700">{formatRupiah(total)}</span>
                </div>
              </div>

              {/* Info Kredit VIP */}
              {jenisPelanggan === 'vip' &&
                metodePembayaran === 'Kredit VIP' &&
                pelangganVipSelected && (
                  <div className="mt-3 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Sisa Kredit Saat Ini</span>
                      <span className="font-medium text-gray-900">{formatRupiah(pelangganVipSelected.sisaKredit)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pesanan Ini</span>
                      <span className="font-medium text-red-600">- {formatRupiah(total)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                      <span className="font-medium text-gray-700">Sisa Kredit Setelah Pesanan</span>
                      <span className={`font-bold ${sisaKreditSetelahPesanan !== null && sisaKreditSetelahPesanan < 0 ? 'text-red-600' : 'text-green-700'}`}>
                        {sisaKreditSetelahPesanan !== null ? formatRupiah(Math.max(0, sisaKreditSetelahPesanan)) : '—'}
                      </span>
                    </div>
                    {kreditTidakCukup && (
                      <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>Total pesanan melebihi sisa kredit. Kurangi jumlah pesanan atau pilih metode pembayaran lain.</span>
                      </div>
                    )}
                  </div>
                )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/pesanan')}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                loading={isPending}
                disabled={isPending || kreditTidakCukup}
              >
                Buat Pesanan
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
