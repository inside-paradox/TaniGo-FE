export type TipeNotifikasi = 'info' | 'peringatan' | 'penting'

export interface Notifikasi {
  id: string
  judul: string
  pesan: string
  tipe: TipeNotifikasi
  targetCabang: string[] | 'semua'   // array of cabangId or literal 'semua'
  targetRole: string[] | 'semua'     // array of role strings or literal 'semua'
  createdBy: string
  createdByNama: string
  readByUserIds: string[]
  createdAt: string
}

export interface CreateNotifikasiDto {
  judul: string
  pesan: string
  tipe: TipeNotifikasi
  targetCabang: string[] | 'semua'
  targetRole: string[] | 'semua'
}
