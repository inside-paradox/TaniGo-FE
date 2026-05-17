'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ArrowLeft, Tag } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { useKategoriProduk, useCreateKategori, useUpdateKategori, useDeleteKategori } from '@/hooks/use-kategori'
import { useAuthStore } from '@/store/auth-store'
import type { KategoriProdukSetting } from '@/lib/api'

// ─── Form Modal ───────────────────────────────────────────────────────────────

interface KategoriFormModalProps {
  open: boolean
  onClose: () => void
  editData?: KategoriProdukSetting | null
}

function KategoriFormModal({ open, onClose, editData }: KategoriFormModalProps) {
  const isEdit = !!editData
  const { mutate: create, isPending: creating } = useCreateKategori()
  const { mutate: update, isPending: updating } = useUpdateKategori()
  const isPending = creating || updating

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ nama: string; deskripsi: string }>()

  useEffect(() => {
    if (open) {
      reset({
        nama: editData?.nama ?? '',
        deskripsi: editData?.deskripsi ?? '',
      })
    }
  }, [open, editData, reset])

  const onSubmit = (values: { nama: string; deskripsi: string }) => {
    const payload = {
      nama: values.nama.trim(),
      deskripsi: values.deskripsi.trim() || null,
    }
    if (isEdit && editData) {
      update({ id: editData.id, data: payload }, { onSuccess: onClose })
    } else {
      create(payload, { onSuccess: onClose })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Kategori' : 'Tambah Kategori'}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nama Kategori"
          required
          placeholder="Contoh: Pupuk, Benih, Pestisida"
          error={errors.nama?.message}
          {...register('nama', { required: 'Nama kategori wajib diisi' })}
        />
        <Input
          label="Deskripsi"
          placeholder="Deskripsi singkat (opsional)"
          {...register('deskripsi')}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" loading={isPending}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah Kategori'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KategoriProdukPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  // Only superadmin can access
  if (user && user.role !== 'superadmin') {
    router.replace('/produk')
    return null
  }

  const { data: kategoriList = [], isLoading } = useKategoriProduk()
  const { mutate: deleteKategori, isPending: deleting } = useDeleteKategori()

  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<KategoriProdukSetting | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<KategoriProdukSetting | null>(null)

  const handleOpenCreate = () => {
    setEditData(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (k: KategoriProdukSetting) => {
    setEditData(k)
    setModalOpen(true)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteKategori(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategori Produk"
        subtitle={`${kategoriList.length} kategori terdaftar`}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push('/produk')}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" />
              Tambah Kategori
            </Button>
          </div>
        }
      />

      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-green-600" />
            <CardTitle>Daftar Kategori</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : kategoriList.length === 0 ? (
            <div className="py-10 text-center">
              <Tag className="mx-auto mb-3 h-10 w-10 text-gray-200" />
              <p className="text-sm text-gray-400">Belum ada kategori. Tambahkan kategori pertama.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {kategoriList.map((k) => (
                <li key={k.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{k.nama}</p>
                    {k.deskripsi && (
                      <p className="text-xs text-gray-400 mt-0.5">{k.deskripsi}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(k)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(k)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <KategoriFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editData={editData}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Kategori"
        description={`Kategori "${deleteTarget?.nama}" akan dihapus. Produk yang menggunakan kategori ini perlu diperbarui secara manual.`}
        confirmLabel="Hapus"
        loading={deleting}
      />
    </div>
  )
}
