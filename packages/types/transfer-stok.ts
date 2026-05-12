export type StatusTransferStok =
  | 'Menunggu Persetujuan'
  | 'Disetujui'
  | 'Ditolak'
  | 'Dikirim'
  | 'Selesai'

export interface TransferStokItem {
  id: string
  produkId: string
  produkNama: string
  produkSku: string
  satuan: string
  qtyDiminta: number
  qtyDisetujui?: number | null
}

export interface TransferStok {
  id: string
  nomorTransfer: string
  tokoId: string
  tokNama: string
  gudangId: string
  gudangNama: string
  items: TransferStokItem[]
  status: StatusTransferStok
  catatanToko?: string | null
  catatanGudang?: string | null
  createdAt: string
  approvedAt?: string | null
  shippedAt?: string | null
  receivedAt?: string | null
  updatedAt: string
}

export interface CreateTransferStokDto {
  items: { produkId: string; qtyDiminta: number }[]
  catatan?: string
}

export interface ApproveTransferStokDto {
  items: { transferItemId: string; qtyDisetujui: number }[]
  catatan?: string
}
