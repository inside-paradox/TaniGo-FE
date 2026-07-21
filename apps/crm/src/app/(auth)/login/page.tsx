'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, Sprout, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

function getSafeRedirect(searchParams: ReturnType<typeof useSearchParams>) {
  const redirect = searchParams.get('redirect') || '/dashboard'
  return redirect.startsWith('/') && !redirect.startsWith('/auth') && !redirect.startsWith('/api')
    ? redirect
    : '/dashboard'
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth, isAuthenticated, _hasHydrated } = useAuthStore()

  // Already logged in — redirect away from login page
  // Must be in useEffect, not render, to avoid React crash
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace(getSafeRedirect(searchParams))
    }
  }, [_hasHydrated, isAuthenticated, router, searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormData) => {
    setLoading(true)
    setAuthError(null)
    try {
      const response = await authApi.login(values)
      setAuth(response.user, response.tokens.accessToken, response.tokens.refreshToken)

      document.cookie = `accessToken=${response.tokens.accessToken}; path=/; max-age=${60 * 60 * 24}`

      toast.success(`Selamat datang, ${response.user.nama}!`)
      router.push(getSafeRedirect(searchParams))
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      const message = error.response?.data?.message || 'Email atau password salah'
      setAuthError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Auth error banner */}
      {authError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@tanigo.id"
          className={`h-11 w-full rounded-lg border px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ${
            authError || errors.email
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
          }`}
          {...register('email', { onChange: () => setAuthError(null) })}
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Masukkan password"
            className={`h-11 w-full rounded-lg border px-4 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ${
              authError || errors.password
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
            }`}
            {...register('password', { onChange: () => setAuthError(null) })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-green-600 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Memproses...' : 'Masuk'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 shadow-lg">
            <Sprout className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TaniGo CRM</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sistem Manajemen Toko Perlengkapan Pertanian
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Masuk ke Akun</h2>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-gray-100" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} TaniGo. Hak cipta dilindungi.
        </p>
      </div>
    </div>
  )
}
