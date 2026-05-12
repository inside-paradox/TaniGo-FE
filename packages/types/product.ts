export type KategoriProduk = 'Benih' | 'Pupuk' | 'Pestisida' | 'Alat & Mesin' | 'Lainnya'

export type StatusStok = 'normal' | 'menipis' | 'habis'

export interface Produk {
  id: string
  nama: string
  sku: string
  kategori: KategoriProduk
  satuan: string
  hargaBeli: number
  hargaJual: number
  stok: number
  lokasiRak: string
  tanggalKedaluwarsa?: string | null
  foto?: string | null
  thresholdStok: number
  statusAktif: boolean
  statusStok: StatusStok
  supplierId?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateProdukDto {
  nama: string
  sku?: string
  kategori: KategoriProduk
  satuan: string
  hargaBeli: number
  hargaJual: number
  stokAwal: number
  lokasiRak: string
  tanggalKedaluwarsa?: string | null
  foto?: File | null
  thresholdStok: number
  statusAktif: boolean
}

export interface UpdateProdukDto extends Partial<CreateProdukDto> {}

export interface ProdukFilter {
  kategori?: KategoriProduk
  statusStok?: StatusStok
  satuan?: string
  search?: string
}
