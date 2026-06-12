// ── Kiosk domain types ───────────────────────────────────────────────────────
// These describe the shape the kiosk needs from the public API. They are a
// read-only, customer-facing subset of the catalog + branch inventory.

/** A store (cabang bertipe "toko") that the kiosk can display. */
export interface KioskStore {
  id: string
  nama: string
  lokasi: string
  telepon: string
}

/** Canonical product categories shown in the kiosk UI. */
export type KioskKategori =
  | 'Benih'
  | 'Pupuk'
  | 'Pestisida'
  | 'Alat & Mesin'
  | 'Lainnya'

/**
 * A product as shown to the customer, already joined with branch inventory
 * (stok + price for the selected store) and catalog info (foto, deskripsi,
 * lokasi rak).
 */
export interface KioskProduct {
  id: string
  nama: string
  sku: string
  kategori: KioskKategori
  satuan: string
  harga: number
  stok: number
  foto: string | null
  deskripsi: string | null
  /** e.g. "Rak A3" */
  lokasiRak: string | null
  /** e.g. "Lorong 2" */
  lorong: string | null
  updatedAt: string
}
