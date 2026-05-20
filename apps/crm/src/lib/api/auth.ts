import api from './axios'
import type { LoginCredentials, LoginResponse, RefreshTokenResponse, User } from '@/types'
import type { TipeCabang } from '@/types'

// Backend returns cabangNama instead of cabang, and doesn't include tipeCabang.
// This helper maps the raw backend user shape to the frontend User type.
type RawUser = Omit<User, 'cabang' | 'tipeCabang'> & {
  cabangNama?: string | null
}

function normalizeUser(raw: RawUser, tipeCabang: TipeCabang | null = null): User {
  return {
    id: raw.id,
    nama: raw.nama,
    email: raw.email,
    role: raw.role,
    cabangId: raw.cabangId,
    cabang: raw.cabangNama ?? null,
    tipeCabang,
    aktif: raw.aktif,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

async function resolveTipeCabang(cabangId: string | null): Promise<TipeCabang | null> {
  if (!cabangId) return null
  try {
    const { data } = await api.get(`/cabang/${cabangId}`)
    return data.data?.tipe ?? null
  } catch {
    return null
  }
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', credentials)
    const raw: { user: RawUser; tokens: LoginResponse['tokens'] } = data.data
    const tipeCabang = await resolveTipeCabang(raw.user.cabangId)
    return {
      user: normalizeUser(raw.user, tipeCabang),
      tokens: raw.tokens,
    }
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const { data } = await api.post('/auth/refresh', { refreshToken })
    return data.data
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get('/auth/me')
    const raw: RawUser = data.data
    const tipeCabang = await resolveTipeCabang(raw.cabangId)
    return normalizeUser(raw, tipeCabang)
  },

  updateProfile: async (payload: { nama: string; email: string }): Promise<User> => {
    const { data } = await api.patch('/auth/me', payload)
    const raw: RawUser = data.data
    const tipeCabang = await resolveTipeCabang(raw.cabangId)
    return normalizeUser(raw, tipeCabang)
  },

  changePassword: async (payload: {
    passwordLama: string
    passwordBaru: string
  }): Promise<void> => {
    await api.post('/auth/change-password', payload)
  },
}
