'use client'

import { Filter, MapPin, X } from 'lucide-react'
import { SearchInput } from '@/components/shared/search-input'
import { useKategoriProduk } from '@/hooks/use-kategori'
import { useCabangList } from '@/hooks/use-cabang'
import type { StatusStok } from '@/types'

interface ProdukFilterState {
  search: string
  kategori: string
  statusStok: StatusStok | ''
  satuan: string
  lokasi: string
}

interface ProdukFilterProps {
  filter: ProdukFilterState
  onChange: (filter: ProdukFilterState) => void
}

const STATUS_STOK_OPTIONS: { value: StatusStok | ''; label: string }[] = [
  { value: '', label: 'Semua Status' },
  { value: 'normal', label: 'Normal' },
  { value: 'menipis', label: 'Menipis' },
  { value: 'habis', label: 'Habis' },
]

const hasActiveFilter = (filter: ProdukFilterState) =>
  filter.kategori !== '' || filter.statusStok !== '' || filter.satuan !== '' || filter.lokasi !== ''

export function ProdukFilter({ filter, onChange }: ProdukFilterProps) {
  const active = hasActiveFilter(filter)
  const { data: kategoriList = [] } = useKategoriProduk()
  const { data: cabangData } = useCabangList({ aktif: true })
  const lokasiList = cabangData?.data ?? []

  const resetFilter = () =>
    onChange({ ...filter, kategori: '', statusStok: '', satuan: '', lokasi: '' })

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        value={filter.search}
        onChange={(val) => onChange({ ...filter, search: val })}
        placeholder="Cari nama atau SKU produk..."
        className="w-full sm:w-64"
      />

      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-gray-400" />

        <select
          value={filter.lokasi}
          onChange={(e) => onChange({ ...filter, lokasi: e.target.value })}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-green-500 focus:outline-none"
        >
          <option value="">Semua Lokasi (Global)</option>
          {lokasiList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.tipe === 'gudang' ? 'Gudang' : 'Toko'} · {c.nama}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 shrink-0 text-gray-400" />

        <select
          value={filter.kategori}
          onChange={(e) => onChange({ ...filter, kategori: e.target.value })}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-green-500 focus:outline-none"
        >
          <option value="">Semua Kategori</option>
          {kategoriList.map((k) => (
            <option key={k.id} value={k.nama}>{k.nama}</option>
          ))}
        </select>

        <select
          value={filter.statusStok}
          onChange={(e) =>
            onChange({ ...filter, statusStok: e.target.value as StatusStok | '' })
          }
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-green-500 focus:outline-none"
        >
          {STATUS_STOK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {active && (
          <button
            onClick={resetFilter}
            className="flex h-10 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 text-sm text-red-600 hover:bg-red-100"
          >
            <X className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
