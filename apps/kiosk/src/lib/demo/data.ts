import type { Denah, ElemenDenah } from '@tanigo/types'
import type { KioskStore, KioskProduct } from '@/types'

// ── Demo data ────────────────────────────────────────────────────────────────
// Used when no public kiosk API is configured/reachable, so the app is fully
// functional for development and demos. Mirrors the shape the real public
// endpoints should return (see docs/spec-backend-kiosk-public-api.md).

export const DEMO_STORES: KioskStore[] = [
  { id: 'toko-bone-bone', nama: 'Tani Go Bone Bone', lokasi: 'Jl. Poros Bone Bone, Luwu Utara', telepon: '0812-1111-2222' },
  { id: 'toko-masamba', nama: 'Tani Go Masamba', lokasi: 'Jl. Andi Djemma No. 12, Masamba', telepon: '0813-3333-4444' },
  { id: 'toko-sukamaju', nama: 'Tani Go Sukamaju', lokasi: 'Jl. Trans Sulawesi, Sukamaju', telepon: '0852-5555-6666' },
]

const now = new Date().toISOString()

function p(
  id: string,
  nama: string,
  sku: string,
  kategori: KioskProduct['kategori'],
  satuan: string,
  harga: number,
  stok: number,
  lokasiRak: string | null,
  lorong: string | null,
  deskripsi: string | null,
): KioskProduct {
  return { id, nama, sku, kategori, satuan, harga, stok, foto: null, deskripsi, lokasiRak, lorong, updatedAt: now }
}

// Each store has its own inventory (different stok & prices).
const STORE_INVENTORY: Record<string, KioskProduct[]> = {
  'toko-bone-bone': [
    p('p-1', 'Pupuk Urea 50kg', 'PUP-001', 'Pupuk', 'karung', 110000, 24, 'Rak A1', 'Lorong 1', 'Pupuk nitrogen untuk mempercepat pertumbuhan daun dan batang tanaman padi.'),
    p('p-2', 'Pupuk NPK Mutiara 16-16-16', 'PUP-002', 'Pupuk', 'kg', 16000, 8, 'Rak A2', 'Lorong 1', 'Pupuk majemuk lengkap untuk masa pertumbuhan dan pembungaan.'),
    p('p-3', 'Pestisida Roundup 1L', 'PES-001', 'Pestisida', 'botol', 75000, 15, 'Rak B1', 'Lorong 2', 'Herbisida sistemik untuk mengendalikan gulma secara menyeluruh.'),
    p('p-4', 'Benih Padi IR64', 'BEN-001', 'Benih', 'kg', 22000, 0, 'Rak C1', 'Lorong 3', 'Benih padi unggul tahan hama, masa panen ±115 hari.'),
    p('p-5', 'Sprayer Manual 16L', 'ALT-001', 'Alat & Mesin', 'unit', 175000, 5, 'Rak D2', 'Lorong 4', 'Tangki semprot punggung kapasitas 16 liter dengan pompa manual.'),
    p('p-6', 'Pupuk Kandang Organik', 'PUP-003', 'Pupuk', 'karung', 35000, 30, 'Rak A3', 'Lorong 1', 'Pupuk organik dari kotoran ternak untuk menyuburkan tanah.'),
    p('p-7', 'Benih Jagung Hibrida', 'BEN-002', 'Benih', 'kg', 65000, 12, 'Rak C2', 'Lorong 3', 'Benih jagung hibrida produktivitas tinggi.'),
    p('p-8', 'Cangkul Baja', 'ALT-002', 'Alat & Mesin', 'unit', 85000, 7, 'Rak D1', 'Lorong 4', 'Cangkul baja tempa dengan gagang kayu jati.'),
    p('p-9', 'Insektisida Decis 100ml', 'PES-002', 'Pestisida', 'botol', 42000, 20, 'Rak B2', 'Lorong 2', 'Insektisida kontak untuk hama ulat dan kutu.'),
    p('p-10', 'Plastik Mulsa 50m', 'LAI-001', 'Lainnya', 'rol', 130000, 9, 'Rak E1', 'Lorong 5', 'Plastik mulsa perak hitam untuk menekan gulma dan menjaga kelembapan.'),
  ],
  'toko-masamba': [
    p('p-1', 'Pupuk Urea 50kg', 'PUP-001', 'Pupuk', 'karung', 112000, 10, 'Rak A1', 'Lorong 1', 'Pupuk nitrogen untuk mempercepat pertumbuhan daun dan batang tanaman padi.'),
    p('p-3', 'Pestisida Roundup 1L', 'PES-001', 'Pestisida', 'botol', 78000, 0, 'Rak B1', 'Lorong 2', 'Herbisida sistemik untuk mengendalikan gulma secara menyeluruh.'),
    p('p-4', 'Benih Padi IR64', 'BEN-001', 'Benih', 'kg', 23000, 40, 'Rak C1', 'Lorong 2', 'Benih padi unggul tahan hama, masa panen ±115 hari.'),
    p('p-5', 'Sprayer Manual 16L', 'ALT-001', 'Alat & Mesin', 'unit', 180000, 3, 'Rak D1', 'Lorong 3', 'Tangki semprot punggung kapasitas 16 liter dengan pompa manual.'),
    p('p-7', 'Benih Jagung Hibrida', 'BEN-002', 'Benih', 'kg', 64000, 18, 'Rak C2', 'Lorong 2', 'Benih jagung hibrida produktivitas tinggi.'),
    p('p-11', 'Pupuk KCl 50kg', 'PUP-004', 'Pupuk', 'karung', 145000, 14, 'Rak A2', 'Lorong 1', 'Pupuk kalium untuk memperkuat batang dan meningkatkan kualitas buah.'),
    p('p-12', 'Gunting Pangkas', 'ALT-003', 'Alat & Mesin', 'unit', 55000, 11, 'Rak D2', 'Lorong 3', 'Gunting pangkas tanaman dengan pegas dan kunci pengaman.'),
  ],
  'toko-sukamaju': [
    p('p-2', 'Pupuk NPK Mutiara 16-16-16', 'PUP-002', 'Pupuk', 'kg', 16500, 50, 'Rak A1', 'Lorong 1', 'Pupuk majemuk lengkap untuk masa pertumbuhan dan pembungaan.'),
    p('p-6', 'Pupuk Kandang Organik', 'PUP-003', 'Pupuk', 'karung', 34000, 22, 'Rak A2', 'Lorong 1', 'Pupuk organik dari kotoran ternak untuk menyuburkan tanah.'),
    p('p-9', 'Insektisida Decis 100ml', 'PES-002', 'Pestisida', 'botol', 41000, 0, 'Rak B1', 'Lorong 2', 'Insektisida kontak untuk hama ulat dan kutu.'),
    p('p-10', 'Plastik Mulsa 50m', 'LAI-001', 'Lainnya', 'rol', 128000, 6, 'Rak E1', 'Lorong 4', 'Plastik mulsa perak hitam untuk menekan gulma dan menjaga kelembapan.'),
    p('p-13', 'Benih Cabai Rawit', 'BEN-003', 'Benih', 'sachet', 18000, 35, 'Rak C1', 'Lorong 3', 'Benih cabai rawit tahan penyakit, cocok dataran rendah.'),
    p('p-14', 'Selang Irigasi 100m', 'LAI-002', 'Lainnya', 'rol', 210000, 4, 'Rak E2', 'Lorong 4', 'Selang irigasi tetes untuk penyiraman hemat air.'),
  ],
}

export function getDemoStores(): KioskStore[] {
  return DEMO_STORES
}

export function getDemoProducts(storeId: string): KioskProduct[] {
  return STORE_INVENTORY[storeId] ?? STORE_INVENTORY['toko-bone-bone']
}

// ── Demo floor plan ──────────────────────────────────────────────────────────
// Derived from each store's inventory so the kiosk map stays consistent with the
// product list: every distinct "lokasiRak" becomes a rack carrying its products,
// laid out row-by-row per lorong. Mirrors the shape of the real public denah API.

const KATEGORI_WARNA: Record<KioskProduct['kategori'], string> = {
  Benih: 'green',
  Pupuk: 'amber',
  Pestisida: 'red',
  'Alat & Mesin': 'blue',
  Lainnya: 'purple',
}

export function getDemoDenah(storeId: string): Denah {
  const products = STORE_INVENTORY[storeId] ?? STORE_INVENTORY['toko-bone-bone']

  // Group products by their rack code, preserving first-seen order.
  const racks = new Map<string, { lorong: string | null; kategori: KioskProduct['kategori']; ids: string[] }>()
  for (const p of products) {
    if (!p.lokasiRak) continue
    const entry = racks.get(p.lokasiRak)
    if (entry) entry.ids.push(p.id)
    else racks.set(p.lokasiRak, { lorong: p.lorong, kategori: p.kategori, ids: [p.id] })
  }

  // Order racks by lorong then code so each lorong forms one row band.
  const lorongs = [...new Set([...racks.values()].map((r) => r.lorong ?? ''))].sort()
  const kolom = 16
  const elemen: ElemenDenah[] = []

  lorongs.forEach((lorong, row) => {
    const inLorong = [...racks.entries()]
      .filter(([, r]) => (r.lorong ?? '') === lorong)
      .sort(([a], [b]) => a.localeCompare(b))
    inLorong.forEach(([kode, r], col) => {
      elemen.push({
        id: `el-${storeId}-${kode}`.replace(/\s+/g, '-'),
        tipe: 'rak',
        kode,
        lorong: r.lorong,
        x: Math.min(1 + col * 3, kolom - 2),
        y: 1 + row * 2,
        w: 2,
        h: 1,
        warna: KATEGORI_WARNA[r.kategori],
        produkIds: r.ids,
      })
    })
  })

  const baris = Math.max(8, lorongs.length * 2 + 3)
  elemen.push(
    { id: `el-${storeId}-pintu`, tipe: 'pintu', kode: 'Pintu Masuk', lorong: null, x: 1, y: baris - 2, w: 2, h: 1, warna: null, produkIds: [] },
    { id: `el-${storeId}-kasir`, tipe: 'kasir', kode: 'Kasir', lorong: null, x: kolom - 4, y: baris - 2, w: 3, h: 1, warna: null, produkIds: [] }
  )

  return { cabangId: storeId, kolom, baris, elemen, updatedAt: now }
}
