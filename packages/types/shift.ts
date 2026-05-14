export type StatusShift = 'Aktif' | 'Selesai'

export interface Shift {
  id: string
  kasirId: string
  kasirNama: string
  cabangId: string
  cabangNama: string
  modalAwal: number
  totalTransaksi: number
  totalPendapatan: number
  totalTunai: number
  totalNonTunai: number
  totalDiskon: number
  catatanPenutupan?: string | null
  status: StatusShift
  mulaiAt: string
  selesaiAt?: string | null
  createdAt: string
  updatedAt: string
}
