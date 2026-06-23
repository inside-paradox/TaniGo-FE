export interface CabangInventory {
  id: string
  cabangId: string
  cabangNama?: string
  produkId: string
  produkNama: string
  produkSku: string
  satuan: string
  stok: number
  /** Harga jual per unit di cabang ini (dikirim API; opsional di tipe). */
  hargaJual?: number
  statusStok?: string
  updatedAt: string
}

export type JenisPergerakan = 'masuk' | 'keluar' | 'penyesuaian'

export type AlasanPenyesuaian = 'Koreksi' | 'Rusak' | 'Hilang' | 'Sampel' | 'Lainnya'

export interface PergerakanStok {
  id: string
  produkId: string
  produkNama: string
  produkSku: string
  jenis: JenisPergerakan
  jumlah: number
  stokSebelum: number
  stokSesudah: number
  referensi?: string | null
  userId: string
  userNama: string
  catatan?: string | null
  alasan?: AlasanPenyesuaian | null
  createdAt: string
}

export interface PenyesuaianStokDto {
  produkId: string
  jumlah: number
  alasan: AlasanPenyesuaian
  catatan?: string
}

export interface DashboardStok {
  totalProduk: number
  produkMenipis: number
  produkHabis: number
  produkKedaluwarsa30Hari: number
}

export interface DashboardToko {
  pengirimanHariIni: number
  pesananBaru: number
  tagihanJatuhTempo: number
  transferStokPending: number
}

export interface DashboardGudang {
  poMenunggu: number
  transferMasuk: number
  siapDikirim: number
}

export interface PerformaToko {
  cabangId: string
  nama: string
  pendapatan: number
  transaksi: number
  pertumbuhan: number
}

export interface DashboardSuperadmin {
  performaToko: PerformaToko[]
}

export interface Supplier {
  id: string
  nama: string
  kontak: string
  alamat: string
  produkDisuplai: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateSupplierDto {
  nama: string
  kontak: string
  alamat: string
}
