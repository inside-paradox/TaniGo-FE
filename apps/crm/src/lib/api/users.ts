import api from './axios'
import type { User, PaginatedResponse, TableParams } from '@/types'

export interface CreateUserDto {
  nama: string
  email: string
  password: string
  role: string
  cabangId: string | null
}

export interface UpdateUserDto {
  nama?: string
  role?: string
  cabangId?: string | null
  aktif?: boolean
}

export const usersApi = {
  getAll: async (params: TableParams): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get('/users', { params })
    return {
      data: data.data as User[],
      meta: data.meta,
    }
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await api.get(`/users/${id}`)
    return data.data as User
  },

  create: async (payload: CreateUserDto): Promise<User> => {
    const { data } = await api.post('/users', payload)
    return data.data as User
  },

  update: async (id: string, payload: UpdateUserDto): Promise<User> => {
    const { data } = await api.patch(`/users/${id}`, payload)
    return data.data as User
  },

  resetPassword: async (id: string, passwordBaru: string): Promise<void> => {
    await api.post(`/users/${id}/reset-password`, { passwordBaru })
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  },
}
