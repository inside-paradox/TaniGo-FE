'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Pagination } from '@/components/shared/pagination'
import { SearchInput } from '@/components/shared/search-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { TableActionMenu } from '@/components/ui/table-action-menu'
import { usersApi, type CreateUserDto, type UpdateUserDto } from '@/lib/api'
import { useCabangList } from '@/hooks/use-cabang'
import { useAuthStore } from '@/store/auth-store'
import { formatTanggal } from '@/lib/utils'
import type { User, UserRole, Cabang, TipeCabang } from '@/types'

const USERS_KEY = 'users'

const ALL_ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manajer', label: 'Manajer' },
  { value: 'kasir', label: 'Kasir' },
  { value: 'staf_gudang', label: 'Staf Gudang' },
]

// Role → tipeCabang yang diperbolehkan. null berarti bebas.
const ROLE_TIPE_CABANG: Record<string, TipeCabang[] | null> = {
  kasir: ['toko'],
  staf_gudang: ['gudang'],
  admin: null,
  manajer: null,
}

function roleBadgeVariant(role: UserRole) {
  switch (role) {
    case 'superadmin': return 'purple' as const
    case 'admin': return 'danger' as const
    case 'manajer': return 'info' as const
    case 'kasir': return 'success' as const
    case 'staf_gudang': return 'warning' as const
    default: return 'default' as const
  }
}

function roleLabel(role: UserRole) {
  switch (role) {
    case 'superadmin': return 'Superadmin'
    case 'admin': return 'Admin'
    case 'manajer': return 'Manajer'
    case 'kasir': return 'Kasir'
    case 'staf_gudang': return 'Staf Gudang'
    default: return role
  }
}

interface UserFormData {
  nama: string
  email: string
  password: string
  role: string
  cabangId: string
}

const EMPTY_FORM: UserFormData = {
  nama: '',
  email: '',
  password: '',
  role: 'kasir',
  cabangId: '',
}


export default function PenggunaPage() {
  const qc = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const isSuperadmin = currentUser?.role === 'superadmin'

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({})

  const { data: cabangData } = useCabangList({ aktif: true })
  const cabangList: Cabang[] = cabangData?.data ?? []

  const { data, isLoading } = useQuery({
    queryKey: [USERS_KEY, { page, limit, search, sorting, cabangId: isSuperadmin ? undefined : currentUser?.cabangId }],
    queryFn: () =>
      usersApi.getAll({
        page,
        limit,
        search: search || undefined,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
        ...(isSuperadmin ? {} : { cabangId: currentUser?.cabangId ?? undefined }),
      }),
    placeholderData: (prev) => prev,
  })

  const createMutation = useMutation({
    mutationFn: (dto: CreateUserDto) => usersApi.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [USERS_KEY] }); toast.success('Pengguna berhasil ditambahkan'); closeForm() },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Gagal menambahkan pengguna'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) => usersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [USERS_KEY] }); toast.success('Pengguna berhasil diperbarui'); closeForm() },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Gagal memperbarui pengguna'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [USERS_KEY] }); toast.success('Pengguna berhasil dihapus'); setDeleteUser(null) },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Gagal menghapus pengguna'),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, passwordBaru }: { id: string; passwordBaru: string }) => usersApi.resetPassword(id, passwordBaru),
    onSuccess: () => { toast.success('Password berhasil direset'); setResetPasswordUser(null); setNewPassword('') },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Gagal mereset password'),
  })

  const toggleAktifMutation = useMutation({
    mutationFn: ({ id, aktif }: { id: string; aktif: boolean }) => usersApi.update(id, { aktif }),
    onSuccess: (_, { aktif }) => { qc.invalidateQueries({ queryKey: [USERS_KEY] }); toast.success(`Pengguna berhasil ${aktif ? 'diaktifkan' : 'dinonaktifkan'}`) },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Gagal mengubah status pengguna'),
  })

  function closeForm() {
    setFormOpen(false); setEditUser(null); setForm(EMPTY_FORM); setFormErrors({})
  }

  function handleEdit(user: User) {
    setEditUser(user)
    setForm({ nama: user.nama, email: user.email, password: '', role: user.role, cabangId: user.cabangId ?? '' })
    setFormErrors({})
    setFormOpen(true)
  }

  function handleSortingChange(updater: SortingState | ((prev: SortingState) => SortingState)) {
    const next = typeof updater === 'function' ? updater(sorting) : updater
    setSorting(next)
    setPage(1)
  }

  // Cabang options available in the form:
  // superadmin → all cabang; admin → only their own cabang
  const cabangOptions = isSuperadmin
    ? cabangList
    : cabangList.filter((c) => c.id === currentUser?.cabangId)

  // Filter cabang sesuai role yang dipilih (kasir → toko, staf_gudang → gudang)
  const allowedTipes = ROLE_TIPE_CABANG[form.role] ?? null
  const cabangOptionsForRole = allowedTipes
    ? cabangOptions.filter((c) => allowedTipes.includes(c.tipe))
    : cabangOptions

  // Role options: superadmin cannot be created from this form (system-level)
  const roleOptions = ALL_ROLE_OPTIONS

  const roleNeedsCabang = (role: string) => role !== 'superadmin'

  function validate(): boolean {
    const errors: Partial<UserFormData> = {}
    if (!form.nama.trim()) errors.nama = 'Nama wajib diisi'
    if (!form.email.trim()) errors.email = 'Email wajib diisi'
    if (!editUser && !form.password.trim()) errors.password = 'Password wajib diisi untuk pengguna baru'
    if (!editUser && form.password.trim() && form.password.length < 8) errors.password = 'Password minimal 8 karakter'
    if (!form.role) errors.role = 'Role wajib dipilih'
    if (roleNeedsCabang(form.role) && !form.cabangId) errors.cabangId = 'Cabang wajib dipilih'
    if (roleNeedsCabang(form.role) && form.cabangId) {
      const selectedCabang = cabangList.find((c) => c.id === form.cabangId)
      const tipeAllowed = ROLE_TIPE_CABANG[form.role]
      if (selectedCabang && tipeAllowed && !tipeAllowed.includes(selectedCabang.tipe)) {
        const tipeLabel = tipeAllowed.map((t) => (t === 'toko' ? 'Toko' : 'Gudang')).join(' atau ')
        errors.cabangId = `Role ini hanya dapat ditempatkan di cabang ${tipeLabel}`
      }
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const cabangId = roleNeedsCabang(form.role) ? form.cabangId : null
    if (editUser) {
      await updateMutation.mutateAsync({ id: editUser.id, data: { nama: form.nama, role: form.role, cabangId } })
    } else {
      await createMutation.mutateAsync({ nama: form.nama, email: form.email, password: form.password, role: form.role, cabangId })
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'nama',
      header: 'Nama',
      cell: ({ getValue }) => <span className="font-semibold text-gray-900">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => <span className="text-gray-600">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => {
        const role = getValue<UserRole>()
        return <Badge variant={roleBadgeVariant(role)}>{roleLabel(role)}</Badge>
      },
    },
    {
      accessorKey: 'cabang',
      header: 'Cabang',
      cell: ({ getValue }) => {
        const val = getValue<string | null>()
        return <span className="text-gray-700">{val ?? <span className="text-gray-400">—</span>}</span>
      },
    },
    {
      accessorKey: 'aktif',
      header: 'Status',
      cell: ({ getValue }) => {
        const aktif = getValue<boolean>()
        return <Badge variant={aktif ? 'success' : 'default'}>{aktif ? 'Aktif' : 'Nonaktif'}</Badge>
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Dibuat',
      cell: ({ getValue }) => <span className="whitespace-nowrap text-gray-500">{formatTanggal(getValue<string>())}</span>,
    },
    {
      id: 'aksi',
      header: '',
      cell: ({ row }) => {
        const u = row.original
        return (
          <TableActionMenu
            items={[
              {
                label: 'Edit Pengguna',
                onClick: () => handleEdit(u),
              },
              {
                label: 'Reset Password',
                onClick: () => { setResetPasswordUser(u); setNewPassword('') },
              },
              {
                label: u.aktif ? 'Nonaktifkan' : 'Aktifkan',
                onClick: () => toggleAktifMutation.mutate({ id: u.id, aktif: !u.aktif }),
              },
              {
                label: 'Hapus',
                onClick: () => setDeleteUser(u),
                variant: 'danger',
                separator: true,
              },
            ]}
          />
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        subtitle={isSuperadmin ? `${data?.meta.total ?? 0} pengguna di semua cabang` : `Pengguna di ${currentUser?.cabang ?? 'cabang Anda'}`}
        actions={
          <Button onClick={() => { setEditUser(null); setForm(EMPTY_FORM); setFormErrors({}); setFormOpen(true) }}>
            <Plus className="h-4 w-4" />
            Tambah Pengguna
          </Button>
        }
      />

      <Card>
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <SearchInput
              value={search}
              onChange={(val) => { setSearch(val); setPage(1) }}
              placeholder="Cari nama atau email..."
              className="w-full sm:w-72"
            />
          </div>

          <DataTable
            columns={columns}
            data={data?.data ?? []}
            loading={isLoading}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            emptyText="Belum ada pengguna"
          />

          {data && data.meta.total > 0 && (
            <Pagination
              page={page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1) }}
            />
          )}
        </div>
      </Card>

      {/* Form Modal */}
      <Modal open={formOpen} onClose={closeForm} title={editUser ? 'Edit Pengguna' : 'Tambah Pengguna'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nama" required value={form.nama}
            onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
            error={formErrors.nama} placeholder="Nama lengkap" />
          <Input label="Email" required type="email" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={formErrors.email} placeholder="email@example.com" disabled={!!editUser} />
          {!editUser && (
            <Input label="Password" required type="password" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              error={formErrors.password} placeholder="Minimal 8 karakter" />
          )}
          <Select label="Role" required value={form.role}
            onChange={(e) => {
              const newRole = e.target.value
              const newAllowedTipes = ROLE_TIPE_CABANG[newRole] ?? null
              const currentCabang = cabangList.find((c) => c.id === form.cabangId)
              const cabangStillValid = !newAllowedTipes || (currentCabang && newAllowedTipes.includes(currentCabang.tipe))
              setForm((f) => ({ ...f, role: newRole, cabangId: cabangStillValid ? f.cabangId : '' }))
              setFormErrors((fe) => ({ ...fe, cabangId: undefined }))
            }}
            options={roleOptions} error={formErrors.role} />
          {roleNeedsCabang(form.role) && (
            <Combobox<Cabang>
              label="Cabang"
              required
              options={cabangOptionsForRole}
              value={form.cabangId}
              onChange={(id) => setForm((f) => ({ ...f, cabangId: id }))}
              getOptionValue={(c) => c.id}
              getOptionLabel={(c) => c.nama}
              filterFn={(c, q) =>
                c.nama.toLowerCase().includes(q.toLowerCase()) ||
                c.lokasi.toLowerCase().includes(q.toLowerCase())
              }
              renderOption={(c) => (
                <div className="flex items-center justify-between">
                  <span>{c.nama}</span>
                  <span className="text-xs text-gray-400">{c.tipe === 'toko' ? 'Toko' : 'Gudang'} · {c.lokasi}</span>
                </div>
              )}
              placeholder="Pilih cabang..."
              error={formErrors.cabangId}
            />
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeForm}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={!!resetPasswordUser}
        onClose={() => { setResetPasswordUser(null); setNewPassword('') }}
        title="Reset Password"
        description={`Reset password untuk ${resetPasswordUser?.nama}`}
        size="sm"
      >
        <form onSubmit={async (e) => { e.preventDefault(); if (!resetPasswordUser || newPassword.length < 8) return; await resetPasswordMutation.mutateAsync({ id: resetPasswordUser.id, passwordBaru: newPassword }) }} className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>Password baru akan langsung aktif. Pastikan pengguna telah diberitahu.</p>
          </div>
          <Input label="Password Baru" required type="password" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 8 karakter" />
          {newPassword.length > 0 && newPassword.length < 8 && (
            <p className="text-xs text-red-500">Password minimal 8 karakter</p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => { setResetPasswordUser(null); setNewPassword('') }}>Batal</Button>
            <Button type="submit" loading={resetPasswordMutation.isPending} disabled={newPassword.length < 8}>Reset Password</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
        title="Hapus Pengguna"
        description={`Anda yakin ingin menghapus pengguna "${deleteUser?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
