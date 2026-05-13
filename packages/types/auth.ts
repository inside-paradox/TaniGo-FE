export type UserRole = 'superadmin' | 'admin' | 'manajer' | 'kasir' | 'staf_gudang'

export interface User {
  id: string
  nama: string
  email: string
  role: UserRole
  cabangId: string | null
  cabang: string | null
  tipeCabang: import('./cabang').TipeCabang | null
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
