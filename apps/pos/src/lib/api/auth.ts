import type { LoginCredentials, LoginResponse } from '@tanigo/types'
import { api } from './axios'

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await api.post<{ data: LoginResponse }>('/auth/login', credentials)
  return data.data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}
