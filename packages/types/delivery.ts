export type StatusPengiriman = 'Dijadwalkan' | 'Dalam Perjalanan' | 'Selesai' | 'Gagal'
export type StatusChecklistItem = 'terkirim' | 'dikembalikan'

export interface BiayaPengiriman {
  bbm: number
  upahDriver: number
  tol: number
  lainnya: number
  keteranganLainnya?: string
  total: number
}

export interface ChecklistPesanan {
  pesananId: string
  nomorPesanan: string
  pelangganNama: string
  alamat: string
  status: StatusChecklistItem
  catatan?: string | null
}

export interface PesananListItem {
  id: string
  nomorPesanan: string
  pelangganNama: string
  alamat: string
  items?: { produkNama: string; produkSku: string; qty: number; satuan: string }[]
}

export interface Pengiriman {
  id: string
  nomorPengiriman: string
  pesananIds: string[]
  pesananList: PesananListItem[]
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
  checklistItems?: ChecklistPesanan[] | null
  checklistSubmittedAt?: string | null
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

export interface SubmitChecklistPengirimanDto {
  items: { pesananId: string; status: StatusChecklistItem; catatan?: string }[]
}
