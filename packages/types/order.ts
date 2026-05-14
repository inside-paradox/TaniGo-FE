export type StatusPesanan =
  | 'Baru'
  | 'Diproses'
  | 'Siap Kirim'
  | 'Dalam Pengiriman'
  | 'Selesai'
  | 'Dibatalkan'

export type MetodePembayaran =
  | 'Tunai'
  | 'Transfer Bank'
  | 'QRIS'
  | 'Kartu Debit'
  | 'Kredit VIP'

export type MetodePengiriman = 'ambil_sendiri' | 'dikirim'

export interface ItemPesanan {
  id: string
  produkId: string
  produkNama: string
  produkSku: string
  qty: number
  hargaSatuan: number
  subtotal: number
}

export interface Pesanan {
  id: string
  nomorPesanan: string
  pelangganId?: string | null
  pelangganNama: string
  pelangganTelepon?: string | null
  items: ItemPesanan[]
  subtotal: number
  diskon: number
  total: number
  metodePembayaran: MetodePembayaran
  metodePengiriman: MetodePengiriman
  alamatPengiriman?: string | null
  status: StatusPesanan
  catatan?: string | null
  kasirId: string
  kasirNama: string
  sumber: 'pos' | 'vip' | 'manual'
  hasRetur?: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePesananDto {
  pelangganId?: string
  pelangganNama: string
  pelangganTelepon?: string
  items: { produkId: string; qty: number; hargaSatuan: number }[]
  diskon?: number
  metodePembayaran: MetodePembayaran
  metodePengiriman: MetodePengiriman
  alamatPengiriman?: string
  catatan?: string
  sumber?: 'pos' | 'vip' | 'manual'
}
