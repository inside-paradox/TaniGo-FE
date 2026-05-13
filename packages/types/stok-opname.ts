export type StatusStokOpname = 'Draft' | 'Diajukan' | 'Disetujui'

export interface StokOpnameItem {
  id: string
  produkId: string
  produkNama: string
  produkSku: string
  satuan: string
  stokSistem: number
  stokFisik: number
  selisih: number
}

export interface StokOpname {
  id: string
  nomorOpname: string
  cabangId: string
  cabangNama: string
  status: StatusStokOpname
  items: StokOpnameItem[]
  catatan?: string | null
  submittedAt?: string | null
  approvedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateStokOpnameDto {
  items: { produkId: string; stokSistem: number; stokFisik: number }[]
  catatan?: string
}
