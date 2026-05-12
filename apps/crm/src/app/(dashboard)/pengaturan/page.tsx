'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Save, X, Building2, Tag, Store } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ConfirmModal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { settingsApi, type InfoToko, type KategoriProdukSetting } from '@/lib/api'

type TabId = 'infoToko' | 'kategori' | 'cabang'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'infoToko', label: 'Info Toko', icon: <Store className="h-4 w-4" /> },
  { id: 'kategori', label: 'Kategori Produk', icon: <Tag className="h-4 w-4" /> },
  { id: 'cabang', label: 'Cabang', icon: <Building2 className="h-4 w-4" /> },
]

// --- Info Toko Tab ---
function InfoTokoTab() {
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-5">
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
        <Button
          type="submit"
          loading={updateMutation.isPending}
          disabled={!isDirty}
        >
          <Save className="h-4 w-4" />
          Simpan Perubahan
        </Button>
      </div>
    </form>
  )
}

// --- Kategori Tab ---
interface KategoriFormState {
  nama: string
  deskripsi: string
}

const EMPTY_KAT: KategoriFormState = { nama: '', deskripsi: '' }

function KategoriTab() {
  const qc = useQueryClient()
  const [inlineForm, setInlineForm] = useState(false)
  const [editItem, setEditItem] = useState<KategoriProdukSetting | null>(null)
  const [form, setForm] = useState<KategoriFormState>(EMPTY_KAT)
  const [deleteTarget, setDeleteTarget] = useState<KategoriProdukSetting | null>(null)

  const { data: kategoriList = [], isLoading } = useQuery({
    queryKey: ['settings', 'kategori'],
    queryFn: settingsApi.getKategori,
  })

  const createMutation = useMutation({
    mutationFn: (payload: Omit<KategoriProdukSetting, 'id'>) =>
      settingsApi.createKategori(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'kategori'] })
      toast.success('Kategori berhasil ditambahkan')
      setInlineForm(false)
      setForm(EMPTY_KAT)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menambahkan kategori')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Omit<KategoriProdukSetting, 'id'>> }) =>
      settingsApi.updateKategori(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'kategori'] })
      toast.success('Kategori berhasil diperbarui')
      setEditItem(null)
      setForm(EMPTY_KAT)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui kategori')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsApi.deleteKategori(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'kategori'] })
      toast.success('Kategori berhasil dihapus')
      setDeleteTarget(null)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus kategori')
    },
  })

  const handleSave = () => {
    if (!form.nama.trim()) {
      toast.error('Nama kategori wajib diisi')
      return
    }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, payload: { nama: form.nama, deskripsi: form.deskripsi || undefined } })
    } else {
      createMutation.mutate({ nama: form.nama, deskripsi: form.deskripsi || undefined })
    }
  }

  const handleEditClick = (kat: KategoriProdukSetting) => {
    setEditItem(kat)
    setForm({ nama: kat.nama, deskripsi: kat.deskripsi ?? '' })
    setInlineForm(false)
  }

  const handleCancel = () => {
    setEditItem(null)
    setInlineForm(false)
    setForm(EMPTY_KAT)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{kategoriList.length} kategori terdaftar</p>
        {!inlineForm && !editItem && (
          <Button
            size="sm"
            onClick={() => {
              setInlineForm(true)
              setForm(EMPTY_KAT)
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Kategori
          </Button>
        )}
      </div>

      {/* Inline add form */}
      {inlineForm && !editItem && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
          <Input
            placeholder="Nama kategori"
            value={form.nama}
            onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
            className="flex-1"
          />
          <Input
            placeholder="Deskripsi (opsional)"
            value={form.deskripsi}
            onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleSave}
            loading={createMutation.isPending}
          >
            Simpan
          </Button>
          <button
            onClick={handleCancel}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
        {kategoriList.length === 0 && !inlineForm ? (
          <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
            <Tag className="h-8 w-8" />
            <p className="text-sm">Belum ada kategori produk</p>
          </div>
        ) : (
          kategoriList.map((kat) => (
            <div key={kat.id} className="bg-white">
              {editItem?.id === kat.id ? (
                <div className="flex items-center gap-3 bg-blue-50 p-3">
                  <Input
                    value={form.nama}
                    onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                    className="flex-1"
                    placeholder="Nama kategori"
                  />
                  <Input
                    value={form.deskripsi}
                    onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                    className="flex-1"
                    placeholder="Deskripsi (opsional)"
                  />
                  <Button
                    size="sm"
                    onClick={handleSave}
                    loading={updateMutation.isPending}
                  >
                    Simpan
                  </Button>
                  <button
                    onClick={handleCancel}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{kat.nama}</p>
                    {kat.deskripsi && (
                      <p className="text-xs text-gray-500">{kat.deskripsi}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditClick(kat)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(kat)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Hapus Kategori"
        description={`Anda yakin ingin menghapus kategori "${deleteTarget?.nama}"? Produk dalam kategori ini perlu dipindahkan terlebih dahulu.`}
        confirmLabel="Hapus"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

// --- Cabang Tab ---
function CabangTab() {
  const { data: cabangList = [], isLoading } = useQuery({
    queryKey: ['settings', 'cabang'],
    queryFn: settingsApi.getCabang,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{cabangList.length} cabang terdaftar</p>
      </div>

      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
        {cabangList.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
            <Building2 className="h-8 w-8" />
            <p className="text-sm">Belum ada data cabang</p>
          </div>
        ) : (
          cabangList.map((cabang) => (
            <div
              key={cabang.id}
              className="flex items-center justify-between bg-white px-4 py-3"
            >
              <div>
                <p className="font-medium text-gray-900">{cabang.nama}</p>
                <p className="text-xs text-gray-500">{cabang.alamat}</p>
              </div>
              <Badge variant={cabang.aktif ? 'success' : 'default'}>
                {cabang.aktif ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
          ))
        )}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Building2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
        <div>
          <p className="text-sm font-medium text-blue-900">Fitur Multi-Cabang</p>
          <p className="mt-0.5 text-xs text-blue-700">
            Fitur multi-cabang akan hadir dalam pembaruan berikutnya. Anda akan dapat mengelola
            stok, pengguna, dan laporan per cabang secara terpisah.
          </p>
        </div>
      </div>
    </div>
  )
}

// --- Main Page ---
export default function PengaturanPage() {
  const [activeTab, setActiveTab] = useState<TabId>('infoToko')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        subtitle="Kelola konfigurasi sistem dan data referensi"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Tab Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Tab Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {TABS.find((t) => t.id === activeTab)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTab === 'infoToko' && <InfoTokoTab />}
              {activeTab === 'kategori' && <KategoriTab />}
              {activeTab === 'cabang' && <CabangTab />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
