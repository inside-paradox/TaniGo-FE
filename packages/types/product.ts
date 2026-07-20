export type KategoriProduk = string

export type StatusStok = 'normal' | 'menipis' | 'habis'

export interface Produk {
  id: string
  nama: string
  sku: string
  kategori: KategoriProduk
  kategoriId?: string | null
  satuan: string
  hargaBeli: number
  hargaJual: number
  stok: number
  tanggalKedaluwarsa?: string | null
  foto?: string | null
  thresholdStok: number
  statusAktif: boolean
  statusStok: StatusStok
  /**
   * Relasi multi-sourcing: id supplier yang memasok produk ini. Dipakai modul PO
   * untuk memetakan produk per pemasok. Kosong/absen = belum ada supplier ditetapkan.
   */
  supplierIds?: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateProdukDto {
  nama: string
  sku?: string
  kategoriId: string | null
  satuan: string
  hargaBeli: number
  hargaJual: number
  stok: number
  tanggalKedaluwarsa?: string | null
  foto?: File | null
  thresholdStok: number
  statusAktif: boolean
  /** Id supplier yang memasok produk ini (multi-sourcing). */
  supplierIds?: string[]
}

export interface UpdateProdukDto extends Partial<CreateProdukDto> {}

export interface ProdukFilter {
  kategori?: KategoriProduk
  statusStok?: StatusStok
  satuan?: string
  search?: string
  /** Filter produk berdasarkan relasi supplier (dipakai dropdown produk di PO). */
  supplierId?: string
  /**
   * Filter produk aktif/non-aktif. Difilter server-side (sebelum pagination) —
   * memfilter di client akan melubangi tiap halaman hasil pada dropdown
   * berpencarian server. Kosong/absen = semua produk.
   */
  statusAktif?: boolean
  /**
   * Filter stok berdasarkan lokasi fisik (cabang/gudang). Bila diisi, kolom
   * `stok` & `statusStok` dihitung ulang untuk lokasi tsb (bukan akumulasi global)
   * untuk mencegah overselling. Kosong = stok global seluruh lokasi.
   */
  locationId?: string
}
