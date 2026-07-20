'use client'

import { useRef, useState } from 'react'
import { Combobox } from '@/components/ui/combobox'
import { useProducts } from '@/hooks/use-products'
import type { Produk } from '@/types'

interface TransferProdukComboboxProps {
  /** Gudang tujuan terpilih. Dropdown disabled selama kosong. */
  gudangId: string
  /** produkId terpilih saat ini. */
  value: string
  /** Label produk terpilih — agar tetap tampil walau di luar halaman hasil. */
  selectedLabel?: string
  /** Stok produk di gudang tujuan, dipakai untuk anotasi tiap opsi. */
  stokDiGudang: (produkId: string) => number
  /** Dipanggil dengan objek produk (atau null saat dikosongkan). */
  onChange: (produk: Produk | null) => void
  error?: string
}

const DEBOUNCE_MS = 300

/**
 * Dropdown pencarian produk untuk Permintaan Stok ke gudang.
 * - Dependent pada gudang tujuan: disabled sampai gudang dipilih, karena anotasi
 *   stok tiap opsi dihitung per gudang tersebut.
 * - Server-side search berdebounce dengan `statusAktif=true`, sehingga seluruh
 *   master data produk aktif dapat ditelusuri tanpa memuat semua baris sekaligus.
 *   Filter aktif sengaja tidak dilakukan di client: dengan pagination server hal
 *   itu akan melubangi tiap halaman hasil.
 */
export function TransferProdukCombobox({
  gudangId,
  value,
  selectedLabel,
  stokDiGudang,
  onChange,
  error,
}: TransferProdukComboboxProps) {
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isFetching } = useProducts(
    { page: 1, limit: 50, statusAktif: true, search: debouncedQuery || undefined },
    { enabled: !!gudangId }
  )
  const options = data?.data ?? []

  // Debounce di event handler (bukan effect) — selaras pola SearchInput & aman lint.
  function handleQueryChange(q: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedQuery(q.trim()), DEBOUNCE_MS)
  }

  return (
    <Combobox<Produk>
      placeholder={gudangId ? 'Cari produk...' : 'Pilih gudang tujuan dulu'}
      disabled={!gudangId}
      options={options}
      value={value}
      selectedLabel={selectedLabel}
      onChange={(id) => onChange(options.find((p) => p.id === id) ?? null)}
      onQueryChange={handleQueryChange}
      loading={isFetching}
      getOptionValue={(p) => p.id}
      getOptionLabel={(p) => p.nama}
      renderOption={(p) => {
        const stok = stokDiGudang(p.id)
        return (
          <div className="flex items-center justify-between">
            <div>
              <span>{p.nama}</span>
              <span className="ml-2 text-xs text-gray-500">{p.sku}</span>
            </div>
            <span className={`ml-4 shrink-0 text-xs ${stok > 0 ? 'text-gray-500' : 'text-red-500'}`}>
              Stok {stok} {p.satuan}
            </span>
          </div>
        )
      }}
      error={error}
    />
  )
}
