import { api } from './axios'
import { normalizeKategori } from '@/lib/categories'
import { getDemoStores, getDemoProducts, getDemoDenah } from '@/lib/demo/data'
import type { Denah } from '@tanigo/types'
import type { KioskStore, KioskProduct } from '@/types'

// ── Config ───────────────────────────────────────────────────────────────────
// The kiosk reads from public endpoints. Until the backend ships them (see
// docs/spec-backend-kiosk-public-api.md), USE_DEMO keeps the app fully working.
// Force demo via NEXT_PUBLIC_KIOSK_DEMO=true, otherwise we attempt the real API
// and gracefully fall back to demo data on any failure.
const FORCE_DEMO = process.env.NEXT_PUBLIC_KIOSK_DEMO === 'true'

// ── Stores ───────────────────────────────────────────────────────────────────

interface RawStore {
  id: string
  nama: string
  lokasi?: string | null
  telepon?: string | null
}

function unwrap<T>(data: unknown): T {
  const d = data as { data?: { data?: T } } | { data?: T } | T
  // backend envelope is { data: ... } and sometimes { data: { data: ... } }
  const lvl1 = (d as { data?: unknown })?.data
  const lvl2 = (lvl1 as { data?: unknown })?.data
  return (lvl2 ?? lvl1 ?? d) as T
}

export async function fetchStores(): Promise<KioskStore[]> {
  if (FORCE_DEMO) return getDemoStores()
  try {
    const { data } = await api.get('/public/cabang', { params: { tipe: 'toko' } })
    const raw = unwrap<RawStore[]>(data)
    if (!Array.isArray(raw) || raw.length === 0) return getDemoStores()
    return raw.map((s) => ({
      id: s.id,
      nama: s.nama,
      lokasi: s.lokasi ?? '',
      telepon: s.telepon ?? '',
    }))
  } catch {
    return getDemoStores()
  }
}

// ── Products ─────────────────────────────────────────────────────────────────

interface RawProduct {
  id: string
  produkId?: string
  nama?: string
  produkNama?: string
  sku?: string
  produkSku?: string
  kategori?: string | null
  satuan?: string | null
  harga?: number
  hargaJual?: number
  stok?: number
  foto?: string | null
  deskripsi?: string | null
  lokasiRak?: string | null
  lorong?: string | null
  updatedAt?: string
}

function mapProduct(r: RawProduct): KioskProduct {
  return {
    id: r.id ?? r.produkId ?? '',
    nama: r.produkNama ?? r.nama ?? '',
    sku: r.produkSku ?? r.sku ?? '',
    kategori: normalizeKategori(r.kategori),
    satuan: r.satuan ?? 'pcs',
    harga: r.hargaJual ?? r.harga ?? 0,
    stok: r.stok ?? 0,
    foto: r.foto ?? null,
    deskripsi: r.deskripsi ?? null,
    lokasiRak: r.lokasiRak ?? null,
    lorong: r.lorong ?? null,
    updatedAt: r.updatedAt ?? new Date().toISOString(),
  }
}

export async function fetchProducts(storeId: string): Promise<KioskProduct[]> {
  if (FORCE_DEMO) return getDemoProducts(storeId)
  try {
    const { data } = await api.get('/public/cabang-inventory', { params: { cabangId: storeId } })
    const raw = unwrap<RawProduct[]>(data)
    if (!Array.isArray(raw)) return getDemoProducts(storeId)
    return raw.map(mapProduct)
  } catch {
    return getDemoProducts(storeId)
  }
}

// ── Denah (floor plan) ───────────────────────────────────────────────────────

export async function fetchDenah(storeId: string): Promise<Denah> {
  if (FORCE_DEMO) return getDemoDenah(storeId)
  try {
    const { data } = await api.get('/public/denah', { params: { cabangId: storeId } })
    const raw = unwrap<Denah>(data)
    // A store with no configured layout yet → fall back to the derived demo plan
    // so the map view always shows something useful.
    if (!raw || !Array.isArray(raw.elemen) || raw.elemen.length === 0) return getDemoDenah(storeId)
    return raw
  } catch {
    return getDemoDenah(storeId)
  }
}
