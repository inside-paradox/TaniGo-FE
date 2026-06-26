'use client'

import { useRef, useState } from 'react'
import { Combobox } from '@/components/ui/combobox'
import { useProducts } from '@/hooks/use-products'
import type { Produk } from '@/types'

interface ProdukComboboxProps {
  /** Supplier terpilih. Dropdown disabled selama kosong. */
  supplierId: string
  /** produkId terpilih saat ini. */
  value: string
  /** Label produk terpilih (mis. `[SKU] Nama`) — agar tetap tampil walau di luar halaman hasil. */
  selectedLabel?: string
  /** Dipanggil dengan objek produk (atau null saat dikosongkan). */
  onChange: (produk: Produk | null) => void
  error?: string
}

const DEBOUNCE_MS = 300

/**
 * Dropdown pencarian produk untuk Purchase Order.
 * - Dependent pada supplier: disabled sampai supplier dipilih, lalu hanya
 *   memuat produk yang berelasi dengan supplier tersebut.
 * - Server-side search dengan debounce, sehingga seluruh master data dapat
 *   ditelusuri tanpa memuat semua baris sekaligus (anti-truncation).
 */
export function ProdukCombobox({ supplierId, value, selectedLabel, onChange, error }: ProdukComboboxProps) {
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isFetching } = useProducts(
    { page: 1, limit: 50, supplierId, search: debouncedQuery || undefined },
    { enabled: !!supplierId }
  )
  const options = data?.data ?? []

  // Debounce di event handler (bukan effect) — selaras pola SearchInput & aman lint.
  function handleQueryChange(q: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedQuery(q.trim()), DEBOUNCE_MS)
  }

  return (
    <Combobox
      placeholder={supplierId ? 'Cari produk...' : 'Pilih supplier dulu'}
      disabled={!supplierId}
      options={options}
      value={value}
      selectedLabel={selectedLabel}
      onChange={(id) => onChange(options.find((p) => p.id === id) ?? null)}
      onQueryChange={handleQueryChange}
      loading={isFetching}
      getOptionValue={(p) => p.id}
      getOptionLabel={(p) => `[${p.sku}] ${p.nama}`}
      error={error}
    />
  )
}
