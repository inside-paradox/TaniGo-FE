export type TipeCabang = 'toko' | 'gudang'

export interface Cabang {
  id: string
  nama: string
  tipe: TipeCabang
  lokasi: string
  telepon: string
  aktif: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCabangDto {
  nama: string
  tipe: TipeCabang
  lokasi: string
  telepon: string
}

export interface UpdateCabangDto {
  nama?: string
  lokasi?: string
  telepon?: string
  aktif?: boolean
}
