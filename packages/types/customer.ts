export type StatusKreditPelanggan = 'aman' | 'mendekati_limit' | 'melebihi_limit'
export type StatusPelangganVIP = 'aktif' | 'suspend'
export type StatusTagihan = 'Belum Bayar' | 'Sebagian' | 'Lunas' | 'Jatuh Tempo'

export interface TagihanTerdekat {
  /** Jumlah tagihan aktif (belum lunas) */
  jumlah: number
  /** Total sisa tagihan aktif */
  nominal: number
  /** Due date tagihan paling dekat */
  dueDate: string | null
  /** Hari menuju jatuh tempo; negatif = sudah lewat (overdue) */
  hariJatuhTempo: number | null
}

export interface PelangganVIP {
  id: string
  namaLengkap: string
  nomorTelepon: string
  alamat: string
  creditLimit: number
  /** Actual field from backend (may be absent in legacy mock data) */
  creditUsed?: number
  /** Legacy field — keep for mock data compatibility */
  kreditTerpakai: number
  sisaKredit: number
  statusKredit: StatusKreditPelanggan
  status: StatusPelangganVIP
  catatan?: string | null
  /** Tagihan aktif paling urgent — null jika tidak ada hutang */
  tagihanTerdekat?: TagihanTerdekat | null
  createdAt: string
  updatedAt: string
}

export interface RingkasanPiutang {
  totalPiutang: number
  mendekatiJatuhTempo: { count: number; nominal: number }
  sudahJatuhTempo: { count: number; nominal: number }
}

export interface TagihanVIP {
  id: string
  pelangganId: string
  sisaTagihan: number
  /** New backend field */
  pesananId?: string
  /** New backend field */
  nomorPesanan?: string
  /** New backend field */
  nomorTagihan?: string
  /** New backend field */
  nominal?: number
  /** New backend field */
  nominalTerbayar?: number
  /** New backend field */
  tanggalJatuhTempo?: string | null
  /** New backend field */
  statusTagihan?: StatusTagihan
  /** New backend field */
  createdAt?: string
  /** Legacy field */
  nomorOrder?: string
  /** Legacy field */
  jumlahDibayar: number
  /** Legacy field */
  total?: number
  /** Legacy field */
  dueDate?: string | null
  /** Legacy field */
  status: StatusTagihan
  /** Legacy field */
  tanggal?: string
}

export interface CatatPembayaranDto {
  customerId: string
  invoiceId: string
  nominal: number
  tanggal: string
  metode: string
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
