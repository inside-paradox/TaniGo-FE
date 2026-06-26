export type StatusPO =
  | 'Draft'
  | 'Dikirim ke Supplier'
  | 'Sebagian Diterima'
  | 'Diterima'
  | 'Dibatalkan'

export type StatusPembayaranPO = 'Belum Bayar' | 'Sebagian' | 'Lunas'

export interface ItemPO {
  id: string
  produkId: string
  produkNama: string
  produkSku: string
  qtyPesan: number
  qtyDiterima: number
  hargaBeli: number
  subtotal: number
}

export interface BiayaTambahan {
  ongkosKirim: number
  biayaBongkarMuat: number
  upahKurir: number
  lainnya: number
  keteranganLainnya?: string
}

export interface PurchaseOrder {
  id: string
  nomorPO: string
  supplierId: string
  supplierNama: string
  items: ItemPO[]
  biayaTambahan: BiayaTambahan
  totalHargaBarang: number
  totalBiayaTambahan: number
  totalKeseluruhan: number
  hppPerUnit: number
  totalQty: number
  status: StatusPO
  statusPembayaran: StatusPembayaranPO
  totalDibayar: number
  sisaHutang: number
  catatan?: string | null
  estimasiTanggalTiba?: string | null
  createdAt: string
  updatedAt: string
}

export interface PembayaranPO {
  id: string
  purchaseOrderId: string
  nominal: number
  tanggal: string
  metode: 'Transfer' | 'Tunai' | 'Cek'
  catatan?: string | null
}

export interface CreatePODto {
  supplierId: string
  items: { produkId: string; qtyPesan: number; hargaBeli: number }[]
  biayaTambahan: BiayaTambahan
  catatan?: string
  estimasiTanggalTiba?: string
}

// Edit draft memakai payload yang sama dengan create.
export type UpdatePODto = CreatePODto
