import type { Produk } from '@tanigo/types'
import type { PaginatedResponse } from '@tanigo/types'

export const DEMO_PRODUCTS: Produk[] = [
  {
    id: 'p1', nama: 'Pupuk Urea 50kg', sku: 'PUP-UREA-50', kategori: 'Pupuk',
    satuan: 'karung', hargaBeli: 220000, hargaJual: 265000, stok: 120,
    thresholdStok: 10, statusAktif: true, statusStok: 'normal',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p2', nama: 'Pupuk NPK Phonska 50kg', sku: 'PUP-NPK-50', kategori: 'Pupuk',
    satuan: 'karung', hargaBeli: 270000, hargaJual: 315000, stok: 85,
    thresholdStok: 10, statusAktif: true, statusStok: 'normal',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p3', nama: 'Benih Padi Ciherang 5kg', sku: 'BNH-PADI-5', kategori: 'Benih',
    satuan: 'kg', hargaBeli: 45000, hargaJual: 58000, stok: 200,
    thresholdStok: 20, statusAktif: true, statusStok: 'normal',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p4', nama: 'Benih Jagung Hibrida 1kg', sku: 'BNH-JGNG-1', kategori: 'Benih',
    satuan: 'kg', hargaBeli: 72000, hargaJual: 90000, stok: 50,
    thresholdStok: 10, statusAktif: true, statusStok: 'normal',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p5', nama: 'Pestisida Roundup 1 Liter', sku: 'PST-RUP-1L', kategori: 'Pestisida',
    satuan: 'liter', hargaBeli: 68000, hargaJual: 85000, stok: 30,
    thresholdStok: 5, statusAktif: true, statusStok: 'normal',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p6', nama: 'Insektisida Decis 100ml', sku: 'PST-DCS-100', kategori: 'Pestisida',
    satuan: 'pcs', hargaBeli: 32000, hargaJual: 42000, stok: 8,
    thresholdStok: 10, statusAktif: true, statusStok: 'menipis',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p7', nama: 'Cangkul Gagang Kayu', sku: 'ALT-CGK-01', kategori: 'Alat & Mesin',
    satuan: 'pcs', hargaBeli: 55000, hargaJual: 75000, stok: 0,
    thresholdStok: 3, statusAktif: true, statusStok: 'habis',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p8', nama: 'Selang Air 25 Meter', sku: 'ALT-SLG-25', kategori: 'Alat & Mesin',
    satuan: 'pcs', hargaBeli: 85000, hargaJual: 110000, stok: 15,
    thresholdStok: 5, statusAktif: true, statusStok: 'normal',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p9', nama: 'Pupuk Kandang Ayam 25kg', sku: 'PUP-KND-25', kategori: 'Pupuk',
    satuan: 'karung', hargaBeli: 28000, hargaJual: 38000, stok: 60,
    thresholdStok: 15, statusAktif: true, statusStok: 'normal',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p10', nama: 'Semprotan Punggung 16L', sku: 'ALT-SPR-16', kategori: 'Alat & Mesin',
    satuan: 'pcs', hargaBeli: 145000, hargaJual: 185000, stok: 7,
    thresholdStok: 3, statusAktif: true, statusStok: 'menipis',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p11', nama: 'Fungisida Antracol 500g', sku: 'PST-ANT-500', kategori: 'Pestisida',
    satuan: 'pcs', hargaBeli: 55000, hargaJual: 72000, stok: 25,
    thresholdStok: 5, statusAktif: true, statusStok: 'normal',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p12', nama: 'Benih Cabai Rawit 10g', sku: 'BNH-CBR-10', kategori: 'Benih',
    satuan: 'pcs', hargaBeli: 18000, hargaJual: 25000, stok: 100,
    thresholdStok: 20, statusAktif: true, statusStok: 'normal',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
]

export function searchDemoProducts(search: string, limit = 50): PaginatedResponse<Produk> {
  const q = search.toLowerCase().trim()
  const filtered = q
    ? DEMO_PRODUCTS.filter(
        (p) =>
          p.nama.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.kategori.toLowerCase().includes(q)
      )
    : DEMO_PRODUCTS

  const data = filtered.slice(0, limit)
  return {
    data,
    meta: { total: filtered.length, page: 1, limit, totalPages: 1 },
  }
}
