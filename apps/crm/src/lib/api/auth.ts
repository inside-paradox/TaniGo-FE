import api from './axios'
import type { LoginCredentials, LoginResponse, RefreshTokenResponse, User } from '@/types'

type RawUser = Omit<User, 'cabang'> & { cabangNama?: string | null }

function normalizeUser(raw: RawUser): User {
  return {
    ...raw,
    cabang: raw.cabangNama ?? null,
  }
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    // Clear any stale token (e.g. demo token) before making the real login request
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      // Also clear the accessToken cookie so the middleware doesn't use a stale/demo token
      document.cookie = 'accessToken=; path=/; max-age=0'
    }
    const { data } = await api.post('/auth/login', credentials)
    const raw = data.data as { user: RawUser; tokens: { accessToken: string; refreshToken: string } }
    return {
      user: normalizeUser(raw.user),
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
    return normalizeUser(data.data as RawUser)
  },

  updateProfile: async (payload: { nama: string; email: string }): Promise<User> => {
    const { data } = await api.patch('/auth/me', payload)
    return normalizeUser(data.data as RawUser)
  },

  changePassword: async (payload: {
    passwordLama: string
    passwordBaru: string
  }): Promise<void> => {
    await api.post('/auth/change-password', payload)
  },
}
