'use client'

import { useState } from 'react'
import { Plus, Trash2, Bell, BellOff, Check } from 'lucide-react'
import { cn, formatTanggalWaktu } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useAuthStore } from '@/store/auth-store'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useCreateNotifikasi,
  useDeleteNotifikasi,
} from '@/hooks/use-notifications'
import type { TipeNotifikasi, Notifikasi } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPE_OPTIONS: { value: TipeNotifikasi; label: string }[] = [
  { value: 'info', label: 'Info' },
  { value: 'peringatan', label: 'Peringatan' },
  { value: 'penting', label: 'Penting' },
]

const TIPE_STYLE: Record<TipeNotifikasi, { dot: string; badge: 'info' | 'warning' | 'danger' }> = {
  info:       { dot: 'bg-blue-500',   badge: 'info' },
  peringatan: { dot: 'bg-orange-500', badge: 'warning' },
  penting:    { dot: 'bg-red-500',    badge: 'danger' },
}

const TIPE_LABEL: Record<TipeNotifikasi, string> = {
  info: 'Info',
  peringatan: 'Peringatan',
  penting: 'Penting',
}

const ROLE_OPTIONS = [
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'admin', label: 'Admin' },
  { value: 'manajer', label: 'Manajer' },
  { value: 'kasir', label: 'Kasir' },
  { value: 'staf_gudang', label: 'Staf Gudang' },
]

const CABANG_OPTIONS = [
  { value: 'toko-1', label: 'Toko Utama' },
  { value: 'toko-2', label: 'Toko Selatan' },
  { value: 'toko-3', label: 'Toko Barat' },
  { value: 'toko-4', label: 'Toko Timur' },
  { value: 'gudang-1', label: 'Gudang Pusat' },
  { value: 'gudang-2', label: 'Gudang Utara' },
]

// ─── Tab filter ───────────────────────────────────────────────────────────────

type TabFilter = 'semua' | 'belum_dibaca'

// ─── Create form state ────────────────────────────────────────────────────────

interface CreateForm {
  judul: string
  pesan: string
  tipe: TipeNotifikasi
  targetCabangMode: 'semua' | 'pilih'
  targetCabangIds: string[]
  targetRoleMode: 'semua' | 'pilih'
  targetRoleIds: string[]
}

const defaultForm = (): CreateForm => ({
  judul: '',
  pesan: '',
  tipe: 'info',
  targetCabangMode: 'semua',
  targetCabangIds: [],
  targetRoleMode: 'semua',
  targetRoleIds: [],
})

// ─── Helper components ────────────────────────────────────────────────────────

function CheckboxGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
        >
          <input
            type="checkbox"
            checked={value.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="h-4 w-4 rounded text-green-600"
          />
          <span className="text-gray-700">{opt.label}</span>
        </label>
      ))}
    </div>
  )
}

function TargetInfo({ notif }: { notif: Notifikasi }) {
  const cabang =
    notif.targetCabang === 'semua'
      ? 'Semua Cabang'
      : notif.targetCabang
          .map((id) => CABANG_OPTIONS.find((c) => c.value === id)?.label ?? id)
          .join(', ')

  const role =
    notif.targetRole === 'semua'
      ? 'Semua Role'
      : notif.targetRole
          .map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r)
          .join(', ')

  return (
    <span className="text-xs text-gray-400">
      {cabang} · {role}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotifikasiPage() {
  const user = useAuthStore((s) => s.user)
  const isSuperadmin = user?.role === 'superadmin'

  const [tab, setTab] = useState<TabFilter>('semua')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Notifikasi | null>(null)
  const [form, setForm] = useState<CreateForm>(defaultForm())

  const { data: notifikasi = [], isLoading } = useNotifications()
  const { mutate: markAsRead } = useMarkAsRead()
  const { mutate: markAll, isPending: markingAll } = useMarkAllAsRead()
  const { mutate: create, isPending: creating } = useCreateNotifikasi()
  const { mutate: deleteNotif, isPending: deleting } = useDeleteNotifikasi()

  // ── Filter ──
  const filtered = tab === 'belum_dibaca'
    ? notifikasi.filter((n) => user && !n.readByUserIds.includes(user.id))
    : notifikasi

  const unreadCount = user
    ? notifikasi.filter((n) => !n.readByUserIds.includes(user.id)).length
    : 0

  // ── Handlers ──
  const handleCardClick = (n: Notifikasi) => {
    if (user && !n.readByUserIds.includes(user.id)) {
      markAsRead(n.id)
    }
  }

  const handleCreate = () => {
    const dto = {
      judul: form.judul.trim(),
      pesan: form.pesan.trim(),
      tipe: form.tipe,
      targetCabang:
        form.targetCabangMode === 'semua' ? ('semua' as const) : form.targetCabangIds,
      targetRole:
        form.targetRoleMode === 'semua' ? ('semua' as const) : form.targetRoleIds,
    }
    create(dto, {
      onSuccess: () => {
        setCreateOpen(false)
        setForm(defaultForm())
      },
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteNotif(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
  }

  const formValid =
    form.judul.trim().length > 0 &&
    form.pesan.trim().length > 0 &&
    (form.targetCabangMode === 'semua' || form.targetCabangIds.length > 0) &&
    (form.targetRoleMode === 'semua' || form.targetRoleIds.length > 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifikasi"
        subtitle={unreadCount > 0 ? `${unreadCount} belum dibaca` : undefined}
        actions={
          isSuperadmin ? (
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="h-4 w-4" />
              Buat Notifikasi
            </Button>
          ) : undefined
        }
      />

      {/* Tabs + Mark all */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {[
            { id: 'semua' as TabFilter, label: 'Semua' },
            { id: 'belum_dibaca' as TabFilter, label: 'Belum Dibaca' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {t.label}
              {t.id === 'belum_dibaca' && unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAll()}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center">
          {tab === 'belum_dibaca' ? (
            <>
              <BellOff className="mb-3 h-10 w-10 text-gray-300" />
              <p className="font-medium text-gray-500">Semua notifikasi sudah dibaca</p>
            </>
          ) : (
            <>
              <Bell className="mb-3 h-10 w-10 text-gray-300" />
              <p className="font-medium text-gray-500">Belum ada notifikasi</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const unread = user ? !n.readByUserIds.includes(user.id) : false
            const style = TIPE_STYLE[n.tipe] ?? TIPE_STYLE.info
            return (
              <div
                key={n.id}
                onClick={() => handleCardClick(n)}
                className={cn(
                  'group relative flex gap-4 rounded-xl border p-4 transition-all cursor-pointer',
                  unread
                    ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                )}
              >
                {/* Tipe dot */}
                <div className="mt-1 flex-shrink-0">
                  <div className={cn('h-3 w-3 rounded-full', style.dot, !unread && 'opacity-40')} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={style.badge}>{TIPE_LABEL[n.tipe]}</Badge>
                      <p className={cn('text-sm', unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>
                        {n.judul}
                      </p>
                      {unread && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatTanggalWaktu(n.createdAt)}
                      </span>
                      {isSuperadmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget(n)
                          }}
                          className="invisible rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 group-hover:visible"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">{n.pesan}</p>

                  <div className="mt-2 flex items-center gap-3">
                    <TargetInfo notif={n} />
                    <span className="text-xs text-gray-400">· oleh {n.createdByNama}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create Modal ── */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setForm(defaultForm()) }}
        title="Buat Notifikasi"
        size="lg"
      >
        <div className="space-y-5">
          {/* Judul */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Judul <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.judul}
              onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
              placeholder="Judul notifikasi..."
              maxLength={120}
            />
          </div>

          {/* Pesan */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Pesan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.pesan}
              onChange={(e) => setForm((f) => ({ ...f, pesan: e.target.value }))}
              placeholder="Isi notifikasi..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Tipe */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipe</label>
            <Select
              value={form.tipe}
              onChange={(e) => setForm((f) => ({ ...f, tipe: e.target.value as TipeNotifikasi }))}
              options={TIPE_OPTIONS}
            />
          </div>

          {/* Target Cabang */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Target Cabang</label>
            <div className="mb-3 flex gap-3">
              {(['semua', 'pilih'] as const).map((mode) => (
                <label key={mode} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={form.targetCabangMode === mode}
                    onChange={() =>
                      setForm((f) => ({ ...f, targetCabangMode: mode, targetCabangIds: [] }))
                    }
                    className="text-green-600"
                  />
                  {mode === 'semua' ? 'Semua cabang' : 'Pilih cabang'}
                </label>
              ))}
            </div>
            {form.targetCabangMode === 'pilih' && (
              <CheckboxGroup
                options={CABANG_OPTIONS}
                value={form.targetCabangIds}
                onChange={(v) => setForm((f) => ({ ...f, targetCabangIds: v }))}
              />
            )}
          </div>

          {/* Target Role */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Target Role</label>
            <div className="mb-3 flex gap-3">
              {(['semua', 'pilih'] as const).map((mode) => (
                <label key={mode} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={form.targetRoleMode === mode}
                    onChange={() =>
                      setForm((f) => ({ ...f, targetRoleMode: mode, targetRoleIds: [] }))
                    }
                    className="text-green-600"
                  />
                  {mode === 'semua' ? 'Semua role' : 'Pilih role'}
                </label>
              ))}
            </div>
            {form.targetRoleMode === 'pilih' && (
              <CheckboxGroup
                options={ROLE_OPTIONS}
                value={form.targetRoleIds}
                onChange={(v) => setForm((f) => ({ ...f, targetRoleIds: v }))}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button
              variant="outline"
              onClick={() => { setCreateOpen(false); setForm(defaultForm()) }}
            >
              Batal
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formValid || creating}
            >
              {creating ? 'Mengirim...' : 'Kirim Notifikasi'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm ── */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Notifikasi"
        description={`Notifikasi "${deleteTarget?.judul}" akan dihapus permanen untuk semua pengguna.`}
        confirmLabel="Hapus"
        loading={deleting}
      />
    </div>
  )
}
