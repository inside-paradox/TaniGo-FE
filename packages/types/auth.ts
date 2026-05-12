export type UserRole = 'admin' | 'manajer' | 'kasir' | 'staf_gudang'
export type TipeCabang = 'toko' | 'gudang'

export interface User {
  id: string
  nama: string
  email: string
  role: UserRole
  cabang: string
  tipeCabang: TipeCabang
  aktif: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

export interface RefreshTokenResponse {
  accessToken: string
}
