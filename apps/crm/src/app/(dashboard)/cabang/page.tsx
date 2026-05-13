'use client'

import { useState } from 'react'
import { Plus, Store, Warehouse, MapPin, MoreHorizontal } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCabangList,
  useCreateCabang,
  useUpdateCabang,
  useToggleAktifCabang,
} from '@/hooks/use-cabang'
import type { Cabang, TipeCabang } from '@/types'

const TIPE_OPTIONS = [
  { value: 'toko', label: 'Toko' },
  { value: 'gudang', label: 'Gudang' },
]

interface CabangForm {
  nama: string
  tipe: string
  lokasi: string
}

const EMPTY_FORM: CabangForm = { nama: '', tipe: 'toko', lokasi: '' }

function tipeBadge(tipe: TipeCabang) {
  return tipe === 'toko' ? 'info' : 'warning'
}

function TipeIcon({ tipe }: { tipe: TipeCabang }) {
  return tipe === 'toko'
    ? <Store className="h-4 w-4" />
    : <Warehouse className="h-4 w-4" />
}

interface ActionMenuProps {
  cabang: Cabang
  onEdit: (c: Cabang) => void
  onToggle: (c: Cabang) => void
}

function ActionMenu({ cabang, onEdit, onToggle }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="py-1">
              <button
                onClick={() => { setOpen(false); onEdit(cabang) }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Edit Cabang
              </button>
              <button
                onClick={() => { setOpen(false); onToggle(cabang) }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                {cabang.aktif ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function CabangCard({ cabang, onEdit, onToggle }: { cabang: Cabang; onEdit: (c: Cabang) => void; onToggle: (c: Cabang) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cabang.tipe === 'toko' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-600'}`}>
          <TipeIcon tipe={cabang.tipe} />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{cabang.nama}</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="h-3 w-3" />
            {cabang.lokasi}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={tipeBadge(cabang.tipe)}>
          {cabang.tipe === 'toko' ? 'Toko' : 'Gudang'}
        </Badge>
        <Badge variant={cabang.aktif ? 'success' : 'default'}>
          {cabang.aktif ? 'Aktif' : 'Nonaktif'}
        </Badge>
        <ActionMenu cabang={cabang} onEdit={onEdit} onToggle={onToggle} />
      </div>
    </div>
  )
}

export default function CabangPage() {
  const [filterTipe, setFilterTipe] = useState<TipeCabang | 'semua'>('semua')
  const [formOpen, setFormOpen] = useState(false)
  const [editCabang, setEditCabang] = useState<Cabang | null>(null)
  const [form, setForm] = useState<CabangForm>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<CabangForm>>({})
  const [confirmToggle, setConfirmToggle] = useState<Cabang | null>(null)

  const { data, isLoading } = useCabangList()
  const createMutation = useCreateCabang()
  const updateMutation = useUpdateCabang()
  const toggleMutation = useToggleAktifCabang()

  const allCabang = data?.data ?? []
  const filtered = filterTipe === 'semua'
    ? allCabang
    : allCabang.filter((c) => c.tipe === filterTipe)

  const tokoCount = allCabang.filter((c) => c.tipe === 'toko').length
  const gudangCount = allCabang.filter((c) => c.tipe === 'gudang').length

  function openCreate() {
    setEditCabang(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setFormOpen(true)
  }

  function openEdit(c: Cabang) {
    setEditCabang(c)
    setForm({ nama: c.nama, tipe: c.tipe, lokasi: c.lokasi })
    setFormErrors({})
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditCabang(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
  }

  function validate(): boolean {
    const errs: Partial<CabangForm> = {}
    if (!form.nama.trim()) errs.nama = 'Nama wajib diisi'
    if (!form.lokasi.trim()) errs.lokasi = 'Lokasi wajib diisi'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    if (editCabang) {
      await updateMutation.mutateAsync({
        id: editCabang.id,
        payload: { nama: form.nama, lokasi: form.lokasi },
      })
    } else {
      await createMutation.mutateAsync({
        nama: form.nama,
        tipe: form.tipe as TipeCabang,
        lokasi: form.lokasi,
      })
    }
    closeForm()
  }

  const FILTER_TABS = [
    { key: 'semua', label: `Semua (${allCabang.length})` },
    { key: 'toko', label: `Toko (${tokoCount})` },
    { key: 'gudang', label: `Gudang (${gudangCount})` },
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Cabang"
        subtitle="Kelola toko dan gudang yang terdaftar"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah Cabang
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Store className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{tokoCount}</p>
              <p className="text-sm text-gray-500">Total Toko</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
              <Warehouse className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{gudangCount}</p>
              <p className="text-sm text-gray-500">Total Gudang</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Store className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {allCabang.filter((c) => c.aktif).length}
              </p>
              <p className="text-sm text-gray-500">Cabang Aktif</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTipe(tab.key as typeof filterTipe)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              filterTipe === tab.key
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <Warehouse className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada cabang</p>
          <Button size="sm" className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah Sekarang
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <CabangCard
              key={c.id}
              cabang={c}
              onEdit={openEdit}
              onToggle={(cab) => setConfirmToggle(cab)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editCabang ? 'Edit Cabang' : 'Tambah Cabang'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Cabang"
            required
            value={form.nama}
            onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
            error={formErrors.nama}
            placeholder="cth. Toko Utama Jakarta"
          />
          {!editCabang && (
            <Select
              label="Tipe"
              required
              value={form.tipe}
              onChange={(e) => setForm((f) => ({ ...f, tipe: e.target.value }))}
              options={TIPE_OPTIONS}
            />
          )}
          <Input
            label="Lokasi"
            required
            value={form.lokasi}
            onChange={(e) => setForm((f) => ({ ...f, lokasi: e.target.value }))}
            error={formErrors.lokasi}
            placeholder="cth. Jakarta Selatan"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeForm}>Batal</Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editCabang ? 'Simpan' : 'Tambah Cabang'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toggle Confirm */}
      <ConfirmModal
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => {
          if (confirmToggle) {
            toggleMutation.mutate({ id: confirmToggle.id, aktif: !confirmToggle.aktif })
            setConfirmToggle(null)
          }
        }}
        title={confirmToggle?.aktif ? 'Nonaktifkan Cabang' : 'Aktifkan Cabang'}
        description={`Anda yakin ingin ${confirmToggle?.aktif ? 'menonaktifkan' : 'mengaktifkan'} cabang "${confirmToggle?.nama}"?`}
        confirmLabel={confirmToggle?.aktif ? 'Nonaktifkan' : 'Aktifkan'}
        loading={toggleMutation.isPending}
      />
    </div>
  )
}
