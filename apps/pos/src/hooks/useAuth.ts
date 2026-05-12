'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { login, logout } from '@/lib/api/auth'
import { useAuthStore } from '@/store/authStore'
import type { LoginCredentials } from '@tanigo/types'

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const router = useRouter()

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken)
      toast.success(`Selamat datang, ${data.user.nama}!`)
      router.replace('/transaksi')
    },
    onError: () => {
      toast.error('Email atau password salah')
    },
  })
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const router = useRouter()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAuth()
      router.replace('/login')
    },
  })
}
