'use client'

import { useEffect, useState } from 'react'
import { Trash2, Search, Minus, Plus, Check } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ELEMEN_META, WARNA_RAK } from '@/lib/denah-elemen'
import { useProducts } from '@/hooks/use-products'
import type { ElemenDenah } from '@/types'

interface ElemenDetailModalProps {
  el: ElemenDenah
  maxW: number
  maxH: number
  onUpdate: (patch: Partial<ElemenDenah>) => void
  onDelete: () => void
  onClose: () => void
}

export function ElemenDetailModal({ el, maxW, maxH, onUpdate, onDelete, onClose }: ElemenDetailModalProps) {
  const meta = ELEMEN_META[el.tipe]
  const isRak = meta.isRak

  return (
    <Modal open onClose={onClose} title={`${meta.label}: ${el.kode || '—'}`} size={isRak ? 'xl' : 'md'}>
      <div className="max-h-[70vh] space-y-5 overflow-y-auto">
        <Input
          label="Kode / Label"
          value={el.kode}
          onChange={(e) => onUpdate({ kode: e.target.value })}
          placeholder={isRak ? 'mis. A1' : meta.label}
        />

        {isRak && (
          <Input
            label="Lorong (opsional)"
            value={el.lorong ?? ''}
            onChange={(e) => onUpdate({ lorong: e.target.value || null })}
            placeholder="mis. Lorong 1"
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <SizeStepper label="Lebar" value={el.w} min={1} max={maxW} onChange={(w) => onUpdate({ w })} />
          <SizeStepper label="Tinggi" value={el.h} min={1} max={maxH} onChange={(h) => onUpdate({ h })} />
        </div>

        {isRak && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Warna</p>
            <div className="flex flex-wrap gap-2">
              {WARNA_RAK.map((w) => (
                <button
                  key={w.key}
                  type="button"
                  onClick={() => onUpdate({ warna: w.key })}
                  title={w.label}
                  className={cn(
                    'flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium',
                    el.warna === w.key ? 'border-gray-800' : 'border-gray-200'
                  )}
                >
                  <span className={cn('h-4 w-4 rounded-full', w.dot)} />
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isRak && <ProdukAssign el={el} onUpdate={onUpdate} />}

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Hapus Elemen
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Selesai
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function SizeStepper({
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
    <div>
      <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center text-sm font-semibold">{value}</span>
        <Button variant="outline" size="icon" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ProdukAssign({ el, onUpdate }: { el: ElemenDenah; onUpdate: (patch: Partial<ElemenDenah>) => void }) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce so each keystroke doesn't hit the API.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  // Server-side search: the catalog has thousands of products across many pages,
  // so filtering only a client-loaded first page would hide most of them (the
  // original bug). Query the backend with the search term instead.
  const { data, isLoading, isFetching } = useProducts({
    page: 1,
    limit: 50,
    search: debouncedSearch || undefined,
  })
  const filtered = data?.data ?? []

  const selected = new Set(el.produkIds)

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onUpdate({ produkIds: [...next] })
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Produk di rak ini</p>
        <Badge variant="info">{el.produkIds.length} dipilih</Badge>
      </div>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk berdasarkan nama atau SKU…"
          className="pl-9"
        />
      </div>
      <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-1">
        {(isLoading || isFetching) && <p className="p-3 text-sm text-gray-400">Memuat produk…</p>}
        {!isLoading && !isFetching && filtered.length === 0 && (
          <p className="p-3 text-sm text-gray-400">
            {debouncedSearch ? 'Tidak ada produk yang cocok.' : 'Ketik untuk mencari produk.'}
          </p>
        )}
        {filtered.map((p) => {
          const isOn = selected.has(p.id)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors',
                isOn ? 'bg-green-50' : 'hover:bg-gray-50'
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                  isOn ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'
                )}
              >
                {isOn && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-gray-900">{p.nama}</span>
                <span className="block truncate text-xs text-gray-400">{p.sku} · {p.kategori}</span>
              </span>
            </button>
          )
        })}
      </div>
      {(data?.meta?.total ?? 0) > filtered.length && (
        <p className="mt-1.5 text-xs text-gray-400">
          Menampilkan {filtered.length} dari {data?.meta?.total} produk. Ketik kata kunci untuk mempersempit pencarian.
        </p>
      )}
    </div>
  )
}
