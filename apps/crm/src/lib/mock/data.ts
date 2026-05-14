import type {
  Cabang,
  TransferStok,
  Pengiriman,
  PurchaseOrder,
  PembayaranPO,
  Pesanan,
  PelangganVIP,
  TagihanVIP,
  StokOpname,
  User,
  Produk,
  CabangInventory,
  PergerakanStok,
  Supplier,
  Shift,
} from '@/types'

const now = new Date().toISOString()
const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString()

// ─── Cabang ───────────────────────────────────────────────────────────────────

export const mockCabang: Cabang[] = [
  { id: 'toko-1', nama: 'Toko Utama', tipe: 'toko', lokasi: 'Jakarta Selatan', telepon: '021-7812345', aktif: true, createdAt: d(90), updatedAt: d(2) },
  { id: 'toko-2', nama: 'Toko Selatan', tipe: 'toko', lokasi: 'Depok', telepon: '021-7756789', aktif: true, createdAt: d(60), updatedAt: d(5) },
  { id: 'toko-3', nama: 'Toko Barat', tipe: 'toko', lokasi: 'Tangerang', telepon: '021-5534567', aktif: true, createdAt: d(45), updatedAt: d(1) },
  { id: 'toko-4', nama: 'Toko Timur', tipe: 'toko', lokasi: 'Bekasi', telepon: '021-8812345', aktif: false, createdAt: d(30), updatedAt: d(10) },
  { id: 'gudang-1', nama: 'Gudang Pusat', tipe: 'gudang', lokasi: 'Cibitung, Bekasi', telepon: '021-8901234', aktif: true, createdAt: d(120), updatedAt: d(1) },
  { id: 'gudang-2', nama: 'Gudang Utara', tipe: 'gudang', lokasi: 'Bogor', telepon: '0251-123456', aktif: true, createdAt: d(80), updatedAt: d(3) },
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
      {
        id: 'po-1', nomorPesanan: 'ORD-2026-041', pelangganNama: 'Pak Hendra', alamat: 'Jl. Mawar No.12, Depok',
        items: [
          { produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', qty: 5, satuan: 'karung' },
          { produkNama: 'Pupuk NPK Mutiara', produkSku: 'PUP-002', qty: 10, satuan: 'kg' },
        ],
      },
      {
        id: 'po-2', nomorPesanan: 'ORD-2026-042', pelangganNama: 'Bu Wati', alamat: 'Jl. Melati No.5, Depok',
        items: [
          { produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', qty: 3, satuan: 'botol' },
        ],
      },
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
      {
        id: 'po-3', nomorPesanan: 'ORD-2026-038', pelangganNama: 'Bpk. Slamet', alamat: 'Jl. Anggrek No.8, Jakarta Selatan',
        items: [
          { produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', qty: 5, satuan: 'karung' },
          { produkNama: 'Pupuk NPK Mutiara', produkSku: 'PUP-002', qty: 10, satuan: 'kg' },
        ],
      },
      {
        id: 'po-4', nomorPesanan: 'ORD-2026-039', pelangganNama: 'CV Tani Makmur', alamat: 'Jl. Industri No.22, Jakarta Timur',
        items: [
          { produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', qty: 60, satuan: 'karung' },
          { produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', qty: 50, satuan: 'karung' },
          { produkNama: 'Pupuk NPK Mutiara', produkSku: 'PUP-002', qty: 100, satuan: 'kg' },
        ],
      },
      {
        id: 'po-5', nomorPesanan: 'ORD-2026-040', pelangganNama: 'Ibu Lastri', alamat: 'Jl. Kenanga No.3, Bekasi',
        items: [
          { produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', qty: 2, satuan: 'botol' },
          { produkNama: 'Sprayer Manual 16L', produkSku: 'ALT-001', qty: 1, satuan: 'unit' },
        ],
      },
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
      {
        id: 'po-6', nomorPesanan: 'ORD-2026-035', pelangganNama: 'Pak Darto', alamat: 'Jl. Padi No.10, Bogor',
        items: [
          { produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', qty: 10, satuan: 'botol' },
          { produkNama: 'Sprayer Manual 16L', produkSku: 'ALT-001', qty: 3, satuan: 'unit' },
          { produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', qty: 15, satuan: 'karung' },
        ],
      },
      {
        id: 'po-7', nomorPesanan: 'ORD-2026-036', pelangganNama: 'Kelompok Tani Sejahtera', alamat: 'Jl. Sawah No.1, Bogor',
        items: [
          { produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', qty: 15, satuan: 'karung' },
          { produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', qty: 30, satuan: 'karung' },
        ],
      },
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
      {
        id: 'po-8', nomorPesanan: 'ORD-2026-030', pelangganNama: 'PT Agro Nusantara', alamat: 'Jl. Industri Besar No.45, Tangerang',
        items: [
          { produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', qty: 30, satuan: 'karung' },
          { produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', qty: 50, satuan: 'karung' },
          { produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', qty: 20, satuan: 'botol' },
        ],
      },
    ],
    driverNama: 'Agus Triyono',
    tanggalPengiriman: d(4),
    status: 'Gagal',
    alasanGagal: 'Alamat tidak ditemukan. Pelanggan tidak bisa dihubungi.',
    biaya: { bbm: 60000, upahDriver: 100000, tol: 20000, lainnya: 0, total: 180000 },
    createdAt: d(5), updatedAt: d(4),
  },
]

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export const mockPurchaseOrders: PurchaseOrder[] = [
  // PO-001: Diterima & Lunas — stok sudah masuk
  {
    id: 'po-001',
    nomorPO: 'PO-2026-001',
    supplierId: 'sup-1',
    supplierNama: 'CV Agro Mandiri',
    items: [
      { id: 'poi-1a', produkId: 'p-1', produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', qtyPesan: 50, qtyDiterima: 50, hargaBeli: 85000, subtotal: 4250000 },
      { id: 'poi-1b', produkId: 'p-2', produkNama: 'Pupuk NPK Mutiara', produkSku: 'PUP-002', qtyPesan: 100, qtyDiterima: 100, hargaBeli: 12000, subtotal: 1200000 },
    ],
    biayaTambahan: { ongkosKirim: 200000, biayaBongkarMuat: 100000, upahKurir: 0, lainnya: 0 },
    totalHargaBarang: 5450000,
    totalBiayaTambahan: 300000,
    totalKeseluruhan: 5750000,
    hppPerUnit: 38333,
    totalQty: 150,
    status: 'Diterima',
    statusPembayaran: 'Lunas',
    totalDibayar: 5750000,
    sisaHutang: 0,
    catatan: 'Prioritas karena stok urea hampir habis.',
    estimasiTanggalTiba: d(8),
    createdAt: d(12), updatedAt: d(8),
  },

  // PO-002: Dikirim ke Supplier — menunggu barang datang
  {
    id: 'po-002',
    nomorPO: 'PO-2026-002',
    supplierId: 'sup-2',
    supplierNama: 'PT Kimia Farma Agro',
    items: [
      { id: 'poi-2a', produkId: 'p-3', produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', qtyPesan: 30, qtyDiterima: 0, hargaBeli: 55000, subtotal: 1650000 },
      { id: 'poi-2b', produkId: 'p-5', produkNama: 'Sprayer Manual 16L', produkSku: 'ALT-001', qtyPesan: 10, qtyDiterima: 0, hargaBeli: 125000, subtotal: 1250000 },
    ],
    biayaTambahan: { ongkosKirim: 150000, biayaBongkarMuat: 0, upahKurir: 0, lainnya: 0 },
    totalHargaBarang: 2900000,
    totalBiayaTambahan: 150000,
    totalKeseluruhan: 3050000,
    hppPerUnit: 76250,
    totalQty: 40,
    status: 'Dikirim ke Supplier',
    statusPembayaran: 'Belum Bayar',
    totalDibayar: 0,
    sisaHutang: 3050000,
    estimasiTanggalTiba: d(-2),
    createdAt: d(5), updatedAt: d(4),
  },

  // PO-003: Draft — belum dikirim ke supplier
  {
    id: 'po-003',
    nomorPO: 'PO-2026-003',
    supplierId: 'sup-3',
    supplierNama: 'Toko Benih Nusantara',
    items: [
      { id: 'poi-3a', produkId: 'p-4', produkNama: 'Benih Padi IR64', produkSku: 'BEN-001', qtyPesan: 200, qtyDiterima: 0, hargaBeli: 15000, subtotal: 3000000 },
      { id: 'poi-3b', produkId: 'p-6', produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', qtyPesan: 50, qtyDiterima: 0, hargaBeli: 25000, subtotal: 1250000 },
    ],
    biayaTambahan: { ongkosKirim: 100000, biayaBongkarMuat: 50000, upahKurir: 0, lainnya: 0 },
    totalHargaBarang: 4250000,
    totalBiayaTambahan: 150000,
    totalKeseluruhan: 4400000,
    hppPerUnit: 17600,
    totalQty: 250,
    status: 'Draft',
    statusPembayaran: 'Belum Bayar',
    totalDibayar: 0,
    sisaHutang: 4400000,
    catatan: 'Menunggu konfirmasi harga dari supplier.',
    estimasiTanggalTiba: d(-7),
    createdAt: d(2), updatedAt: d(2),
  },

  // PO-004: Diterima & Sebagian bayar — hutang masih ada
  {
    id: 'po-004',
    nomorPO: 'PO-2026-004',
    supplierId: 'sup-1',
    supplierNama: 'CV Agro Mandiri',
    items: [
      { id: 'poi-4a', produkId: 'p-6', produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', qtyPesan: 100, qtyDiterima: 100, hargaBeli: 25000, subtotal: 2500000 },
      { id: 'poi-4b', produkId: 'p-3', produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', qtyPesan: 20, qtyDiterima: 20, hargaBeli: 55000, subtotal: 1100000 },
    ],
    biayaTambahan: { ongkosKirim: 175000, biayaBongkarMuat: 75000, upahKurir: 0, lainnya: 0 },
    totalHargaBarang: 3600000,
    totalBiayaTambahan: 250000,
    totalKeseluruhan: 3850000,
    hppPerUnit: 32083,
    totalQty: 120,
    status: 'Diterima',
    statusPembayaran: 'Sebagian',
    totalDibayar: 2000000,
    sisaHutang: 1850000,
    catatan: 'Pembayaran pertama sudah ditransfer. Sisa dibayar akhir bulan.',
    estimasiTanggalTiba: d(18),
    createdAt: d(22), updatedAt: d(18),
  },

  // PO-005: Dibatalkan
  {
    id: 'po-005',
    nomorPO: 'PO-2026-005',
    supplierId: 'sup-2',
    supplierNama: 'PT Kimia Farma Agro',
    items: [
      { id: 'poi-5a', produkId: 'p-2', produkNama: 'Pupuk NPK Mutiara', produkSku: 'PUP-002', qtyPesan: 200, qtyDiterima: 0, hargaBeli: 12000, subtotal: 2400000 },
    ],
    biayaTambahan: { ongkosKirim: 100000, biayaBongkarMuat: 0, upahKurir: 0, lainnya: 0 },
    totalHargaBarang: 2400000,
    totalBiayaTambahan: 100000,
    totalKeseluruhan: 2500000,
    hppPerUnit: 12500,
    totalQty: 200,
    status: 'Dibatalkan',
    statusPembayaran: 'Belum Bayar',
    totalDibayar: 0,
    sisaHutang: 0,
    catatan: 'Dibatalkan karena supplier tidak bisa memenuhi harga yang disepakati.',
    createdAt: d(30), updatedAt: d(28),
  },
]

export const mockPembayaranPO: PembayaranPO[] = [
  // Pembayaran untuk PO-001 (Lunas, 1x bayar)
  {
    id: 'pay-1a',
    purchaseOrderId: 'po-001',
    nominal: 5750000,
    tanggal: d(9),
    metode: 'Transfer',
    catatan: 'Transfer via BCA ke rek CV Agro Mandiri',
  },

  // Pembayaran untuk PO-004 (Sebagian, 1x bayar dulu)
  {
    id: 'pay-4a',
    purchaseOrderId: 'po-004',
    nominal: 2000000,
    tanggal: d(20),
    metode: 'Transfer',
    catatan: 'DP 50%, sisa dibayar akhir bulan',
  },
]

// ─── Pelanggan VIP ────────────────────────────────────────────────────────────

export const mockPelangganVIP: PelangganVIP[] = [
  {
    id: 'vip-1',
    namaLengkap: 'Kelompok Tani Makmur Jaya',
    nomorTelepon: '0812-3456-7890',
    alamat: 'Jl. Sawah Indah No. 12, Depok',
    creditLimit: 10000000,
    kreditTerpakai: 2750000,
    sisaKredit: 7250000,
    statusKredit: 'aman',
    status: 'aktif',
    catatan: 'Pelanggan tetap sejak 2023. Selalu bayar tepat waktu.',
    createdAt: d(120), updatedAt: d(3),
  },
  {
    id: 'vip-2',
    namaLengkap: 'PT Agro Nusantara',
    nomorTelepon: '021-5678-9012',
    alamat: 'Jl. Industri Besar No. 45, Tangerang',
    creditLimit: 25000000,
    kreditTerpakai: 21500000,
    sisaKredit: 3500000,
    statusKredit: 'mendekati_limit',
    status: 'aktif',
    catatan: 'Pembelian volume besar. Perlu dimonitor limit kredit.',
    createdAt: d(90), updatedAt: d(1),
  },
  {
    id: 'vip-3',
    namaLengkap: 'Pak Hendra Wijaya',
    nomorTelepon: '0856-7890-1234',
    alamat: 'Jl. Mawar No. 12, Depok',
    creditLimit: 5000000,
    kreditTerpakai: 5200000,
    sisaKredit: -200000,
    statusKredit: 'melebihi_limit',
    status: 'suspend',
    catatan: 'Diblokir sementara karena tagihan belum lunas.',
    createdAt: d(60), updatedAt: d(5),
  },
  {
    id: 'vip-4',
    namaLengkap: 'CV Tani Sejahtera',
    nomorTelepon: '0878-9012-3456',
    alamat: 'Jl. Padi No. 8, Bogor',
    creditLimit: 15000000,
    kreditTerpakai: 0,
    sisaKredit: 15000000,
    statusKredit: 'aman',
    status: 'aktif',
    catatan: 'Pelanggan baru, belum ada transaksi kredit.',
    createdAt: d(15), updatedAt: d(15),
  },
]

export const mockTagihanVIP: TagihanVIP[] = [
  // Tagihan vip-1
  {
    id: 'tgn-1a',
    pelangganId: 'vip-1',
    nomorOrder: 'ORD-2026-038',
    tanggal: d(10),
    total: 1650000,
    jumlahDibayar: 1650000,
    sisaTagihan: 0,
    dueDate: d(-5),
    status: 'Lunas',
  },
  {
    id: 'tgn-1b',
    pelangganId: 'vip-1',
    nomorOrder: 'ORD-2026-044',
    tanggal: d(3),
    total: 2750000,
    jumlahDibayar: 0,
    sisaTagihan: 2750000,
    dueDate: d(-17),
    status: 'Belum Bayar',
  },
  // Tagihan vip-2
  {
    id: 'tgn-2a',
    pelangganId: 'vip-2',
    nomorOrder: 'ORD-2026-031',
    tanggal: d(20),
    total: 9500000,
    jumlahDibayar: 9500000,
    sisaTagihan: 0,
    dueDate: d(-5),
    status: 'Lunas',
  },
  {
    id: 'tgn-2b',
    pelangganId: 'vip-2',
    nomorOrder: 'ORD-2026-041',
    tanggal: d(7),
    total: 12000000,
    jumlahDibayar: 5000000,
    sisaTagihan: 7000000,
    dueDate: d(-7),
    status: 'Sebagian',
  },
  {
    id: 'tgn-2c',
    pelangganId: 'vip-2',
    nomorOrder: 'ORD-2026-047',
    tanggal: d(1),
    total: 8500000,
    jumlahDibayar: 0,
    sisaTagihan: 8500000,
    dueDate: d(-14),
    status: 'Jatuh Tempo',
  },
  // Tagihan vip-3
  {
    id: 'tgn-3a',
    pelangganId: 'vip-3',
    nomorOrder: 'ORD-2026-029',
    tanggal: d(25),
    total: 5200000,
    jumlahDibayar: 0,
    sisaTagihan: 5200000,
    dueDate: d(-10),
    status: 'Jatuh Tempo',
  },
]

// ─── Pesanan ──────────────────────────────────────────────────────────────────

export const mockPesanan: Pesanan[] = [
  {
    id: 'ord-1',
    nomorPesanan: 'ORD-2026-047',
    pelangganId: 'vip-2',
    pelangganNama: 'PT Agro Nusantara',
    pelangganTelepon: '021-5678-9012',
    items: [
      { id: 'oi-1a', produkId: 'p-1', produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', qty: 30, hargaSatuan: 110000, subtotal: 3300000 },
      { id: 'oi-1b', produkId: 'p-6', produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', qty: 50, hargaSatuan: 35000, subtotal: 1750000 },
      { id: 'oi-1c', produkId: 'p-3', produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', qty: 20, hargaSatuan: 75000, subtotal: 1500000 },
    ],
    subtotal: 6550000,
    diskon: 0,
    total: 8500000,
    metodePembayaran: 'Kredit VIP',
    metodePengiriman: 'dikirim',
    alamatPengiriman: 'Jl. Industri Besar No. 45, Tangerang',
    status: 'Dalam Pengiriman',
    catatan: 'Antar pagi sebelum jam 10.',
    kasirId: 'u-3',
    kasirNama: 'Siti Kasir',
    sumber: 'vip',
    createdAt: d(1), updatedAt: d(0),
  },
  {
    id: 'ord-2',
    nomorPesanan: 'ORD-2026-046',
    pelangganNama: 'Pak Darto',
    pelangganTelepon: '0822-1111-2222',
    items: [
      { id: 'oi-2a', produkId: 'p-2', produkNama: 'Pupuk NPK Mutiara', produkSku: 'PUP-002', qty: 25, hargaSatuan: 16000, subtotal: 400000 },
      { id: 'oi-2b', produkId: 'p-5', produkNama: 'Sprayer Manual 16L', produkSku: 'ALT-001', qty: 1, hargaSatuan: 175000, subtotal: 175000 },
    ],
    subtotal: 575000,
    diskon: 0,
    total: 575000,
    metodePembayaran: 'QRIS',
    metodePengiriman: 'ambil_sendiri',
    status: 'Selesai',
    kasirId: 'u-3',
    kasirNama: 'Siti Kasir',
    sumber: 'pos',
    createdAt: d(0), updatedAt: d(0),
  },
  {
    id: 'ord-3',
    nomorPesanan: 'ORD-2026-044',
    pelangganId: 'vip-1',
    pelangganNama: 'Kelompok Tani Makmur Jaya',
    pelangganTelepon: '0812-3456-7890',
    items: [
      { id: 'oi-3a', produkId: 'p-1', produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', qty: 15, hargaSatuan: 110000, subtotal: 1650000 },
      { id: 'oi-3b', produkId: 'p-6', produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', qty: 30, hargaSatuan: 35000, subtotal: 1050000 },
    ],
    subtotal: 2700000,
    diskon: 50000,
    total: 2750000,
    metodePembayaran: 'Kredit VIP',
    metodePengiriman: 'dikirim',
    alamatPengiriman: 'Jl. Sawah Indah No. 12, Depok',
    status: 'Selesai',
    kasirId: 'u-3',
    kasirNama: 'Siti Kasir',
    sumber: 'vip',
    createdAt: d(3), updatedAt: d(2),
  },
  {
    id: 'ord-4',
    nomorPesanan: 'ORD-2026-043',
    pelangganNama: 'Bu Wati',
    pelangganTelepon: '0833-3333-4444',
    items: [
      { id: 'oi-4a', produkId: 'p-3', produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', qty: 3, hargaSatuan: 75000, subtotal: 225000 },
    ],
    subtotal: 225000,
    diskon: 0,
    total: 225000,
    metodePembayaran: 'Tunai',
    metodePengiriman: 'ambil_sendiri',
    status: 'Selesai',
    kasirId: 'u-3',
    kasirNama: 'Siti Kasir',
    sumber: 'pos',
    createdAt: d(4), updatedAt: d(4),
  },
  {
    id: 'ord-5',
    nomorPesanan: 'ORD-2026-042',
    pelangganNama: 'Bpk. Slamet',
    pelangganTelepon: '0844-5555-6666',
    items: [
      { id: 'oi-5a', produkId: 'p-1', produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', qty: 5, hargaSatuan: 110000, subtotal: 550000 },
      { id: 'oi-5b', produkId: 'p-2', produkNama: 'Pupuk NPK Mutiara', produkSku: 'PUP-002', qty: 10, hargaSatuan: 16000, subtotal: 160000 },
    ],
    subtotal: 710000,
    diskon: 0,
    total: 710000,
    metodePembayaran: 'Transfer Bank',
    metodePengiriman: 'dikirim',
    alamatPengiriman: 'Jl. Anggrek No. 8, Jakarta Selatan',
    status: 'Diproses',
    kasirId: 'u-2',
    kasirNama: 'Budi Manajer',
    sumber: 'vip',
    createdAt: d(1), updatedAt: d(0),
  },
  {
    id: 'ord-6',
    nomorPesanan: 'ORD-2026-041',
    pelangganId: 'vip-2',
    pelangganNama: 'PT Agro Nusantara',
    pelangganTelepon: '021-5678-9012',
    items: [
      { id: 'oi-6a', produkId: 'p-1', produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', qty: 60, hargaSatuan: 110000, subtotal: 6600000 },
      { id: 'oi-6b', produkId: 'p-6', produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', qty: 50, hargaSatuan: 35000, subtotal: 1750000 },
      { id: 'oi-6c', produkId: 'p-2', produkNama: 'Pupuk NPK Mutiara', produkSku: 'PUP-002', qty: 100, hargaSatuan: 16000, subtotal: 1600000 },
    ],
    subtotal: 9950000,
    diskon: 0,
    total: 12000000,
    metodePembayaran: 'Kredit VIP',
    metodePengiriman: 'dikirim',
    alamatPengiriman: 'Jl. Industri Besar No. 45, Tangerang',
    status: 'Selesai',
    kasirId: 'u-3',
    kasirNama: 'Siti Kasir',
    sumber: 'vip',
    createdAt: d(7), updatedAt: d(6),
  },
  {
    id: 'ord-7',
    nomorPesanan: 'ORD-2026-038',
    pelangganId: 'vip-1',
    pelangganNama: 'Kelompok Tani Makmur Jaya',
    pelangganTelepon: '0812-3456-7890',
    items: [
      { id: 'oi-7a', produkId: 'p-3', produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', qty: 10, hargaSatuan: 75000, subtotal: 750000 },
      { id: 'oi-7b', produkId: 'p-5', produkNama: 'Sprayer Manual 16L', produkSku: 'ALT-001', qty: 3, hargaSatuan: 175000, subtotal: 525000 },
      { id: 'oi-7c', produkId: 'p-6', produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', qty: 15, hargaSatuan: 35000, subtotal: 375000 },
    ],
    subtotal: 1650000,
    diskon: 0,
    total: 1650000,
    metodePembayaran: 'Kredit VIP',
    metodePengiriman: 'dikirim',
    alamatPengiriman: 'Jl. Sawah Indah No. 12, Depok',
    status: 'Selesai',
    kasirId: 'u-3',
    kasirNama: 'Siti Kasir',
    sumber: 'vip',
    createdAt: d(10), updatedAt: d(9),
  },
]

// ─── Stok Opname ─────────────────────────────────────────────────────────────

export const mockStokOpname: StokOpname[] = [
  {
    id: 'so-1',
    nomorOpname: 'SO-2026-001',
    cabangId: 'gudang-1',
    cabangNama: 'Gudang Pusat',
    status: 'Disetujui',
    items: [
      { id: 'soi-1a', produkId: 'p-1', produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', satuan: 'karung', stokSistem: 130, stokFisik: 120, selisih: -10 },
      { id: 'soi-1b', produkId: 'p-2', produkNama: 'Pupuk NPK Mutiara', produkSku: 'PUP-002', satuan: 'kg', stokSistem: 8, stokFisik: 8, selisih: 0 },
      { id: 'soi-1c', produkId: 'p-3', produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', satuan: 'botol', stokSistem: 35, stokFisik: 37, selisih: 2 },
      { id: 'soi-1d', produkId: 'p-5', produkNama: 'Sprayer Manual 16L', produkSku: 'ALT-001', satuan: 'unit', stokSistem: 15, stokFisik: 15, selisih: 0 },
      { id: 'soi-1e', produkId: 'p-6', produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', satuan: 'karung', stokSistem: 60, stokFisik: 58, selisih: -2 },
    ],
    catatan: 'Opname rutin bulanan. Selisih urea kemungkinan karena tumpahan saat bongkar muat.',
    submittedAt: d(5),
    approvedAt: d(4),
    createdAt: d(5), updatedAt: d(4),
  },
  {
    id: 'so-2',
    nomorOpname: 'SO-2026-002',
    cabangId: 'toko-1',
    cabangNama: 'Toko Utama',
    status: 'Disetujui',
    items: [
      { id: 'soi-2a', produkId: 'p-1', produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', satuan: 'karung', stokSistem: 20, stokFisik: 20, selisih: 0 },
      { id: 'soi-2b', produkId: 'p-3', produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', satuan: 'botol', stokSistem: 12, stokFisik: 10, selisih: -2 },
      { id: 'soi-2c', produkId: 'p-6', produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', satuan: 'karung', stokSistem: 25, stokFisik: 25, selisih: 0 },
    ],
    catatan: 'Opname awal migrasi ke sistem TaniGo.',
    submittedAt: d(10),
    approvedAt: d(9),
    createdAt: d(10), updatedAt: d(9),
  },
  {
    id: 'so-3',
    nomorOpname: 'SO-2026-003',
    cabangId: 'gudang-1',
    cabangNama: 'Gudang Pusat',
    status: 'Draft',
    items: [
      { id: 'soi-3a', produkId: 'p-4', produkNama: 'Benih Padi IR64', produkSku: 'BEN-001', satuan: 'kg', stokSistem: 0, stokFisik: 5, selisih: 5 },
      { id: 'soi-3b', produkId: 'p-2', produkNama: 'Pupuk NPK Mutiara', produkSku: 'PUP-002', satuan: 'kg', stokSistem: 8, stokFisik: 6, selisih: -2 },
    ],
    createdAt: d(1), updatedAt: d(1),
  },
]

// ─── Cabang Inventory (stok per cabang) ──────────────────────────────────────
// Derived from approved stok opname records. This is the source of truth for
// per-branch stock — NOT produk.stok which is just a catalog reference.

export const mockCabangInventory: CabangInventory[] = [
  // Gudang Pusat — dari SO-2026-001 (approved)
  { id: 'ci-g1-p1', cabangId: 'gudang-1', produkId: 'p-1', produkNama: 'Pupuk Urea 50kg',       produkSku: 'PUP-001', satuan: 'karung', stok: 120, updatedAt: d(4) },
  { id: 'ci-g1-p2', cabangId: 'gudang-1', produkId: 'p-2', produkNama: 'Pupuk NPK Mutiara',     produkSku: 'PUP-002', satuan: 'kg',     stok: 8,   updatedAt: d(4) },
  { id: 'ci-g1-p3', cabangId: 'gudang-1', produkId: 'p-3', produkNama: 'Pestisida Roundup 1L',  produkSku: 'PES-001', satuan: 'botol',  stok: 37,  updatedAt: d(4) },
  { id: 'ci-g1-p4', cabangId: 'gudang-1', produkId: 'p-4', produkNama: 'Benih Padi IR64',       produkSku: 'BEN-001', satuan: 'kg',     stok: 0,   updatedAt: d(4) },
  { id: 'ci-g1-p5', cabangId: 'gudang-1', produkId: 'p-5', produkNama: 'Sprayer Manual 16L',    produkSku: 'ALT-001', satuan: 'unit',   stok: 15,  updatedAt: d(4) },
  { id: 'ci-g1-p6', cabangId: 'gudang-1', produkId: 'p-6', produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', satuan: 'karung', stok: 58,  updatedAt: d(4) },
  // Toko Utama — dari SO-2026-002 (approved)
  { id: 'ci-t1-p1', cabangId: 'toko-1', produkId: 'p-1', produkNama: 'Pupuk Urea 50kg',       produkSku: 'PUP-001', satuan: 'karung', stok: 20, updatedAt: d(9) },
  { id: 'ci-t1-p3', cabangId: 'toko-1', produkId: 'p-3', produkNama: 'Pestisida Roundup 1L',  produkSku: 'PES-001', satuan: 'botol',  stok: 10, updatedAt: d(9) },
  { id: 'ci-t1-p6', cabangId: 'toko-1', produkId: 'p-6', produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', satuan: 'karung', stok: 25, updatedAt: d(9) },
]

// ─── Shift ───────────────────────────────────────────────────────────────────

function dh(daysAgo: number, hour: number) {
  const dt = new Date(Date.now() - daysAgo * 86400000)
  dt.setHours(hour, 0, 0, 0)
  return dt.toISOString()
}

export const mockShift: Shift[] = [
  { id: 'sh-1', kasirId: 'u-3', kasirNama: 'Siti Kasir', cabangId: 'toko-1', cabangNama: 'Toko Utama', modalAwal: 500000, totalTransaksi: 12, totalPendapatan: 4250000, totalTunai: 2800000, totalNonTunai: 1450000, totalDiskon: 150000, status: 'Selesai', mulaiAt: dh(1, 8), selesaiAt: dh(1, 16), catatanPenutupan: 'Shift berjalan normal.', createdAt: dh(1, 8), updatedAt: dh(1, 16) },
  { id: 'sh-2', kasirId: 'u-3', kasirNama: 'Siti Kasir', cabangId: 'toko-1', cabangNama: 'Toko Utama', modalAwal: 500000, totalTransaksi: 9, totalPendapatan: 3100000, totalTunai: 1900000, totalNonTunai: 1200000, totalDiskon: 80000, status: 'Selesai', mulaiAt: dh(2, 8), selesaiAt: dh(2, 16), createdAt: dh(2, 8), updatedAt: dh(2, 16) },
  { id: 'sh-3', kasirId: 'u-5', kasirNama: 'Rina Kasir', cabangId: 'toko-2', cabangNama: 'Toko Selatan', modalAwal: 500000, totalTransaksi: 7, totalPendapatan: 2750000, totalTunai: 1500000, totalNonTunai: 1250000, totalDiskon: 50000, status: 'Selesai', mulaiAt: dh(1, 8), selesaiAt: dh(1, 16), createdAt: dh(1, 8), updatedAt: dh(1, 16) },
  { id: 'sh-4', kasirId: 'u-3', kasirNama: 'Siti Kasir', cabangId: 'toko-1', cabangNama: 'Toko Utama', modalAwal: 500000, totalTransaksi: 15, totalPendapatan: 5800000, totalTunai: 3200000, totalNonTunai: 2600000, totalDiskon: 200000, status: 'Selesai', mulaiAt: dh(3, 8), selesaiAt: dh(3, 16), catatanPenutupan: 'Ramai, banyak pembelian pupuk.', createdAt: dh(3, 8), updatedAt: dh(3, 16) },
  { id: 'sh-5', kasirId: 'u-5', kasirNama: 'Rina Kasir', cabangId: 'toko-2', cabangNama: 'Toko Selatan', modalAwal: 500000, totalTransaksi: 5, totalPendapatan: 1800000, totalTunai: 1200000, totalNonTunai: 600000, totalDiskon: 0, status: 'Selesai', mulaiAt: dh(2, 8), selesaiAt: dh(2, 16), createdAt: dh(2, 8), updatedAt: dh(2, 16) },
  { id: 'sh-6', kasirId: 'u-3', kasirNama: 'Siti Kasir', cabangId: 'toko-1', cabangNama: 'Toko Utama', modalAwal: 500000, totalTransaksi: 3, totalPendapatan: 980000, totalTunai: 980000, totalNonTunai: 0, totalDiskon: 0, status: 'Aktif', mulaiAt: dh(0, 8), selesaiAt: null, createdAt: dh(0, 8), updatedAt: dh(0, 8) },
]

// ─── Supplier ────────────────────────────────────────────────────────────────

export const mockSuppliers: Supplier[] = [
  { id: 'sup-1', nama: 'PT Agro Makmur', kontak: '021-5551234', alamat: 'Jl. Industri No.12, Bekasi', produkDisuplai: ['Pupuk Urea 50kg', 'Pupuk NPK Mutiara', 'Pupuk Kandang Organik'], createdAt: d(120), updatedAt: d(10) },
  { id: 'sup-2', nama: 'CV Pestisida Jaya', kontak: '022-7778899', alamat: 'Jl. Kimia No.5, Bandung', produkDisuplai: ['Pestisida Roundup 1L'], createdAt: d(90), updatedAt: d(20) },
  { id: 'sup-3', nama: 'UD Benih Unggul', kontak: '0274-334455', alamat: 'Jl. Pertanian No.8, Yogyakarta', produkDisuplai: ['Benih Padi IR64'], createdAt: d(60), updatedAt: d(5) },
  { id: 'sup-4', nama: 'PT Alat Tani Nusantara', kontak: '031-9990011', alamat: 'Jl. Rungkut Industri No.3, Surabaya', produkDisuplai: ['Sprayer Manual 16L'], createdAt: d(45), updatedAt: d(15) },
]

// ─── Riwayat Pergerakan Stok ──────────────────────────────────────────────────

export const mockPergerakanStok: PergerakanStok[] = [
  { id: 'pg-s-1', produkId: 'p-1', produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', jenis: 'masuk', jumlah: 50, stokSebelum: 70, stokSesudah: 120, referensi: 'PO-2026-001', userId: 'demo-admin', userNama: 'Admin Demo', catatan: 'Penerimaan PO dari PT Agro Makmur', createdAt: d(15) },
  { id: 'pg-s-2', produkId: 'p-2', produkNama: 'Pupuk NPK Mutiara', produkSku: 'PUP-002', jenis: 'masuk', jumlah: 100, stokSebelum: 0, stokSesudah: 100, referensi: 'PO-2026-001', userId: 'demo-admin', userNama: 'Admin Demo', catatan: 'Penerimaan PO dari PT Agro Makmur', createdAt: d(15) },
  { id: 'pg-s-3', produkId: 'p-6', produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', jenis: 'masuk', jumlah: 100, stokSebelum: 0, stokSesudah: 100, referensi: 'PO-2026-004', userId: 'demo-admin', userNama: 'Admin Demo', catatan: 'Penerimaan PO dari PT Agro Makmur', createdAt: d(12) },
  { id: 'pg-s-4', produkId: 'p-3', produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', jenis: 'masuk', jumlah: 20, stokSebelum: 17, stokSesudah: 37, referensi: 'PO-2026-004', userId: 'demo-admin', userNama: 'Admin Demo', catatan: 'Penerimaan PO dari CV Pestisida Jaya', createdAt: d(12) },
  { id: 'pg-s-5', produkId: 'p-1', produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', jenis: 'keluar', jumlah: 10, stokSebelum: 120, stokSesudah: 110, referensi: 'TS-2026-002', userId: 'demo-admin', userNama: 'Admin Demo', catatan: 'Transfer ke Toko Utama', createdAt: d(8) },
  { id: 'pg-s-6', produkId: 'p-6', produkNama: 'Pupuk Kandang Organik', produkSku: 'PUP-003', jenis: 'keluar', jumlah: 10, stokSebelum: 68, stokSesudah: 58, referensi: 'TS-2026-002', userId: 'demo-admin', userNama: 'Admin Demo', catatan: 'Transfer ke Toko Utama', createdAt: d(8) },
  { id: 'pg-s-7', produkId: 'p-2', produkNama: 'Pupuk NPK Mutiara', produkSku: 'PUP-002', jenis: 'penyesuaian', jumlah: -2, stokSebelum: 10, stokSesudah: 8, referensi: null, userId: 'demo-admin', userNama: 'Admin Demo', catatan: 'Stok rusak saat penyimpanan', alasan: 'Rusak', createdAt: d(6) },
  { id: 'pg-s-8', produkId: 'p-1', produkNama: 'Pupuk Urea 50kg', produkSku: 'PUP-001', jenis: 'penyesuaian', jumlah: -10, stokSebelum: 130, stokSesudah: 120, referensi: 'SO-2026-001', userId: 'u-2', userNama: 'Budi Manajer', catatan: 'Koreksi hasil stok opname', alasan: 'Koreksi', createdAt: d(4) },
  { id: 'pg-s-9', produkId: 'p-3', produkNama: 'Pestisida Roundup 1L', produkSku: 'PES-001', jenis: 'penyesuaian', jumlah: 2, stokSebelum: 35, stokSesudah: 37, referensi: 'SO-2026-001', userId: 'u-2', userNama: 'Budi Manajer', catatan: 'Koreksi hasil stok opname', alasan: 'Koreksi', createdAt: d(4) },
  { id: 'pg-s-10', produkId: 'p-5', produkNama: 'Sprayer Manual 16L', produkSku: 'ALT-001', jenis: 'masuk', jumlah: 5, stokSebelum: 10, stokSesudah: 15, referensi: 'TS-2026-003', userId: 'demo-admin', userNama: 'Admin Demo', catatan: 'Transfer dari Gudang Pusat', createdAt: d(3) },
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
