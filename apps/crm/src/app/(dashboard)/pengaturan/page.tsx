'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { settingsApi, type InfoToko } from '@/lib/api'

export default function PengaturanPage() {
  const qc = useQueryClient()

  const { data: infoToko, isLoading } = useQuery({
    queryKey: ['settings', 'toko'],
    queryFn: settingsApi.getInfoToko,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<InfoToko>()

  useEffect(() => {
    if (infoToko) {
      reset({ nama: infoToko.nama, alamat: infoToko.alamat, telepon: infoToko.telepon })
    }
  }, [infoToko, reset])

  const updateMutation = useMutation({
    mutationFn: (data: InfoToko) => settingsApi.updateInfoToko(data),
    onSuccess: (updated) => {
      qc.setQueryData(['settings', 'toko'], updated)
      toast.success('Info toko berhasil disimpan')
      reset({ nama: updated.nama, alamat: updated.alamat, telepon: updated.telepon })
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan info toko')
    },
  })

  const onSubmit = (data: InfoToko) => updateMutation.mutate(data)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        subtitle="Konfigurasi informasi toko"
      />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Info Toko</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Nama Toko"
                required
                {...register('nama', { required: 'Nama toko wajib diisi' })}
                error={errors.nama?.message}
                placeholder="Nama toko Anda"
              />
              <Input
                label="Alamat"
                required
                {...register('alamat', { required: 'Alamat wajib diisi' })}
                error={errors.alamat?.message}
                placeholder="Alamat lengkap toko"
              />
              <Input
                label="Nomor Telepon"
                required
                {...register('telepon', { required: 'Telepon wajib diisi' })}
                error={errors.telepon?.message}
                placeholder="Contoh: 081234567890"
              />
              <div className="flex justify-end">
                <Button type="submit" loading={updateMutation.isPending} disabled={!isDirty}>
                  <Save className="h-4 w-4" />
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
