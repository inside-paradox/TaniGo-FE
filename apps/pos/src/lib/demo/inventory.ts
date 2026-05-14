// POS demo inventory — mirrors CabangInventory with hargaJual added for POS use
// In production, the API /cabang-inventory endpoint returns this enriched shape.

export interface POSInventoryItem {
  id: string
  cabangId: string
  produkId: string
  produkNama: string
  produkSku: string
  satuan: string
  stok: number
  hargaJual: number
  updatedAt: string
}

// Demo inventory for toko-1 (the demo kasir's branch)
const TOKO_1_INVENTORY: POSInventoryItem[] = [
  {
    id: 'ci-t1-p1', cabangId: 'toko-1', produkId: 'p-1',
    produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', satuan: 'karung',
    stok: 20, hargaJual: 110000, updatedAt: new Date().toISOString(),
  },
  {
    id: 'ci-t1-p3', cabangId: 'toko-1', produkId: 'p-3',
    produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', satuan: 'botol',
    stok: 10, hargaJual: 75000, updatedAt: new Date().toISOString(),
  },
  {
    id: 'ci-t1-p6', cabangId: 'toko-1', produkId: 'p-6',
    produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', satuan: 'karung',
    stok: 25, hargaJual: 35000, updatedAt: new Date().toISOString(),
  },
  {
    id: 'ci-t1-p2', cabangId: 'toko-1', produkId: 'p-2',
    produkNama: 'Pupuk NPK Mutiara', produkSku: 'PUP-002', satuan: 'kg',
    stok: 5, hargaJual: 16000, updatedAt: new Date().toISOString(),
  },
  {
    id: 'ci-t1-p5', cabangId: 'toko-1', produkId: 'p-5',
    produkNama: 'Sprayer Manual 16L', produkSku: 'ALT-001', satuan: 'unit',
    stok: 3, hargaJual: 175000, updatedAt: new Date().toISOString(),
  },
  {
    id: 'ci-t1-p4', cabangId: 'toko-1', produkId: 'p-4',
    produkNama: 'Benih Padi IR64', produkSku: 'BEN-001', satuan: 'kg',
    stok: 0, hargaJual: 22000, updatedAt: new Date().toISOString(),
  },
]

const DEMO_INVENTORY: Record<string, POSInventoryItem[]> = {
  'toko-1': TOKO_1_INVENTORY,
}

export function getDemoInventory(cabangId: string): POSInventoryItem[] {
  return DEMO_INVENTORY[cabangId] ?? TOKO_1_INVENTORY
}

export function searchDemoInventory(
  cabangId: string,
  search: string,
): POSInventoryItem[] {
  const inventory = getDemoInventory(cabangId)
  if (!search.trim()) return inventory

  const q = search.toLowerCase()
  return inventory.filter(
    (item) =>
      item.produkNama.toLowerCase().includes(q) ||
      item.produkSku.toLowerCase().includes(q)
  )
}
