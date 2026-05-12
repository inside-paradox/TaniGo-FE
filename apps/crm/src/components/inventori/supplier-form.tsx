'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supplierSchema, type SupplierFormData } from '@/lib/validations/inventory'
import { useCreateSupplier, useUpdateSupplier } from '@/hooks/use-inventory'
import type { Supplier } from '@/types'

interface SupplierFormProps {
  open: boolean
  onClose: () => void
  supplier?: Supplier | null
}

export function SupplierForm({ open, onClose, supplier }: SupplierFormProps) {
  const isEdit = !!supplier
  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
  })

  useEffect(() => {
    if (supplier && open) {
      reset({ nama: supplier.nama, kontak: supplier.kontak, alamat: supplier.alamat })
    } else if (!open) {
      reset({ nama: '', kontak: '', alamat: '' })
    }
  }, [supplier, open, reset])

  const onSubmit = async (values: SupplierFormData) => {
    if (isEdit && supplier) {
      await updateMutation.mutateAsync({ id: supplier.id, data: values })
    } else {
      await createMutation.mutateAsync(values)
    }
    onClose()
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Supplier' : 'Tambah Supplier'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nama Supplier"
          required
          placeholder="Nama perusahaan atau supplier"
          error={errors.nama?.message}
          {...register('nama')}
        />
        <Input
          label="Kontak"
          required
          placeholder="Nomor telepon atau email"
          error={errors.kontak?.message}
          {...register('kontak')}
        />
        <Textarea
          label="Alamat"
          required
          placeholder="Alamat lengkap supplier"
          error={errors.alamat?.message}
          rows={3}
          {...register('alamat')}
        />
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button type="submit" loading={isLoading}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah Supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
