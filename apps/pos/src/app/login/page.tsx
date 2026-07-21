'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Sprout, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth'
import { login } from '@/lib/api/auth'
import { fetchActiveShift } from '@/lib/api/shifts'
import { useAuthStore } from '@/store/authStore'
import { useShiftStore } from '@/store/shiftStore'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const setShift = useShiftStore((s) => s.setShift)
  const clearShift = useShiftStore((s) => s.clearShift)
  const accessToken = useAuthStore((s) => s.accessToken)
  const _hasHydrated = useAuthStore((s) => s._hasHydrated)
  const router = useRouter()

  useEffect(() => {
    if (_hasHydrated && accessToken) router.replace('/transaksi')
  }, [_hasHydrated, accessToken, router])

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const data = await login(values)
      // POS hanya untuk kasir di cabang toko
      if (data.user.role !== 'kasir' || data.user.tipeCabang !== 'toko') {
        setError('root', { message: 'Akses ditolak. TaniGo POS hanya dapat diakses oleh Kasir Toko.' })
        return
      }
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken)
      toast.success(`Selamat datang, ${data.user.nama}!`)
      // Check if a shift is already open — direct kasir accordingly.
      // Always sync store with server: clear stale localStorage shift if server has none.
      const activeShift = await fetchActiveShift()
      if (activeShift) {
        setShift(activeShift)
        router.replace('/transaksi')
      } else {
        clearShift()
        router.replace('/shift')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      const message = error.response?.data?.message || 'Email atau password salah'
      setError('root', { message })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 shadow-lg">
            <Sprout className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TaniGo POS</h1>
          <p className="mt-1 text-sm text-gray-500">Masuk ke akun kasir Anda</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root?.message && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errors.root.message}</span>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="kasir@tanigo.id"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', { onChange: () => clearErrors('root') })}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('password', { onChange: () => clearErrors('root') })}
            />

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Masuk
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} TaniGo. Hak cipta dilindungi.
        </p>
      </div>
    </div>
  )
}
