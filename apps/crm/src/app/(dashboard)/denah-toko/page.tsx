'use client'

import { useEffect, useState } from 'react'
import { Save, RotateCcw, Info, Store, Minus, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DenahCanvas } from '@/components/denah/denah-canvas'
import { ElemenDetailModal } from '@/components/denah/elemen-detail-modal'
import { ELEMEN_META } from '@/lib/denah-elemen'
import { useCabangList } from '@/hooks/use-cabang'
import { useDenah, useSaveDenah } from '@/hooks/use-denah'
import { useAuthStore } from '@/store/auth-store'
import type { ElemenDenah, TipeElemen } from '@/types'

const ELEMEN_ORDER: TipeElemen[] = ['rak', 'kasir', 'pintu', 'dinding']
const MAX_KOLOM = 32
const MAX_BARIS = 24

function newId() {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export default function DenahTokoPage() {
  const { user } = useAuthStore()
  const { data: cabangData } = useCabangList({ tipe: 'toko', aktif: true })
  const tokoList = cabangData?.data ?? []
  // The denah is dedicated to the manager's own store. Superadmin has no cabang,
  // so fall back to the first toko.
  const cabangId = user?.cabangId ?? tokoList[0]?.id ?? ''
  const cabangNama = user?.cabang ?? tokoList.find((c) => c.id === cabangId)?.nama ?? ''

  const { data: denah, isLoading } = useDenah(cabangId)
  const saveDenah = useSaveDenah()

  const [elemen, setElemen] = useState<ElemenDenah[]>([])
  const [kolom, setKolom] = useState(16)
  const [baris, setBaris] = useState(12)
  const [baseline, setBaseline] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Reset local editing state whenever a fresh plan loads (new branch or refetch).
  useEffect(() => {
    if (!denah) return
    setElemen(denah.elemen)
    setKolom(denah.kolom)
    setBaris(denah.baris)
    setBaseline(JSON.stringify({ kolom: denah.kolom, baris: denah.baris, elemen: denah.elemen }))
    setSelectedId(null)
  }, [denah])

  const current = JSON.stringify({ kolom, baris, elemen })
  const dirty = baseline !== '' && current !== baseline

  const selected = elemen.find((e) => e.id === selectedId) ?? null

  function addElement(tipe: TipeElemen) {
    const meta = ELEMEN_META[tipe]
    // Cascade new elements so they don't perfectly overlap.
    const offset = elemen.length % 6
    const el: ElemenDenah = {
      id: newId(),
      tipe,
      kode: tipe === 'rak' ? '' : meta.label,
      lorong: null,
      x: Math.min(offset, kolom - meta.defaultW),
      y: Math.min(offset, baris - meta.defaultH),
      w: meta.defaultW,
      h: meta.defaultH,
      warna: tipe === 'rak' ? 'gray' : null,
      produkIds: [],
    }
    setElemen((prev) => [...prev, el])
    setSelectedId(el.id)
  }

  function moveElement(id: string, x: number, y: number) {
    setElemen((prev) => prev.map((e) => (e.id === id ? { ...e, x, y } : e)))
  }

  function updateElement(id: string, patch: Partial<ElemenDenah>) {
    setElemen((prev) => prev.map((e) => (e.id === id ? clampElement({ ...e, ...patch }, kolom, baris) : e)))
  }

  function deleteElement(id: string) {
    setElemen((prev) => prev.filter((e) => e.id !== id))
    setSelectedId(null)
  }

  function discard() {
    if (!denah) return
    setElemen(denah.elemen)
    setKolom(denah.kolom)
    setBaris(denah.baris)
    setSelectedId(null)
  }

  function save() {
    if (!cabangId) return
    saveDenah.mutate(
      { cabangId, payload: { kolom, baris, elemen } },
      { onSuccess: () => setBaseline(JSON.stringify({ kolom, baris, elemen })) }
    )
  }

  // The grid can't shrink below the space the elements already occupy.
  const minKolom = elemen.reduce((m, e) => Math.max(m, e.x + e.w), 8)
  const minBaris = elemen.reduce((m, e) => Math.max(m, e.y + e.h), 6)

  const rakCount = elemen.filter((e) => e.tipe === 'rak').length
  const produkCount = elemen.reduce((n, e) => n + (e.tipe === 'rak' ? e.produkIds.length : 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Denah Toko"
        subtitle="Susun tata letak rak toko dan tetapkan produk di setiap rak. Layar kios pelanggan memakai denah ini untuk memandu lokasi produk."
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={discard} disabled={!dirty || saveDenah.isPending}>
              <RotateCcw className="h-4 w-4" />
              Batalkan
            </Button>
            <Button onClick={save} disabled={!dirty} loading={saveDenah.isPending}>
              <Save className="h-4 w-4" />
              Simpan Denah
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700">
          <Store className="h-4 w-4" />
          {cabangNama || 'Toko'}
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-500">{rakCount} rak</span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-500">{produkCount} penempatan produk</span>
        {dirty && <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">Belum disimpan</span>}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Tambah:</span>
          {ELEMEN_ORDER.map((tipe) => {
            const meta = ELEMEN_META[tipe]
            const Icon = meta.icon
            return (
              <Button key={tipe} variant="secondary" size="sm" onClick={() => addElement(tipe)}>
                <Icon className="h-4 w-4" />
                {meta.label}
              </Button>
            )
          })}
          <div className="ml-auto flex items-center gap-4">
            <GridSizeControl label="Kolom" value={kolom} min={minKolom} max={MAX_KOLOM} onChange={setKolom} />
            <GridSizeControl label="Baris" value={baris} min={minBaris} max={MAX_BARIS} onChange={setBaris} />
          </div>
        </div>

        <p className="mb-3 flex items-center gap-1.5 text-xs text-gray-400">
          <Info className="h-3.5 w-3.5" />
          Seret elemen untuk memindahkan, klik untuk mengatur isi & ukuran. Perbesar kanvas bila butuh ruang lebih.
        </p>

        {isLoading ? (
          <Skeleton className="h-[480px] w-full rounded-xl" />
        ) : (
          <DenahCanvas
            kolom={kolom}
            baris={baris}
            elemen={elemen}
            selectedId={selectedId}
            onMove={moveElement}
            onSelect={setSelectedId}
          />
        )}
      </div>

      {selected && (
        <ElemenDetailModal
          el={selected}
          maxW={kolom}
          maxH={baris}
          onUpdate={(patch) => updateElement(selected.id, patch)}
          onDelete={() => deleteElement(selected.id)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

function GridSizeControl({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums">{value}</span>
      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function clampElement(el: ElemenDenah, kolom: number, baris: number): ElemenDenah {
  const w = Math.max(1, Math.min(el.w, kolom))
  const h = Math.max(1, Math.min(el.h, baris))
  return {
    ...el,
    w,
    h,
    x: Math.max(0, Math.min(el.x, kolom - w)),
    y: Math.max(0, Math.min(el.y, baris - h)),
  }
}
