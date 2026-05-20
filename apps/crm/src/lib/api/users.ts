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

// Backend returns cabangNama instead of cabang, and doesn't include tipeCabang.
type RawUser = Omit<User, 'cabang' | 'tipeCabang'> & {
  cabangNama?: string | null
}

function normalizeUser(raw: RawUser): User {
  return {
    id: raw.id,
    nama: raw.nama,
    email: raw.email,
    role: raw.role,
    cabangId: raw.cabangId,
    cabang: raw.cabangNama ?? null,
    tipeCabang: null,
    aktif: raw.aktif,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export const usersApi = {
  getAll: async (params: TableParams): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get('/users', { params })
    const result: PaginatedResponse<RawUser> = data.data
    return { ...result, data: result.data.map(normalizeUser) }
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await api.get(`/users/${id}`)
    return normalizeUser(data.data)
  },

  create: async (payload: CreateUserDto): Promise<User> => {
    const { data } = await api.post('/users', payload)
    return normalizeUser(data.data)
  },

  update: async (id: string, payload: UpdateUserDto): Promise<User> => {
    const { data } = await api.patch(`/users/${id}`, payload)
    return normalizeUser(data.data)
  },

  resetPassword: async (id: string, passwordBaru: string): Promise<void> => {
    await api.post(`/users/${id}/reset-password`, { passwordBaru })
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  },
}
