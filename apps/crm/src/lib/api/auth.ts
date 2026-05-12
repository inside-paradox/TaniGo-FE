import api from './axios'
import type { LoginCredentials, LoginResponse, RefreshTokenResponse } from '@/types'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', credentials)
    return data.data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const { data } = await api.post('/auth/refresh', { refreshToken })
    return data.data
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me')
    return data.data
  },

  changePassword: async (payload: {
    passwordLama: string
    passwordBaru: string
  }): Promise<void> => {
    await api.post('/auth/change-password', payload)
  },
}
