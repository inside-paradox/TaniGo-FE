export type MetodePembayaranPOS = 'Tunai' | 'QRIS' | 'Transfer Bank'

export interface ItemKeranjang {
  produkId: string
  nama: string
  sku: string
  satuan: string
  hargaSatuan: number
  stok: number
  qty: number
  diskon: number
  subtotal: number
}

export interface PembayaranSplit {
  metode: MetodePembayaranPOS
  nominal: number
}

export interface ItemTransaksi {
  id: string
  produkId: string
  produkNama: string
  produkSku: string
  satuan: string
  qty: number
  hargaSatuan: number
  diskon: number
  subtotal: number
  /** Sisa qty yang masih bisa diretur. Jika 0, item sudah habis diretur. */
  qtyTersisa?: number
}

export interface Transaksi {
  id: string
  nomorStruk: string
  items: ItemTransaksi[]
  subtotal: number
  totalDiskon: number
  total: number
  pembayaran: PembayaranSplit[]
  kembalian: number
  kasirId: string
  kasirNama: string
  shiftId: string
  createdAt: string
}

export interface CreateTransaksiDto {
  items: {
    produkId: string
    qty: number
    hargaSatuan: number
    diskon?: number
  }[]
  pembayaran: PembayaranSplit[]
  sumber: 'pos'
}

export interface Shift {
  id: string
  kasirId: string
  kasirNama: string
  cabang: string
  waktuBuka: string
  waktuTutup?: string | null
  saldoAwal: number
  saldoAkhir?: number | null
  totalTransaksi: number
  totalPenjualan: number
  /** Uang tunai yang diterima dari pelanggan (amount tendered), bukan net penjualan */
  totalPenjualanTunai: number
  totalPenjualanQRIS: number
  totalPenjualanTransfer: number
  totalDiskon: number
  totalRetur: number
  /** Total kembalian tunai yang diberikan ke pelanggan. Diperlukan agar ekspektasi kas akurat. */
  totalKembalian?: number
  status: 'aktif' | 'tutup'
}

export interface BukaShiftDto {
  saldoAwal: number
}

export interface TutupShiftDto {
  saldoAkhir: number
}

export interface ItemRetur {
  itemTransaksiId: string
  produkId: string
  produkNama: string
  produkSku: string
  satuan: string
  qty: number
  hargaSatuan: number
  subtotal: number
}

export interface Retur {
  id: string
  transaksiId: string
  nomorStruk: string
  items: ItemRetur[]
  totalRefund: number
  metodeRefund: 'Tunai' | 'Kredit'
  kasirId: string
  kasirNama: string
  createdAt: string
}

export interface CreateReturDto {
  items: { itemTransaksiId: string; qty: number }[]
  metodeRefund: 'Tunai' | 'Kredit'
}

export interface TransaksiTertahan {
  id: string
  label?: string
  items: ItemKeranjang[]
  createdAt: string
}
