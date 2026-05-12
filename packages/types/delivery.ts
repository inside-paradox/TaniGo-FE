export type StatusPengiriman = 'Dijadwalkan' | 'Dalam Perjalanan' | 'Selesai' | 'Gagal'

export interface BiayaPengiriman {
  bbm: number
  upahDriver: number
  tol: number
  lainnya: number
  keteranganLainnya?: string
  total: number
}

export interface Pengiriman {
  id: string
  nomorPengiriman: string
  pesananIds: string[]
  pesananList: { id: string; nomorPesanan: string; pelangganNama: string; alamat: string }[]
  driverId?: string | null
  driverNama: string
  tanggalPengiriman: string
  estimasiWaktu?: string | null
  status: StatusPengiriman
  biaya?: BiayaPengiriman | null
  buktiFoto?: string | null
  catatanHasil?: string | null
  alasanGagal?: string | null
  catatan?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePengirimanDto {
  pesananIds: string[]
  driverId?: string
  driverNama: string
  tanggalPengiriman: string
  estimasiWaktu?: string
  catatan?: string
}
