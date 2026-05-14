'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Save, KeyRound, User, Building2, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { getInitials } from '@/lib/utils'

const roleLabels: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  manajer: 'Manajer',
  kasir: 'Kasir',
  staf_gudang: 'Staf Gudang',
}

// ── Info Pribadi ──────────────────────────────────────────────────────────────

interface ProfilForm {
  nama: string
  email: string
}

function InfoPribadiSection() {
  const { user, setUser } = useAuthStore()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfilForm>()

  useEffect(() => {
    if (user) reset({ nama: user.nama, email: user.email })
  }, [user, reset])

  const mutation = useMutation({
    mutationFn: (data: ProfilForm) => authApi.updateProfile(data),
    onSuccess: (updated) => {
      setUser(updated)
      reset({ nama: updated.nama, email: updated.email })
      toast.success('Profil berhasil diperbarui')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          Informasi Pribadi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          <Input
            label="Nama Lengkap"
            required
            {...register('nama', { required: 'Nama wajib diisi' })}
            error={errors.nama?.message}
            placeholder="Nama lengkap Anda"
          />
          <Input
            label="Email"
            type="email"
            required
            {...register('email', {
              required: 'Email wajib diisi',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Format email tidak valid' },
            })}
            error={errors.email?.message}
            placeholder="email@contoh.com"
          />
          <div className="flex justify-end">
            <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
              <Save className="h-4 w-4" />
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ── Info Akun (read-only) ─────────────────────────────────────────────────────

function InfoAkunSection() {
  const { user } = useAuthStore()
  if (!user) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gray-500" />
          Informasi Akun
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Role</dt>
              <dd className="mt-1">
                <Badge variant="info">{roleLabels[user.role] ?? user.role}</Badge>
              </dd>
            </div>
          </div>
          {user.cabang && (
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Cabang
                </dt>
                <dd className="mt-1 font-medium text-gray-900">{user.cabang}</dd>
              </div>
              {user.tipeCabang && (
                <Badge variant={user.tipeCabang === 'gudang' ? 'warning' : 'default'}>
                  {user.tipeCabang === 'gudang' ? 'Gudang' : 'Toko'}
                </Badge>
              )}
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Status Akun</dt>
            <dd className="mt-1">
              <Badge variant={user.aktif ? 'success' : 'danger'}>
                {user.aktif ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-gray-400">
          Role dan cabang hanya dapat diubah oleh administrator.
        </p>
      </CardContent>
    </Card>
  )
}

// ── Ganti Password ────────────────────────────────────────────────────────────

interface PasswordForm {
  passwordLama: string
  passwordBaru: string
  konfirmasi: string
}

function GantiPasswordSection() {
  const [showLama, setShowLama] = useState(false)
  const [showBaru, setShowBaru] = useState(false)
  const [showKonfirmasi, setShowKonfirmasi] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>()

  const passwordBaru = watch('passwordBaru')

  const mutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      authApi.changePassword({ passwordLama: data.passwordLama, passwordBaru: data.passwordBaru }),
    onSuccess: () => {
      reset()
      toast.success('Password berhasil diubah')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal mengubah password')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-gray-500" />
          Ganti Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          {/* Password Lama */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Password Lama <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showLama ? 'text' : 'password'}
                {...register('passwordLama', { required: 'Password lama wajib diisi' })}
                placeholder="Masukkan password saat ini"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 pr-10 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowLama((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showLama ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.passwordLama && (
              <p className="text-xs text-red-500">{errors.passwordLama.message}</p>
            )}
          </div>

          {/* Password Baru */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Password Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showBaru ? 'text' : 'password'}
                {...register('passwordBaru', {
                  required: 'Password baru wajib diisi',
                  minLength: { value: 8, message: 'Minimal 8 karakter' },
                })}
                placeholder="Minimal 8 karakter"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 pr-10 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowBaru((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showBaru ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.passwordBaru && (
              <p className="text-xs text-red-500">{errors.passwordBaru.message}</p>
            )}
          </div>

          {/* Konfirmasi */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Konfirmasi Password Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showKonfirmasi ? 'text' : 'password'}
                {...register('konfirmasi', {
                  required: 'Konfirmasi password wajib diisi',
                  validate: (v) => v === passwordBaru || 'Password tidak cocok',
                })}
                placeholder="Ulangi password baru"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 pr-10 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowKonfirmasi((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKonfirmasi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.konfirmasi && (
              <p className="text-xs text-red-500">{errors.konfirmasi.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={mutation.isPending}>
              <KeyRound className="h-4 w-4" />
              Ubah Password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ProfilPage() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Saya"
        subtitle="Kelola informasi akun dan keamanan Anda"
      />

      {/* Avatar + nama ringkas */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 text-xl font-bold">
          {user ? getInitials(user.nama) : '?'}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{user?.nama}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <p className="mt-0.5 text-xs text-gray-400">{user ? roleLabels[user.role] : ''}{user?.cabang ? ` · ${user.cabang}` : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <InfoPribadiSection />
          <GantiPasswordSection />
        </div>
        <div>
          <InfoAkunSection />
        </div>
      </div>
    </div>
  )
}
