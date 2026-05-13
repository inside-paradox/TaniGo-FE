import type {
  Cabang,
  TransferStok,
  Pengiriman,
  User,
  Produk,
} from '@/types'

const now = new Date().toISOString()
const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString()

// ─── Cabang ───────────────────────────────────────────────────────────────────

export const mockCabang: Cabang[] = [
  { id: 'toko-1', nama: 'Toko Utama', tipe: 'toko', lokasi: 'Jakarta Selatan', aktif: true, createdAt: d(90), updatedAt: d(2) },
  { id: 'toko-2', nama: 'Toko Selatan', tipe: 'toko', lokasi: 'Depok', aktif: true, createdAt: d(60), updatedAt: d(5) },
  { id: 'toko-3', nama: 'Toko Barat', tipe: 'toko', lokasi: 'Tangerang', aktif: true, createdAt: d(45), updatedAt: d(1) },
  { id: 'toko-4', nama: 'Toko Timur', tipe: 'toko', lokasi: 'Bekasi', aktif: false, createdAt: d(30), updatedAt: d(10) },
  { id: 'gudang-1', nama: 'Gudang Pusat', tipe: 'gudang', lokasi: 'Cibitung, Bekasi', aktif: true, createdAt: d(120), updatedAt: d(1) },
  { id: 'gudang-2', nama: 'Gudang Utara', tipe: 'gudang', lokasi: 'Bogor', aktif: true, createdAt: d(80), updatedAt: d(3) },
]

// ─── Users ────────────────────────────────────────────────────────────────────

export const mockUsers: User[] = [
  { id: 'demo-superadmin', nama: 'Super Admin', email: 'superadmin@tanigo.id', role: 'superadmin', cabangId: null, cabang: null, tipeCabang: null, aktif: true, createdAt: d(120), updatedAt: now },
  { id: 'demo-admin', nama: 'Admin Demo', email: 'admin@tanigo.id', role: 'admin', cabangId: 'gudang-1', cabang: 'Gudang Pusat', tipeCabang: 'gudang', aktif: true, createdAt: d(90), updatedAt: now },
  { id: 'u-2', nama: 'Budi Manajer', email: 'manajer@tanigo.id', role: 'manajer', cabangId: 'toko-1', cabang: 'Toko Utama', tipeCabang: 'toko', aktif: true, createdAt: d(60), updatedAt: now },
  { id: 'u-3', nama: 'Siti Kasir', email: 'kasir@tanigo.id', role: 'kasir', cabangId: 'toko-1', cabang: 'Toko Utama', tipeCabang: 'toko', aktif: true, createdAt: d(45), updatedAt: now },
  { id: 'u-4', nama: 'Andi Gudang', email: 'gudang@tanigo.id', role: 'staf_gudang', cabangId: 'gudang-1', cabang: 'Gudang Pusat', tipeCabang: 'gudang', aktif: true, createdAt: d(30), updatedAt: now },
  { id: 'u-5', nama: 'Rina Kasir', email: 'rina@tanigo.id', role: 'kasir', cabangId: 'toko-2', cabang: 'Toko Selatan', tipeCabang: 'toko', aktif: true, createdAt: d(20), updatedAt: now },
  { id: 'u-6', nama: 'Joko Admin', email: 'joko@tanigo.id', role: 'admin', cabangId: 'toko-3', cabang: 'Toko Barat', tipeCabang: 'toko', aktif: false, createdAt: d(15), updatedAt: now },
]

// ─── Produk (subset untuk transfer stok form) ─────────────────────────────────

export const mockProduk: Produk[] = [
  { id: 'p-1', nama: 'Pupuk Urea 50kg', sku: 'PUP-001', kategori: 'Pupuk', satuan: 'karung', hargaBeli: 85000, hargaJual: 110000, stok: 120, lokasiRak: 'A1', thresholdStok: 20, statusAktif: true, statusStok: 'normal', createdAt: d(90), updatedAt: now },
  { id: 'p-2', nama: 'Pupuk NPK Mutiara', sku: 'PUP-002', kategori: 'Pupuk', satuan: 'kg', hargaBeli: 12000, hargaJual: 16000, stok: 8, lokasiRak: 'A2', thresholdStok: 10, statusAktif: true, statusStok: 'menipis', createdAt: d(80), updatedAt: now },
  { id: 'p-3', nama: 'Pestisida Roundup 1L', sku: 'PES-001', kategori: 'Pestisida', satuan: 'botol', hargaBeli: 55000, hargaJual: 75000, stok: 35, lokasiRak: 'B1', thresholdStok: 5, statusAktif: true, statusStok: 'normal', createdAt: d(70), updatedAt: now },
  { id: 'p-4', nama: 'Benih Padi IR64', sku: 'BEN-001', kategori: 'Benih', satuan: 'kg', hargaBeli: 15000, hargaJual: 22000, stok: 0, lokasiRak: 'C1', thresholdStok: 10, statusAktif: true, statusStok: 'habis', createdAt: d(60), updatedAt: now },
  { id: 'p-5', nama: 'Sprayer Manual 16L', sku: 'ALT-001', kategori: 'Alat & Mesin', satuan: 'unit', hargaBeli: 125000, hargaJual: 175000, stok: 15, lokasiRak: 'D1', thresholdStok: 3, statusAktif: true, statusStok: 'normal', createdAt: d(50), updatedAt: now },
  { id: 'p-6', nama: 'Pupuk Kandang Organik', sku: 'PUP-003', kategori: 'Pupuk', satuan: 'karung', hargaBeli: 25000, hargaJual: 35000, stok: 60, lokasiRak: 'A3', thresholdStok: 15, statusAktif: true, statusStok: 'normal', createdAt: d(40), updatedAt: now },
]

// ─── Transfer Stok ────────────────────────────────────────────────────────────

export const mockTransferStok: TransferStok[] = [
  {
    id: 'ts-1',
    nomorTransfer: 'TS-2026-001',
    tokoId: 'toko-1', tokNama: 'Toko Utama',
    gudangId: 'gudang-1', gudangNama: 'Gudang Pusat',
    status: 'Menunggu Persetujuan',
    items: [
      { id: 'tsi-1a', produkId: 'p-1', produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', satuan: 'karung', qtyDiminta: 10 },
      { id: 'tsi-1b', produkId: 'p-3', produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', satuan: 'botol', qtyDiminta: 20 },
    ],
    catatanToko: 'Stok hampir habis, mohon segera diproses.',
    createdAt: d(2), updatedAt: d(2),
  },
  {
    id: 'ts-2',
    nomorTransfer: 'TS-2026-002',
    tokoId: 'toko-2', tokNama: 'Toko Selatan',
    gudangId: 'gudang-1', gudangNama: 'Gudang Pusat',
    status: 'Disetujui',
    items: [
      { id: 'tsi-2a', produkId: 'p-2', produkNama: 'Pupuk NPK Mutiara', produkSku: 'PUP-002', satuan: 'kg', qtyDiminta: 50, qtyDisetujui: 50 },
      { id: 'tsi-2b', produkId: 'p-6', produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', satuan: 'karung', qtyDiminta: 15, qtyDisetujui: 10 },
    ],
    catatanToko: 'Butuh untuk musim tanam.',
    catatanGudang: 'Stok karung organik terbatas, disetujui 10 saja.',
    approvedAt: d(1),
    createdAt: d(3), updatedAt: d(1),
  },
  {
    id: 'ts-3',
    nomorTransfer: 'TS-2026-003',
    tokoId: 'toko-3', tokNama: 'Toko Barat',
    gudangId: 'gudang-2', gudangNama: 'Gudang Utara',
    status: 'Dikirim',
    items: [
      { id: 'tsi-3a', produkId: 'p-5', produkNama: 'Sprayer Manual 16L', produkSku: 'ALT-001', satuan: 'unit', qtyDiminta: 5, qtyDisetujui: 5 },
      { id: 'tsi-3b', produkId: 'p-1', produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', satuan: 'karung', qtyDiminta: 8, qtyDisetujui: 8 },
    ],
    catatanGudang: 'Siap dikirim hari ini.',
    approvedAt: d(3),
    shippedAt: d(1),
    createdAt: d(5), updatedAt: d(1),
  },
  {
    id: 'ts-4',
    nomorTransfer: 'TS-2026-004',
    tokoId: 'toko-1', tokNama: 'Toko Utama',
    gudangId: 'gudang-1', gudangNama: 'Gudang Pusat',
    status: 'Selesai',
    items: [
      { id: 'tsi-4a', produkId: 'p-3', produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', satuan: 'botol', qtyDiminta: 12, qtyDisetujui: 12, qtyDiterima: 12, statusPenerimaan: 'diterima' },
      { id: 'tsi-4b', produkId: 'p-6', produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', satuan: 'karung', qtyDiminta: 20, qtyDisetujui: 20, qtyDiterima: 18, statusPenerimaan: 'dikembalikan' },
    ],
    catatanToko: 'Terima kasih.',
    catatanGudang: 'Semua sudah disiapkan.',
    approvedAt: d(8), shippedAt: d(6), receivedAt: d(5),
    createdAt: d(10), updatedAt: d(5),
  },
  {
    id: 'ts-5',
    nomorTransfer: 'TS-2026-005',
    tokoId: 'toko-2', tokNama: 'Toko Selatan',
    gudangId: 'gudang-2', gudangNama: 'Gudang Utara',
    status: 'Ditolak',
    items: [
      { id: 'tsi-5a', produkId: 'p-4', produkNama: 'Benih Padi IR64', produkSku: 'BEN-001', satuan: 'kg', qtyDiminta: 100 },
    ],
    catatanToko: 'Urgent untuk petani langganan.',
    catatanGudang: 'Stok benih habis di semua gudang.',
    createdAt: d(4), updatedAt: d(3),
  },
]

// ─── Pengiriman ───────────────────────────────────────────────────────────────

export const mockPengiriman: Pengiriman[] = [
  {
    id: 'pg-1',
    nomorPengiriman: 'PG-2026-001',
    pesananIds: ['po-1', 'po-2'],
    pesananList: [
      { id: 'po-1', nomorPesanan: 'ORD-2026-041', pelangganNama: 'Pak Hendra', alamat: 'Jl. Mawar No.12, Depok' },
      { id: 'po-2', nomorPesanan: 'ORD-2026-042', pelangganNama: 'Bu Wati', alamat: 'Jl. Melati No.5, Depok' },
    ],
    driverNama: 'Rudi Santoso',
    tanggalPengiriman: d(0),
    estimasiWaktu: '10:00 - 14:00',
    status: 'Dijadwalkan',
    catatan: 'Hubungi pelanggan 30 menit sebelum tiba.',
    createdAt: d(1), updatedAt: d(1),
  },
  {
    id: 'pg-2',
    nomorPengiriman: 'PG-2026-002',
    pesananIds: ['po-3', 'po-4', 'po-5'],
    pesananList: [
      { id: 'po-3', nomorPesanan: 'ORD-2026-038', pelangganNama: 'Bpk. Slamet', alamat: 'Jl. Anggrek No.8, Jakarta Selatan' },
      { id: 'po-4', nomorPesanan: 'ORD-2026-039', pelangganNama: 'CV Tani Makmur', alamat: 'Jl. Industri No.22, Jakarta Timur' },
      { id: 'po-5', nomorPesanan: 'ORD-2026-040', pelangganNama: 'Ibu Lastri', alamat: 'Jl. Kenanga No.3, Bekasi' },
    ],
    driverNama: 'Agus Triyono',
    tanggalPengiriman: d(0),
    estimasiWaktu: '08:00 - 13:00',
    status: 'Dalam Perjalanan',
    createdAt: d(1), updatedAt: d(0),
  },
  {
    id: 'pg-3',
    nomorPengiriman: 'PG-2026-003',
    pesananIds: ['po-6', 'po-7'],
    pesananList: [
      { id: 'po-6', nomorPesanan: 'ORD-2026-035', pelangganNama: 'Pak Darto', alamat: 'Jl. Padi No.10, Bogor' },
      { id: 'po-7', nomorPesanan: 'ORD-2026-036', pelangganNama: 'Kelompok Tani Sejahtera', alamat: 'Jl. Sawah No.1, Bogor' },
    ],
    driverNama: 'Rudi Santoso',
    tanggalPengiriman: d(2),
    status: 'Selesai',
    catatanHasil: 'Semua pesanan sudah diantar. Pelanggan puas.',
    checklistItems: [
      { pesananId: 'po-6', nomorPesanan: 'ORD-2026-035', pelangganNama: 'Pak Darto', alamat: 'Jl. Padi No.10, Bogor', status: 'terkirim' },
      { pesananId: 'po-7', nomorPesanan: 'ORD-2026-036', pelangganNama: 'Kelompok Tani Sejahtera', alamat: 'Jl. Sawah No.1, Bogor', status: 'dikembalikan', catatan: 'Tidak ada orang di rumah, barang dikembalikan.' },
    ],
    checklistSubmittedAt: d(2),
    biaya: { bbm: 85000, upahDriver: 150000, tol: 30000, lainnya: 0, total: 265000 },
    createdAt: d(3), updatedAt: d(2),
  },
  {
    id: 'pg-4',
    nomorPengiriman: 'PG-2026-004',
    pesananIds: ['po-8'],
    pesananList: [
      { id: 'po-8', nomorPesanan: 'ORD-2026-030', pelangganNama: 'PT Agro Nusantara', alamat: 'Jl. Industri Besar No.45, Tangerang' },
    ],
    driverNama: 'Agus Triyono',
    tanggalPengiriman: d(4),
    status: 'Gagal',
    alasanGagal: 'Alamat tidak ditemukan. Pelanggan tidak bisa dihubungi.',
    biaya: { bbm: 60000, upahDriver: 100000, tol: 20000, lainnya: 0, total: 180000 },
    createdAt: d(5), updatedAt: d(4),
  },
]

// ─── Paginated wrapper ────────────────────────────────────────────────────────

export function paginate<T>(items: T[], page = 1, limit = 25) {
  const start = (page - 1) * limit
  const data = items.slice(start, start + limit)
  return {
    data,
    meta: { total: items.length, page, limit, totalPages: Math.ceil(items.length / limit) },
  }
}
