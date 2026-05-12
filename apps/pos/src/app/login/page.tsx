'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, FlaskConical, Sprout } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth'
import { useLogin } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'

const DEMO_USER = {
  id: 'demo-001',
  nama: 'Kasir Demo',
  email: 'demo@tanigo.id',
  role: 'kasir' as const,
  cabang: 'Cabang Utama',
  aktif: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { mutate: doLogin, isPending } = useLogin()
  const { isAuthenticated, setAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated()) router.replace('/transaksi')
  }, [isAuthenticated, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (values: LoginFormValues) => doLogin(values)

  const handleDemo = () => {
    setAuth(DEMO_USER, 'demo-token', 'demo-refresh-token')
    toast.success('Masuk sebagai Kasir Demo')
    router.replace('/transaksi')
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
            <Input
              label="Email"
              type="email"
              placeholder="kasir@tanigo.id"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
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
              {...register('password')}
            />

            <Button type="submit" className="w-full" size="lg" loading={isPending}>
              Masuk
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">atau</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemo}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 transition-colors hover:border-green-400 hover:text-green-600"
          >
            <FlaskConical className="h-4 w-4" />
            Masuk sebagai Demo (tanpa backend)
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} TaniGo. Hak cipta dilindungi.
        </p>
      </div>
    </div>
  )
}
