'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Plus, ShieldAlert } from 'lucide-react'
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
import { usersApi, type CreateUserDto, type UpdateUserDto } from '@/lib/api'
import { formatTanggal } from '@/lib/utils'
import type { User, UserRole } from '@/types'

const USERS_KEY = 'users'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manajer', label: 'Manajer' },
  { value: 'kasir', label: 'Kasir' },
  { value: 'staf_gudang', label: 'Staf Gudang' },
]

function roleBadgeVariant(role: UserRole) {
  switch (role) {
    case 'admin':
      return 'danger'
    case 'manajer':
      return 'info'
    case 'kasir':
      return 'success'
    case 'staf_gudang':
      return 'warning'
    default:
      return 'default'
  }
}

function roleLabel(role: UserRole) {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'manajer':
      return 'Manajer'
    case 'kasir':
      return 'Kasir'
    case 'staf_gudang':
      return 'Staf Gudang'
    default:
      return role
  }
}

interface UserFormData {
  nama: string
  email: string
  password: string
  role: string
  cabang: string
}

const EMPTY_FORM: UserFormData = {
  nama: '',
  email: '',
  password: '',
  role: 'kasir',
  cabang: '',
}

interface ActionMenuProps {
  user: User
  onEdit: (u: User) => void
  onResetPassword: (u: User) => void
  onToggleAktif: (u: User) => void
  onDelete: (u: User) => void
}

function ActionMenu({ user, onEdit, onResetPassword, onToggleAktif, onDelete }: ActionMenuProps) {
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
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="py-1">
              <button
                onClick={() => {
                  setOpen(false)
                  onEdit(user)
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Edit Pengguna
              </button>
              <button
                onClick={() => {
                  setOpen(false)
                  onResetPassword(user)
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Reset Password
              </button>
              <button
                onClick={() => {
                  setOpen(false)
                  onToggleAktif(user)
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                {user.aktif ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => {
                  setOpen(false)
                  onDelete(user)
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Hapus
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function PenggunaPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')

  // Modals
  const [formOpen, setFormOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const [form, setForm] = useState<UserFormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({})

  const { data, isLoading } = useQuery({
    queryKey: [USERS_KEY, { page, limit, search, sorting }],
    queryFn: () =>
      usersApi.getAll({
        page,
        limit,
        search: search || undefined,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const createMutation = useMutation({
    mutationFn: (dto: CreateUserDto) => usersApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success('Pengguna berhasil ditambahkan')
      closeForm()
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menambahkan pengguna')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success('Pengguna berhasil diperbarui')
      closeForm()
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui pengguna')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success('Pengguna berhasil dihapus')
      setDeleteUser(null)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus pengguna')
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, passwordBaru }: { id: string; passwordBaru: string }) =>
      usersApi.resetPassword(id, passwordBaru),
    onSuccess: () => {
      toast.success('Password berhasil direset')
      setResetPasswordUser(null)
      setNewPassword('')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal mereset password')
    },
  })

  const toggleAktifMutation = useMutation({
    mutationFn: ({ id, aktif }: { id: string; aktif: boolean }) =>
      usersApi.update(id, { aktif }),
    onSuccess: (_, { aktif }) => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success(`Pengguna berhasil ${aktif ? 'diaktifkan' : 'dinonaktifkan'}`)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal mengubah status pengguna')
    },
  })

  const closeForm = () => {
    setFormOpen(false)
    setEditUser(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
  }

  const handleEdit = (user: User) => {
    setEditUser(user)
    setForm({
      nama: user.nama,
      email: user.email,
      password: '',
      role: user.role,
      cabang: user.cabang,
    })
    setFormErrors({})
    setFormOpen(true)
  }

  const handleSortingChange = (
    updater: SortingState | ((prev: SortingState) => SortingState)
  ) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater
    setSorting(next)
    setPage(1)
  }

  const validate = (): boolean => {
    const errors: Partial<UserFormData> = {}
    if (!form.nama.trim()) errors.nama = 'Nama wajib diisi'
    if (!form.email.trim()) errors.email = 'Email wajib diisi'
    if (!editUser && !form.password.trim()) errors.password = 'Password wajib diisi untuk pengguna baru'
    if (!form.role) errors.role = 'Role wajib dipilih'
    if (!form.cabang.trim()) errors.cabang = 'Cabang wajib diisi'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (editUser) {
      await updateMutation.mutateAsync({
        id: editUser.id,
        data: { nama: form.nama, role: form.role, cabang: form.cabang },
      })
    } else {
      await createMutation.mutateAsync({
        nama: form.nama,
        email: form.email,
        password: form.password,
        role: form.role,
        cabang: form.cabang,
      })
    }
  }

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetPasswordUser || !newPassword.trim()) return
    await resetPasswordMutation.mutateAsync({
      id: resetPasswordUser.id,
      passwordBaru: newPassword,
    })
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'nama',
      header: 'Nama',
      cell: ({ getValue }) => (
        <span className="font-semibold text-gray-900">{getValue<string>()}</span>
      ),
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
      cell: ({ getValue }) => <span className="text-gray-700">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'aktif',
      header: 'Status',
      cell: ({ getValue }) => {
        const aktif = getValue<boolean>()
        return (
          <Badge variant={aktif ? 'success' : 'default'}>
            {aktif ? 'Aktif' : 'Nonaktif'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Dibuat',
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap text-gray-500">{formatTanggal(getValue<string>())}</span>
      ),
    },
    {
      id: 'aksi',
      header: '',
      cell: ({ row }) => (
        <ActionMenu
          user={row.original}
          onEdit={handleEdit}
          onResetPassword={(u) => {
            setResetPasswordUser(u)
            setNewPassword('')
          }}
          onToggleAktif={(u) =>
            toggleAktifMutation.mutate({ id: u.id, aktif: !u.aktif })
          }
          onDelete={(u) => setDeleteUser(u)}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        subtitle={`${data?.meta.total ?? 0} pengguna terdaftar`}
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
              onChange={(val) => {
                setSearch(val)
                setPage(1)
              }}
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
              onLimitChange={(l) => {
                setLimit(l)
                setPage(1)
              }}
            />
          )}
        </div>
      </Card>

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama"
            required
            value={form.nama}
            onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
            error={formErrors.nama}
            placeholder="Nama lengkap"
          />
          <Input
            label="Email"
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={formErrors.email}
            placeholder="email@example.com"
            disabled={!!editUser}
          />
          {!editUser && (
            <Input
              label="Password"
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              error={formErrors.password}
              placeholder="Minimal 8 karakter"
            />
          )}
          <Select
            label="Role"
            required
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            options={ROLE_OPTIONS}
            error={formErrors.role}
          />
          <Input
            label="Cabang"
            required
            value={form.cabang}
            onChange={(e) => setForm((f) => ({ ...f, cabang: e.target.value }))}
            error={formErrors.cabang}
            placeholder="Nama cabang"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeForm}>
              Batal
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={!!resetPasswordUser}
        onClose={() => {
          setResetPasswordUser(null)
          setNewPassword('')
        }}
        title="Reset Password"
        description={`Reset password untuk ${resetPasswordUser?.nama}`}
        size="sm"
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>Password baru akan langsung aktif. Pastikan pengguna telah diberitahu.</p>
          </div>
          <Input
            label="Password Baru"
            required
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
          />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setResetPasswordUser(null)
                setNewPassword('')
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={resetPasswordMutation.isPending}
              disabled={!newPassword.trim()}
            >
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
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
