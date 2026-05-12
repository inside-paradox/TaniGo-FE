export type StatusKreditPelanggan = 'aman' | 'mendekati_limit' | 'melebihi_limit'
export type StatusPelangganVIP = 'aktif' | 'suspend'
export type StatusTagihan = 'Belum Bayar' | 'Sebagian' | 'Lunas' | 'Jatuh Tempo'

export interface PelangganVIP {
  id: string
  namaLengkap: string
  nomorTelepon: string
  alamat: string
  creditLimit: number
  kreditTerpakai: number
  sisaKredit: number
  statusKredit: StatusKreditPelanggan
  status: StatusPelangganVIP
  catatan?: string | null
  createdAt: string
  updatedAt: string
}

export interface TagihanVIP {
  id: string
  pelangganId: string
  nomorOrder: string
  tanggal: string
  total: number
  jumlahDibayar: number
  sisaTagihan: number
  dueDate?: string | null
  status: StatusTagihan
}

export interface CatatPembayaranDto {
  tagihanId: string
  nominal: number
  tanggal: string
  metodePembayaran: string
  catatan?: string
}

export interface CreatePelangganVIPDto {
  namaLengkap: string
  nomorTelepon: string
  alamat: string
  creditLimit: number
  catatan?: string
  status?: StatusPelangganVIP
}
