

# TaniGo Luwu — Backend API Specification
**For Django REST Framework Implementation**
*Derived from full read-only audit of CRM and POS frontend codebases*
*Audit date: 2026-05-15*

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Authentication & Session](#2-authentication--session)
3. [Data Models](#3-data-models)
4. [Standard Response Envelope](#4-standard-response-envelope)
5. [Pagination Convention](#5-pagination-convention)
6. [API Endpoints by Domain](#6-api-endpoints-by-domain)
   - 6.1 Auth
   - 6.2 Cabang (Branches)
   - 6.3 Users
   - 6.4 Produk (Products)
   - 6.5 Inventori (Inventory)
   - 6.6 Suppliers
   - 6.7 Pesanan (Orders)
   - 6.8 Pengiriman (Deliveries)
   - 6.9 Transfer Stok
   - 6.10 Stok Opname
   - 6.11 Purchase Orders
   - 6.12 Pelanggan VIP
   - 6.13 Tagihan VIP
   - 6.14 Shift (POS-only)
   - 6.15 Transaksi POS (POS-only)
   - 6.16 Laporan (Reports)
   - 6.17 Notifikasi
   - 6.18 Pengaturan (Settings)
   - 6.19 Audit Log
7. [Business Logic Notes](#7-business-logic-notes)
8. [Enum / Choice Values Reference](#8-enum--choice-values-reference)
9. [Role-Based Access Matrix](#9-role-based-access-matrix)

## 1. System Overview

TaniGo Luwu is an agricultural supply business management platform. Two frontend applications share one Django REST Framework backend:

| App | Purpose | Base URL prefix |
|-----|---------|-----------------|
| **CRM web** (`apps/crm`) | Full management: orders, inventory, reports, settings, users | No prefix — all routes are bare (e.g. `/orders`, `/users`) |
| **POS web** (`apps/pos`) | Point-of-sale terminal: shifts, transactions, branch inventory | `/api/` prefix (e.g. `/api/shifts/open`, `/api/transactions`) |

Both apps use JWT Bearer tokens stored in `localStorage`. The CRM stores tokens under keys `accessToken` / `refreshToken`; the POS uses `access_token` / `refresh_token`. Both token key names point to the same backend token system — the naming difference is client-side only.

## 2. Authentication & Session

### Mechanism
- **JWT Bearer tokens**: all protected requests send `Authorization: Bearer <accessToken>` header.
- **Access token**: short-lived (exact TTL configurable). Attached to every API request.
- **Refresh token**: longer-lived. Used to silently renew the access token when a 401 is received.
- On 401 with no refresh token (or failed refresh), the client clears local storage and redirects to `/login`.

### Auth state persisted on client
The Zustand auth store (`tanigo-auth` key in localStorage) persists:
```
{ user, accessToken, refreshToken, isAuthenticated }
```
The `user` object is also duplicated under the `user` key in localStorage (CRM) / `auth_user` key (POS) for quick in-interceptor access without store hydration.

### User Object
Returned from login and `GET /auth/me`. All user-facing APIs that return author/actor fields embed denormalized `userId + userName` (not a nested object).

```
User {
  id          : string (UUID)
  nama        : string
  email       : string (unique)
  role        : UserRole  — see enum below
  cabangId    : string | null  — FK to Cabang; null for superadmin
  cabang      : string | null  — denormalized branch name (read-only, computed)
  tipeCabang  : 'toko' | 'gudang' | null  — denormalized (read-only, computed)
  aktif       : boolean
  createdAt   : ISO 8601 string
  updatedAt   : ISO 8601 string
}
```

### Roles
```
UserRole = 'superadmin' | 'admin' | 'manajer' | 'kasir' | 'staf_gudang'
```

- **superadmin**: global, no cabang affiliation (`cabangId = null`)
- **admin**: can be assigned to any cabang
- **manajer**: branch manager (toko or gudang)
- **kasir**: cashier, assigned to a toko branch
- **staf_gudang**: warehouse staff, assigned to a gudang branch

## 3. Data Models

### 3.1 Cabang (Branch)

```
Cabang {
  id        : string (UUID/slug)
  nama      : string
  tipe      : 'toko' | 'gudang'
  lokasi    : string (address/description)
  telepon   : string
  aktif     : boolean  (default: true)
  createdAt : ISO 8601
  updatedAt : ISO 8601
}
```

### 3.2 User

See Section 2. Passwords are never returned from any endpoint.

### 3.3 Produk (Product Master Catalog)

```
Produk {
  id                  : string
  nama                : string
  sku                 : string (unique, auto-generatable)
  kategori            : KategoriProduk  — see enum
  satuan              : string (e.g. 'karung', 'kg', 'botol', 'unit')
  hargaBeli           : integer (IDR)
  hargaJual           : integer (IDR)
  stok                : integer  — global/master stock counter (legacy; real stock lives in CabangInventory)
  lokasiRak           : string
  tanggalKedaluwarsa  : date string | null
  foto                : string (URL) | null
  thresholdStok       : integer  — stock-alert threshold; triggers 'menipis' status
  statusAktif         : boolean
  statusStok          : 'normal' | 'menipis' | 'habis'  — computed field
  supplierId          : string | null  — FK to Supplier
  createdAt           : ISO 8601
  updatedAt           : ISO 8601
}
```

**`statusStok` computation rule**: `habis` if stok == 0; `menipis` if stok > 0 AND stok <= thresholdStok; `normal` otherwise.

### 3.4 CabangInventory (Per-Branch Stock)

This is the live, per-branch stock ledger. It is separate from `Produk.stok`.

```
CabangInventory {
  id         : string
  cabangId   : string (FK to Cabang)
  produkId   : string (FK to Produk)
  produkNama : string (denormalized)
  produkSku  : string (denormalized)
  satuan     : string (denormalized)
  stok       : integer
  updatedAt  : ISO 8601
}
```

Unique constraint: `(cabangId, produkId)`. If a record does not exist for a given `(cabangId, produkId)` pair, stok is implicitly 0. The backend must upsert, not insert-or-fail.

### 3.5 PergerakanStok (Stock Movement / Ledger)

```
PergerakanStok {
  id           : string
  produkId     : string (FK)
  produkNama   : string (denormalized)
  produkSku    : string (denormalized)
  cabangId     : string (FK)  — lokasi (cabang) tempat pergerakan terjadi
  cabangNama   : string (denormalized)
  jenis        : 'masuk' | 'keluar' | 'penyesuaian'
  jumlah       : integer (can be negative for 'keluar')
  stokSebelum  : integer
  stokSesudah  : integer
  referensi    : string | null  — e.g. order number, PO number, transfer number
  userId       : string
  userNama     : string (denormalized)
  catatan      : string | null
  alasan       : AlasanPenyesuaian | null  — only populated for 'penyesuaian'
  createdAt    : ISO 8601
}
```

### 3.6 Supplier

```
Supplier {
  id             : string
  nama           : string
  kontak         : string (phone/email)
  alamat         : string
  produkDisuplai : string[]  — list of product names (informational, not FK)
  createdAt      : ISO 8601
  updatedAt      : ISO 8601
}
```

### 3.7 Pesanan (Order)

```
Pesanan {
  id                : string
  nomorPesanan      : string (unique, e.g. 'ORD-2026-001')
  pelangganId       : string | null  — FK to PelangganVIP (nullable for guest)
  pelangganNama     : string
  pelangganTelepon  : string | null
  items             : ItemPesanan[]
  subtotal          : integer (IDR)
  diskon            : integer (IDR, default 0)
  total             : integer (IDR) = subtotal - diskon
  metodePembayaran  : MetodePembayaran  — see enum
  metodePengiriman  : 'ambil_sendiri' | 'dikirim'
  alamatPengiriman  : string | null
  status            : StatusPesanan  — see enum
  catatan           : string | null
  kasirId           : string (FK to User)
  kasirNama         : string (denormalized)
  sumber            : 'pos' | 'manual'
  hasRetur          : boolean (default false)
  returNominal      : integer | null
  returItems        : ReturItem[] | null
  createdAt         : ISO 8601
  updatedAt         : ISO 8601
}

ItemPesanan {
  id           : string
  produkId     : string (FK)
  produkNama   : string (denormalized)
  produkSku    : string (denormalized)
  qty          : integer
  hargaSatuan  : integer (IDR)
  subtotal     : integer = qty * hargaSatuan
}

ReturItem {
  produkId    : string
  produkNama  : string
  qty         : integer
  nominal     : integer (IDR) = hargaSatuan * qty
}
```

### 3.8 Pengiriman (Delivery)

```
Pengiriman {
  id                    : string
  nomorPengiriman       : string (unique, e.g. 'PG-2026-001')
  pesananIds            : string[]  — list of order IDs in this delivery batch
  pesananList           : PesananListItem[]  — denormalized order summaries
  driverId              : string | null  — FK to User
  driverNama            : string
  tanggalPengiriman     : date string
  estimasiWaktu         : string | null
  status                : StatusPengiriman  — see enum
  biaya                 : BiayaPengiriman | null
  buktiFoto             : string (URL) | null
  catatanHasil          : string | null
  alasanGagal           : string | null
  catatan               : string | null
  checklistItems        : ChecklistPesanan[] | null
  checklistSubmittedAt  : ISO 8601 | null
  createdAt             : ISO 8601
  updatedAt             : ISO 8601
}

BiayaPengiriman {
  bbm                 : integer (IDR)
  upahDriver          : integer (IDR)
  tol                 : integer (IDR)
  lainnya             : integer (IDR)
  keteranganLainnya   : string | null
  total               : integer (IDR)  — computed: bbm + upahDriver + tol + lainnya
}

PesananListItem {
  id            : string
  nomorPesanan  : string
  pelangganNama : string
  alamat        : string
  items         : { produkNama, produkSku, qty, satuan }[] | null
}

ChecklistPesanan {
  pesananId      : string
  nomorPesanan   : string
  pelangganNama  : string
  alamat         : string
  status         : 'terkirim' | 'dikembalikan'
  catatan        : string | null
}
```

### 3.9 TransferStok (Stock Transfer)

```
TransferStok {
  id             : string
  nomorTransfer  : string (unique, e.g. 'TS-2026-001')
  tokoId         : string (FK to Cabang, tipe='toko')
  tokNama        : string (denormalized)
  gudangId       : string (FK to Cabang, tipe='gudang')
  gudangNama     : string (denormalized)
  items          : TransferStokItem[]
  status         : StatusTransferStok  — see enum
  catatanToko    : string | null
  catatanGudang  : string | null
  createdAt      : ISO 8601
  approvedAt     : ISO 8601 | null
  shippedAt      : ISO 8601 | null
  receivedAt     : ISO 8601 | null
  updatedAt      : ISO 8601
}

TransferStokItem {
  id                : string
  produkId          : string (FK)
  produkNama        : string (denormalized)
  produkSku         : string (denormalized)
  satuan            : string (denormalized)
  qtyDiminta        : integer
  qtyDisetujui      : integer | null
  qtyDiterima       : integer | null
  statusPenerimaan  : 'diterima' | 'dikembalikan' | null
}
```

### 3.10 StokOpname (Physical Inventory Count)

```
StokOpname {
  id           : string
  nomorOpname  : string (unique, e.g. 'SO-2026-001')
  cabangId     : string (FK to Cabang)
  cabangNama   : string (denormalized)
  status       : StatusStokOpname  — see enum
  items        : StokOpnameItem[]
  catatan      : string | null
  submittedAt  : ISO 8601 | null
  approvedAt   : ISO 8601 | null
  createdAt    : ISO 8601
  updatedAt    : ISO 8601
}

StokOpnameItem {
  id          : string
  produkId    : string (FK)
  produkNama  : string (denormalized)
  produkSku   : string (denormalized)
  satuan      : string (denormalized)
  stokSistem  : integer  — system count at time of opname creation
  stokFisik   : integer  — actual physical count entered by user
  selisih     : integer  — computed: stokFisik - stokSistem (can be negative)
}
```

### 3.11 PurchaseOrder

```
PurchaseOrder {
  id                   : string
  nomorPO              : string (unique, e.g. 'PO-2026-001')
  supplierId           : string (FK to Supplier)
  supplierNama         : string (denormalized)
  items                : ItemPO[]
  biayaTambahan        : BiayaTambahan
  totalHargaBarang     : integer (IDR)  — sum of item subtotals
  totalBiayaTambahan   : integer (IDR)  — sum of biayaTambahan fields
  totalKeseluruhan     : integer (IDR)  — totalHargaBarang + totalBiayaTambahan
  hppPerUnit           : integer (IDR)  — totalKeseluruhan / totalQty
  totalQty             : integer        — sum of qtyPesan across all items
  status               : StatusPO  — see enum
  statusPembayaran     : StatusPembayaranPO  — see enum
  totalDibayar         : integer (IDR, default 0)
  sisaHutang           : integer (IDR)  — totalKeseluruhan - totalDibayar
  catatan              : string | null
  estimasiTanggalTiba  : date string | null
  createdAt            : ISO 8601
  updatedAt            : ISO 8601
}

ItemPO {
  id          : string
  produkId    : string (FK)
  produkNama  : string (denormalized)
  produkSku   : string (denormalized)
  qtyPesan    : integer
  qtyDiterima : integer (default 0)
  hargaBeli   : integer (IDR)
  subtotal    : integer = qtyPesan * hargaBeli
}

BiayaTambahan {
  ongkosKirim         : integer (IDR, default 0)
  biayaBongkarMuat    : integer (IDR, default 0)
  upahKurir           : integer (IDR, default 0)
  lainnya             : integer (IDR, default 0)
  keteranganLainnya   : string | null
}

PembayaranPO {
  id               : string
  purchaseOrderId  : string (FK)
  nominal          : integer (IDR)
  tanggal          : date string
  metode           : 'Transfer' | 'Tunai' | 'Cek'
  catatan          : string | null
}
```

### 3.12 PelangganVIP (VIP Customer)

```
PelangganVIP {
  id              : string
  namaLengkap     : string
  nomorTelepon    : string
  alamat          : string
  creditLimit     : integer (IDR)
  kreditTerpakai  : integer (IDR, default 0)
  sisaKredit      : integer (IDR)  — computed: creditLimit - kreditTerpakai
  statusKredit    : StatusKreditPelanggan  — computed, see enum
  status          : 'aktif' | 'suspend'
  catatan         : string | null
  createdAt       : ISO 8601
  updatedAt       : ISO 8601
}
```

**`statusKredit` computation rule**:
- `melebihi_limit` if kreditTerpakai > creditLimit
- `mendekati_limit` if kreditTerpakai > creditLimit * 0.85
- `aman` otherwise

### 3.13 TagihanVIP (VIP Customer Invoice/Bill)

```
TagihanVIP {
  id            : string
  pelangganId   : string (FK to PelangganVIP)
  nomorOrder    : string  — the order's nomorPesanan
  tanggal       : date string
  total         : integer (IDR)
  jumlahDibayar : integer (IDR, default 0)
  sisaTagihan   : integer (IDR)  — computed: total - jumlahDibayar
  dueDate       : date string | null
  status        : StatusTagihan  — see enum
}
```

**`status` computation rule**: `Lunas` if sisaTagihan == 0; `Jatuh Tempo` if past dueDate and not Lunas; `Sebagian` if jumlahDibayar > 0 and not Lunas; `Belum Bayar` otherwise.

### 3.14 Shift (POS Shift)

Two representations exist — one used by CRM reports, one used by POS app. The backend should store one unified model and return different shapes via different serializers or the same model with conditional fields.

**CRM Shift model** (used in reports):
```
Shift {
  id                : string
  kasirId           : string (FK to User)
  kasirNama         : string (denormalized)
  cabangId          : string (FK to Cabang)
  cabangNama        : string (denormalized)
  modalAwal         : integer (IDR)  — opening cash
  saldoAkhir        : integer | null  — closing cash (null while shift active)
  totalTransaksi    : integer         — count of transactions
  totalPendapatan   : integer (IDR)   — total revenue
  totalTunai        : integer (IDR)
  totalNonTunai     : integer (IDR)
  totalDiskon       : integer (IDR)
  catatanPenutupan  : string | null
  status            : 'Aktif' | 'Selesai'
  mulaiAt           : ISO 8601
  selesaiAt         : ISO 8601 | null
  createdAt         : ISO 8601
  updatedAt         : ISO 8601
}
```

**POS Shift model** (used in POS app):
```
Shift (POS) {
  id                      : string
  kasirId                 : string
  kasirNama               : string
  cabang                  : string  — branch name (single string, not ID)
  waktuBuka               : ISO 8601
  waktuTutup              : ISO 8601 | null
  saldoAwal               : integer (IDR)
  saldoAkhir              : integer | null
  totalTransaksi          : integer
  totalPenjualan          : integer (IDR)
  totalPenjualanTunai     : integer (IDR)
  totalPenjualanQRIS      : integer (IDR)
  totalPenjualanTransfer  : integer (IDR)
  totalDiskon             : integer (IDR)
  totalRetur              : integer (IDR)
  status                  : 'aktif' | 'tutup'
}
```

**Recommendation**: Store one model. Serve the CRM representation from `/reports/shift` (aggregated) and the detail Shift model; serve the POS representation from `/api/shifts/*`. Map fields: `mulaiAt ↔ waktuBuka`, `selesaiAt ↔ waktuTutup`, `modalAwal ↔ saldoAwal`.

### 3.15 Transaksi POS (POS Transaction)

```
Transaksi {
  id          : string
  nomorStruk  : string (unique, e.g. 'STR-20260515-1234')
  items       : ItemTransaksi[]
  subtotal    : integer (IDR)
  totalDiskon : integer (IDR)
  total       : integer (IDR)
  pembayaran  : PembayaranSplit[]
  kembalian   : integer (IDR)  — computed: tunai.nominal - total (if any Tunai payment)
  kasirId     : string (FK to User)
  kasirNama   : string (denormalized)
  shiftId     : string (FK to Shift)
  createdAt   : ISO 8601
}

ItemTransaksi {
  id          : string
  produkId    : string (FK)
  produkNama  : string (denormalized)
  produkSku   : string (denormalized)
  satuan      : string (denormalized)
  qty         : integer
  hargaSatuan : integer (IDR)
  diskon      : integer (IDR, default 0)  — per-item discount amount
  subtotal    : integer = (hargaSatuan * qty) - diskon
}

PembayaranSplit {
  metode   : 'Tunai' | 'QRIS' | 'Transfer Bank'
  nominal  : integer (IDR)
}
```

### 3.16 Retur Transaksi POS

```
Retur {
  id           : string
  transaksiId  : string (FK to Transaksi)
  nomorStruk   : string (denormalized)
  items        : ItemRetur[]
  totalRefund  : integer (IDR)
  metodeRefund : 'Tunai' | 'Kredit'
  kasirId      : string
  kasirNama    : string
  createdAt    : ISO 8601
}

ItemRetur {
  itemTransaksiId : string (FK to ItemTransaksi)
  produkId        : string
  produkNama      : string
  produkSku       : string
  satuan          : string
  qty             : integer
  hargaSatuan     : integer
  subtotal        : integer
}
```

### 3.17 Notifikasi

```
Notifikasi {
  id              : string
  judul           : string
  pesan           : string (body text)
  tipe            : 'info' | 'peringatan' | 'penting'
  targetCabang    : string[] | 'semua'  — list of cabangIds OR literal 'semua'
  targetRole      : string[] | 'semua'  — list of role strings OR literal 'semua'
  createdBy       : string (FK to User)
  createdByNama   : string (denormalized)
  readByUserIds   : string[]  — list of userIds who have read this notification
  createdAt       : ISO 8601
}
```

When returned to a requesting user, add a computed field:
```
  isRead : boolean  — true if requesting user's id is in readByUserIds
```

### 3.18 AuditLog

```
AuditLog {
  id         : string
  userId     : string (FK to User)
  userNama   : string (denormalized)
  modul      : string (e.g. 'pesanan', 'produk', 'users')
  aksi       : string (e.g. 'CREATE', 'UPDATE', 'DELETE')
  nilaiLama  : JSON | null  — previous state snapshot
  nilaiBaru  : JSON | null  — new state snapshot
  ipAddress  : string | null
  createdAt  : ISO 8601
}
```

### 3.19 InfoToko (Store Settings)

```
InfoToko {
  nama     : string
  alamat   : string
  telepon  : string
}
```

### 3.20 KategoriProdukSetting

```
KategoriProdukSetting {
  id        : string
  nama      : string
  deskripsi : string | null
}
```

## 4. Standard Response Envelope

All endpoints wrap their return value in a consistent envelope:

```json
{
  "success": true,
  "message": "OK",
  "data": <payload>
}
```

For errors:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": {
    "fieldName": ["error detail 1", "error detail 2"]
  }
}
```

HTTP status codes: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`, `500 Internal Server Error`.

## 5. Pagination Convention

All list endpoints that return paginated data use these query parameters:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 25 | Items per page |
| `search` | string | — | Full-text search filter |
| `sortBy` | string | — | Field name to sort by |
| `sortOrder` | `'asc'` \| `'desc'` | — | Sort direction |

Paginated response `data` payload:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 25,
    "totalPages": 4
  }
}
```

**Sorting behavior (wajib diimplementasikan per endpoint).** Frontend
(`<DataTable />`) memakai server-side sorting (`manualSorting: true`), jadi klik
header kolom tidak berarti apa-apa kecuali backend menerapkan ordering:
- `sortBy` berisi nama field versi API (camelCase, mis. `hargaJual`); backend
  memetakannya ke kolom/anotasi ORM lalu `ORDER BY` sebelum pagination.
- `sortBy` kosong → pakai ordering default endpoint (biasanya `createdAt` desc).
- `sortOrder` kosong tapi `sortBy` ada → default `asc`.
- Whitelist field yang boleh di-sort per endpoint; `sortBy` di luar whitelist
  diabaikan (fallback default) atau `400`. Sertakan tie-breaker stabil (mis. `id`)
  agar pagination konsisten.
- Detail field sortable per endpoint: lihat
  `docs/spec-backend-sorting-list-endpoints.md`.

## 6. API Endpoints by Domain

### 6.1 Auth

#### `POST /auth/login`
Authenticate a user with email and password.

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response `data`:**
```json
{
  "user": { ...User },
  "tokens": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

**Business logic:**
- Return the full `User` object (including `cabang`, `tipeCabang` denormalized from the user's assigned branch).
- Tokens are stored client-side. No server-side session.

#### `POST /auth/logout`
Invalidate the refresh token server-side (blacklist it).

**Request:** No body required (access token in header identifies the user).

**Response `data`:** `{}`

#### `POST /auth/refresh`
Exchange a valid refresh token for a new access token.

**Request body:**
```json
{
  "refreshToken": "string"
}
```

**Response `data`:**
```json
{
  "accessToken": "string"
}
```

**Note:** The POS app calls this at `POST /api/auth/refresh` (with `/api/` prefix). Both paths must work.

#### `GET /auth/me`
Return the authenticated user's profile.

**Response `data`:** `User`

#### `PATCH /auth/me`
Update the authenticated user's own profile.

**Request body:**
```json
{
  "nama": "string",
  "email": "string"
}
```

**Response `data`:** Updated `User`

#### `POST /auth/change-password`
Change the authenticated user's password.

**Request body:**
```json
{
  "passwordLama": "string",
  "passwordBaru": "string"
}
```

**Response `data`:** `{}`

**Business logic:** Validate `passwordLama` against stored hash before updating. Return 400 if either field is empty.

### 6.2 Cabang (Branches)

#### `GET /cabang`
List all branches (paginated).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `tipe` | `'toko'` \| `'gudang'` | Filter by branch type |
| `aktif` | boolean | Filter by active status |
| `search` | string | Search by nama or lokasi |
| `page` | integer | |
| `limit` | integer | |

**Response `data`:** `PaginatedResponse<Cabang>`

#### `POST /cabang`
Create a new branch.

**Request body:**
```json
{
  "nama": "string",
  "tipe": "toko | gudang",
  "lokasi": "string",
  "telepon": "string"
}
```

**Response `data`:** `Cabang` (HTTP 201)

**Business logic:** `aktif` defaults to `true`. `createdAt` and `updatedAt` set server-side.

#### `GET /cabang/{id}`
Get a single branch by ID.

**Response `data`:** `Cabang`

#### `PATCH /cabang/{id}`
Update a branch (also used for `toggleAktif`).

**Request body (all optional):**
```json
{
  "nama": "string",
  "lokasi": "string",
  "telepon": "string",
  "aktif": true
}
```

**Response `data`:** Updated `Cabang`

**Note:** `tipe` is not updatable via this endpoint (omitted from `UpdateCabangDto`).

### 6.3 Users

#### `GET /users`
List all users (paginated).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by `nama` or `email` |
| `cabangId` | string | Filter by branch |
| `role` | string | Filter by role |
| `page` | integer | |
| `limit` | integer | |
| `sortBy` | string | |
| `sortOrder` | string | |

**Response `data`:** `PaginatedResponse<User>`

#### `POST /users`
Create a new user.

**Request body:**
```json
{
  "nama": "string",
  "email": "string",
  "password": "string",
  "role": "UserRole",
  "cabangId": "string | null"
}
```

**Response `data`:** `User` (HTTP 201)

**Business logic:**
- Hash password before storage.
- Derive `cabang` (branch name) and `tipeCabang` from `cabangId` FK lookup.
- `aktif` defaults to `true`.

#### `GET /users/{id}`
Get a single user by ID.

**Response `data`:** `User`

#### `PATCH /users/{id}`
Update a user.

**Request body (all optional):**
```json
{
  "nama": "string",
  "role": "UserRole",
  "cabangId": "string | null",
  "aktif": true
}
```

**Response `data`:** Updated `User`

**Business logic:** When `cabangId` changes, re-derive and update the denormalized `cabang` and `tipeCabang` fields.

#### `POST /users/{id}/reset-password`
Reset a user's password (admin action).

**Request body:**
```json
{
  "passwordBaru": "string"
}
```

**Response `data`:** `{}`

#### `DELETE /users/{id}`
Hard-delete a user record.

**Response `data`:** `{}`

### 6.4 Produk (Products)

#### `GET /products`
List all products (paginated).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by `nama` or `sku` |
| `kategori` | KategoriProduk | Filter by category |
| `statusStok` | `'normal'` \| `'menipis'` \| `'habis'` | Filter by stock status |
| `satuan` | string | Filter by unit |
| `page` | integer | |
| `limit` | integer | |

**Response `data`:** `PaginatedResponse<Produk>`

#### `POST /products`
Create a new product.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nama` | string | yes | |
| `sku` | string | no | Auto-generated if omitted (see `generate-sku`) |
| `kategori` | KategoriProduk | yes | |
| `satuan` | string | yes | |
| `hargaBeli` | integer | yes | |
| `hargaJual` | integer | yes | |
| `stokAwal` | integer | yes | Initial stock quantity |
| `lokasiRak` | string | yes | |
| `tanggalKedaluwarsa` | date string | no | |
| `foto` | File | no | Image upload |
| `thresholdStok` | integer | yes | |
| `statusAktif` | boolean | yes | |

**Response `data`:** `Produk` (HTTP 201)

**Business logic:** Compute `statusStok` from `stok` and `thresholdStok`. When `foto` is uploaded, store it and return a URL.

#### `GET /products/generate-sku`
Generate a unique SKU for a new product.

**Response `data`:**
```json
{ "sku": "string" }
```

**Note:** This route must be registered before `GET /products/{id}` in URL routing to avoid `generate-sku` being interpreted as an ID.

#### `GET /products/{id}`
Get a single product by ID.

**Response `data`:** `Produk`

#### `PATCH /products/{id}`
Update a product.

**Request:** `multipart/form-data` (same fields as create, all optional)

**Response `data`:** Updated `Produk`

#### `DELETE /products/{id}`
Delete a product.

**Response `data`:** `{}`

### 6.5 Inventori (Inventory)

#### `GET /cabang-inventory`
Get per-branch stock for a specific branch.

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `cabangId` | string | yes | Branch ID to query inventory for |

**Response `data`:** `CabangInventory[]` (non-paginated array)

**Business logic:**
- Returns all `CabangInventory` records for the given `cabangId`.
- For POS, the response should also include `hargaJual` (from the joined `Produk` table) since the POS inventory endpoint returns `POSInventoryItem` which is `CabangInventory` enriched with the sell price.

**POS-enriched response shape:**
```json
{
  "id": "...",
  "cabangId": "...",
  "produkId": "...",
  "produkNama": "...",
  "produkSku": "...",
  "satuan": "...",
  "stok": 120,
  "hargaJual": 110000,
  "updatedAt": "..."
}
```

#### `GET /inventory/dashboard`
Get stock dashboard summary for the current user's branch (or all branches for superadmin).

**Response `data`:**
```json
{
  "totalProduk": 42,
  "produkMenipis": 5,
  "produkHabis": 2,
  "produkKedaluwarsa30Hari": 3
}
```

**Business logic:**
- If `user.cabangId` is not null, filter to that branch's `CabangInventory`.
- If user is `superadmin` (cabangId = null), aggregate across all branches.
- `produkMenipis`: count of CabangInventory rows where `stok > 0` AND `stok <= produk.thresholdStok`.
- `produkHabis`: count of CabangInventory rows where `stok == 0`.
- `produkKedaluwarsa30Hari`: count of products where `tanggalKedaluwarsa` is within 30 days from today.

#### `GET /inventory/pergerakan`
List stock movement entries (paginated).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by `produkNama` or `produkSku` |
| `produkId` | string | Filter by product |
| `jenis` | `'masuk'` \| `'keluar'` \| `'penyesuaian'` | Filter by movement type |
| `cabangId` | string | Filter by location (cabang) |
| `page` | integer | |
| `limit` | integer | |

**Response `data`:** `PaginatedResponse<PergerakanStok>` (sorted newest-first)

**Data scoping by role:** the backend must scope results by the authenticated user
so that `stokSebelum`/`stokSesudah` read sequentially per location:
- `superadmin` — all movements across every cabang (frontend shows a **Lokasi** column).
- any other role — only movements where `cabangId` equals the user's own `cabangId`.

Detail (schema, backfill data lama, titik pencatatan `cabangId`): lihat
`docs/spec-backend-riwayat-pergerakan-lokasi-scoping.md`.

#### `POST /inventory/penyesuaian`
Manually adjust stock for a product at the current user's branch.

**Request body:**
```json
{
  "produkId": "string",
  "jumlah": 10,
  "alasan": "AlasanPenyesuaian",
  "catatan": "optional string"
}
```

**Response `data`:** `PergerakanStok` (HTTP 201)

**Business logic:**
- `jumlah` can be positive (add stock) or negative (reduce stock). Apply to `CabangInventory` for the user's current `cabangId`.
- Record `stokSebelum` and `stokSesudah` in the movement entry.
- `stokSesudah` must not go below 0 (clamp at 0).
- Set `jenis = 'penyesuaian'`.

### 6.6 Suppliers

#### `GET /suppliers`
List all suppliers (paginated).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by `nama` or `kontak` |
| `page` | integer | |
| `limit` | integer | |

**Response `data`:** `PaginatedResponse<Supplier>`

#### `POST /suppliers`
Create a new supplier.

**Request body:**
```json
{
  "nama": "string",
  "kontak": "string",
  "alamat": "string"
}
```

**Response `data`:** `Supplier` (HTTP 201)

#### `GET /suppliers/{id}`

**Response `data`:** `Supplier`

#### `PATCH /suppliers/{id}`

**Request body (all optional):**
```json
{
  "nama": "string",
  "kontak": "string",
  "alamat": "string"
}
```

**Response `data`:** Updated `Supplier`

#### `DELETE /suppliers/{id}`

**Response `data`:** `{}`

### 6.7 Pesanan (Orders)

#### `GET /orders`
List all orders (paginated).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by `nomorPesanan` or `pelangganNama` |
| `status` | StatusPesanan or `'ada_retur'` | Filter by status; `'ada_retur'` filters orders where `hasRetur = true` |
| `sumber` | `'pos'` \| `'manual'` | Filter by order source |
| `pelangganId` | string | Filter by VIP customer |
| `kasirId` | string | Filter by cashier |
| `tanggalDari` | date string | Start date filter |
| `tanggalSampai` | date string | End date filter |
| `page` | integer | |
| `limit` | integer | |

**Response `data`:** `PaginatedResponse<Pesanan>` (sorted newest-first by `createdAt`)

#### `POST /orders`
Create a new order.

**Request body:**
```json
{
  "pelangganId": "string (optional)",
  "pelangganNama": "string",
  "pelangganTelepon": "string (optional)",
  "items": [
    {
      "produkId": "string",
      "qty": 2,
      "hargaSatuan": 110000
    }
  ],
  "diskon": 0,
  "metodePembayaran": "MetodePembayaran",
  "metodePengiriman": "ambil_sendiri | dikirim",
  "alamatPengiriman": "string (optional)",
  "catatan": "string (optional)",
  "sumber": "pos | manual"
}
```

**Response `data`:** `Pesanan` (HTTP 201)

**Business logic:**
- Generate `nomorPesanan` (sequential, e.g. `ORD-2026-049`).
- Compute `subtotal` = sum of `qty * hargaSatuan` per item.
- Compute `total` = subtotal - diskon.
- Set `kasirId` and `kasirNama` from the authenticated user.
- If `sumber == 'pos'`: set `status = 'Selesai'` immediately (POS orders are always completed at creation). This also means stock should be deducted from `CabangInventory` at creation time.
- If `sumber == 'manual'`: set `status = 'Baru'`.
- `hasRetur` defaults to `false`.

#### `GET /orders/{id}`

**Response `data`:** `Pesanan`

#### `PATCH /orders/{id}/status`
Update the status of an order.

**Request body:**
```json
{
  "status": "StatusPesanan",
  "catatan": "optional string"
}
```

**Response `data`:** Updated `Pesanan`

#### `GET /orders/{id}/struk`
Generate and return a receipt (struk) as a PDF.

**Response:** `Blob` (binary, `Content-Type: application/pdf`)

#### `GET /orders/{id}/surat-jalan`
Generate and return a delivery order document as a PDF.

**Response:** `Blob` (binary, `Content-Type: application/pdf`)

#### `POST /orders/{id}/retur`
Process a return for items in an order.

**Request body:**
```json
{
  "items": [
    { "produkId": "string", "qty": 1 }
  ],
  "alasan": "string"
}
```

**Response `data`:** Updated `Pesanan`

**Business logic:**
- Restore stock: add `qty` back to `CabangInventory` for the branch where the order's kasir is assigned.
- Compute `returNominal`: sum of `(hargaSatuan * qty)` for each returned item, looked up from the order's `items`.
- Populate `returItems` array with `{ produkId, produkNama, qty, nominal }`.
- Set `hasRetur = true` on the order.
- Do not change the order `status`.
- An order can only have retur processed once (guard: if `hasRetur` is already `true`, reject or merge).

### 6.8 Pengiriman (Deliveries)

#### `GET /deliveries`
List all deliveries (paginated).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by `nomorPengiriman` or `driverNama` |
| `status` | StatusPengiriman | Filter by status |
| `driverId` | string | Filter by driver |
| `tanggalDari` | date string | |
| `tanggalSampai` | date string | |
| `page` | integer | |
| `limit` | integer | |

**Response `data`:** `PaginatedResponse<Pengiriman>`

#### `POST /deliveries`
Create a new delivery batch.

**Request body:**
```json
{
  "pesananIds": ["string"],
  "driverId": "string (optional)",
  "driverNama": "string",
  "tanggalPengiriman": "date string",
  "estimasiWaktu": "string (optional)",
  "catatan": "string (optional)"
}
```

**Response `data`:** `Pengiriman` (HTTP 201)

**Business logic:**
- Generate `nomorPengiriman` (sequential, e.g. `PG-2026-001`).
- Set `status = 'Dijadwalkan'`.
- Populate `pesananList` by looking up each `pesananId` and denormalizing order + customer data.

#### `GET /deliveries/{id}`

**Response `data`:** `Pengiriman`

#### `PATCH /deliveries/{id}/status`
Update delivery status.

**Request body:**
```json
{
  "status": "StatusPengiriman",
  "alasanGagal": "string (required if status=Gagal)",
  "catatanHasil": "string (optional, used when status=Selesai)"
}
```

**Response `data`:** Updated `Pengiriman`

**Business logic:**
- When `status = 'Selesai'`, set `checklistSubmittedAt` if not already set.
- When `status = 'Gagal'`, require and store `alasanGagal`.

#### `PATCH /deliveries/{id}/biaya`
Update delivery cost breakdown.

**Request body:**
```json
{
  "bbm": 50000,
  "upahDriver": 100000,
  "tol": 20000,
  "lainnya": 0,
  "keteranganLainnya": "optional string"
}
```

**Response `data`:** Updated `Pengiriman`

**Business logic:** Compute `biaya.total = bbm + upahDriver + tol + lainnya` server-side.

#### `POST /deliveries/{id}/bukti`
Upload delivery proof photo.

**Request:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `foto` | File | yes |

**Response `data`:** Updated `Pengiriman` (with `buktiFoto` URL populated)

#### `POST /deliveries/{id}/checklist`
Submit the delivery checklist (per-order delivery outcomes).

**Request body:**
```json
{
  "items": [
    {
      "pesananId": "string",
      "status": "terkirim | dikembalikan",
      "catatan": "optional string"
    }
  ]
}
```

**Response `data`:** Updated `Pengiriman`

**Business logic:** Set `checklistItems` and `checklistSubmittedAt` server-side.

### 6.9 Transfer Stok

#### `GET /transfer-stok`
List all stock transfers (paginated).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by `nomorTransfer` or `tokNama` |
| `status` | StatusTransferStok | Filter by status |
| `page` | integer | |
| `limit` | integer | |

**Response `data`:** `PaginatedResponse<TransferStok>`

#### `POST /transfer-stok`
Create a new stock transfer request (initiated by a toko).

**Request body:**
```json
{
  "gudangId": "string",
  "items": [
    {
      "produkId": "string",
      "qtyDiminta": 10,
      "satuan": "string"
    }
  ],
  "catatan": "optional string"
}
```

**Response `data`:** `TransferStok` (HTTP 201)

**Business logic:**
- Set `tokoId` from the authenticated user's `cabangId`.
- Populate `tokNama` and `gudangNama` from branch lookups.
- Set `status = 'Menunggu Persetujuan'`.
- Generate `nomorTransfer`.

#### `GET /transfer-stok/{id}`

**Response `data`:** `TransferStok`

#### `PATCH /transfer-stok/{id}/approve`
Approve a transfer request (gudang action).

**Request body:**
```json
{
  "items": [
    { "transferItemId": "string", "qtyDisetujui": 8 }
  ],
  "catatan": "optional string"
}
```

**Response `data`:** Updated `TransferStok`

**Business logic:**
- Set `status = 'Disetujui'`, set `approvedAt`.
- Update each item's `qtyDisetujui` (default to `qtyDiminta` if item not specified).
- **Deduct `qtyDisetujui` from gudang's `CabangInventory`** for each item.
- Record `PergerakanStok` entries for each deduction (jenis = 'keluar', referensi = nomorTransfer).

#### `PATCH /transfer-stok/{id}/tolak`
Reject a transfer request.

**Request body:**
```json
{
  "catatan": "optional string"
}
```

**Response `data`:** Updated `TransferStok`

**Business logic:** Set `status = 'Ditolak'`. Restore no stock (deduction only happens on approve).

#### `PATCH /transfer-stok/{id}/kirim`
Mark transfer as shipped (gudang dispatches goods).

**Request body:** None required.

**Response `data`:** Updated `TransferStok`

**Business logic:** Set `status = 'Dikirim'`, set `shippedAt`.

#### `PATCH /transfer-stok/{id}/terima`
Confirm receipt of transferred goods (toko confirms).

**Request body:**
```json
{
  "items": [
    {
      "transferItemId": "string",
      "qtyDiterima": 8,
      "status": "diterima | dikembalikan"
    }
  ],
  "catatan": "optional string"
}
```

**Response `data`:** Updated `TransferStok`

**Business logic:**
- Set `status = 'Selesai'`, set `receivedAt`.
- Update each item's `qtyDiterima` and `statusPenerimaan`.
- **Add `qtyDiterima` to toko's `CabangInventory`** for each item where `qtyDiterima > 0`.
- Record `PergerakanStok` entries for each addition (jenis = 'masuk', referensi = nomorTransfer).

#### `GET /transfer-stok/badge-count`
Count of transfer documents needing the authenticated user's attention (sidebar badge).
Role-aware; server derives scope from the user's role + `cabangId`.

**Response `data`:**
```json
{ "count": 3 }
```

**Business logic:**
- **Gudang (admin / staf_gudang):** count transfers with `status = 'Menunggu Persetujuan'` where `gudangId == user.cabangId`.
- **Manajer (toko):** count transfers with `status IN ('Disetujui', 'Ditolak', 'Dikirim')` where `tokoId == user.cabangId` that the user has **not** acknowledged (see `/acknowledge`).
- Acknowledgement is keyed by `(transferId, status)`, so a later status change re-surfaces the document.

> If this endpoint is absent, the frontend falls back to computing the count from `GET /transfer-stok` and persisting acknowledgement client-side. See `docs/spec-backend-transfer-stok-badge.md`.

#### `POST /transfer-stok/acknowledge`
Mark **all** documents currently actionable for the authenticated user (at their current status) as read. Called when the user opens the Transfer Stok page so the badge auto-clears.

**Request body:** _(empty)_

**Response `data`:**
```json
{ "acknowledged": 2 }
```

**Business logic:**
- Persist `TransferAcknowledgement(userId, transferId, status, acknowledgedAt)` with a unique constraint on `(userId, transferId, status)` (idempotent).
- Only affects the badge for `manajer`; gudang's badge clears naturally when documents leave `Menunggu Persetujuan`.

### 6.10 Stok Opname

#### `GET /stok-opname`
List all stock opname records (paginated).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | StatusStokOpname | Filter by status |
| `cabangId` | string | Filter by branch |
| `page` | integer | |
| `limit` | integer | |

**Response `data`:** `PaginatedResponse<StokOpname>` (sorted newest-first)

#### `POST /stok-opname`
Create a new stock opname (physical count) record.

**Request body:**
```json
{
  "items": [
    {
      "produkId": "string",
      "stokSistem": 120,
      "stokFisik": 115
    }
  ],
  "catatan": "optional string"
}
```

**Response `data`:** `StokOpname` (HTTP 201)

**Business logic:**
- Derive `cabangId` from authenticated user's `cabangId`.
- `stokSistem`: if not supplied by client, look it up from current `CabangInventory` at creation time. The client may supply it explicitly.
- Compute `selisih = stokFisik - stokSistem` for each item.
- Set `status = 'Draft'`.
- Generate `nomorOpname`.

#### `GET /stok-opname/{id}`

**Response `data`:** `StokOpname`

#### `POST /stok-opname/{id}/submit`
Submit opname for review (manajer action).

**Request body:** None.

**Response `data`:** Updated `StokOpname`

**Business logic:** Set `status = 'Diajukan'`, set `submittedAt`.

#### `POST /stok-opname/{id}/approve`
Approve opname and apply stock reconciliation (superadmin/admin action).

**Request body:** None.

**Response `data`:** Updated `StokOpname`

**Business logic:**
- Set `status = 'Disetujui'`, set `approvedAt`.
- For each item in the opname: **upsert the `CabangInventory` record** for `(cabangId, produkId)` to `stokFisik` (overwrite system count with physical count).
- Record `PergerakanStok` entries for each item where `selisih != 0` (jenis = 'penyesuaian', referensi = nomorOpname).

#### `DELETE /stok-opname/{id}`
Delete a Draft opname.

**Response `data`:** `{}`

**Business logic:** Only allow deletion if `status == 'Draft'`. Reject with 400/403 otherwise.

### 6.11 Purchase Orders

#### `GET /purchase-orders`
List all purchase orders (paginated).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by `nomorPO` or `supplierNama` |
| `status` | StatusPO | Filter by PO status |
| `supplierId` | string | Filter by supplier |
| `page` | integer | |
| `limit` | integer | |

**Response `data`:** `PaginatedResponse<PurchaseOrder>`

#### `POST /purchase-orders`
Create a new purchase order.

**Request body:**
```json
{
  "supplierId": "string",
  "items": [
    {
      "produkId": "string",
      "qtyPesan": 100,
      "hargaBeli": 85000
    }
  ],
  "biayaTambahan": {
    "ongkosKirim": 50000,
    "biayaBongkarMuat": 0,
    "upahKurir": 0,
    "lainnya": 0,
    "keteranganLainnya": null
  },
  "catatan": "optional string",
  "estimasiTanggalTiba": "date string (optional)"
}
```

**Response `data`:** `PurchaseOrder` (HTTP 201)

**Business logic:**
- Compute `subtotal = qtyPesan * hargaBeli` per item.
- Compute `totalHargaBarang = sum(subtotal)`.
- Compute `totalBiayaTambahan = sum of biayaTambahan fields`.
- Compute `totalKeseluruhan = totalHargaBarang + totalBiayaTambahan`.
- Compute `totalQty = sum(qtyPesan)`.
- Compute `hppPerUnit = totalKeseluruhan / totalQty` (round to integer).
- Set `status = 'Draft'`, `statusPembayaran = 'Belum Bayar'`, `totalDibayar = 0`, `sisaHutang = totalKeseluruhan`.
- Populate `supplierNama` from supplier FK.
- **Do NOT generate the official `nomorPO` yet.** A draft is a provisional document; assign a temporary marker instead (e.g. `nomorPO = 'DRAFT-' + short uuid`, or leave it blank/`-`). The official sequential number (`PO-YEAR-NNN`) is only issued when the PO is sent to the supplier (see `/kirim`). This prevents gaps/burned numbers from drafts that are later edited or cancelled.

#### `GET /purchase-orders/{id}`

**Response `data`:** `PurchaseOrder`

#### `PATCH /purchase-orders/{id}`
Edit a Draft purchase order (items, biaya tambahan, supplier, catatan, estimasiTanggalTiba).

**Request body:** Same shape as `POST /purchase-orders`.

**Response `data`:** Updated `PurchaseOrder`

**Business logic:**
- **Only allowed when `status == 'Draft'`.** Reject with 422 otherwise.
- Rebuild items and recompute all financial totals exactly as in `POST` (`totalHargaBarang`, `totalBiayaTambahan`, `totalKeseluruhan`, `totalQty`, `hppPerUnit`, `sisaHutang = totalKeseluruhan - totalDibayar`).
- Keep `id`, `nomorPO` (still the draft marker), `status`, and `createdAt` unchanged; bump `updatedAt`.

#### `POST /purchase-orders/{id}/kirim`
Send PO to supplier (changes status from Draft).

**Request body:** None.

**Response `data`:** Updated `PurchaseOrder`

**Business logic:**
- **Generate the official `nomorPO` here** (`PO-YEAR-NNN`, zero-padded sequential) if the PO still carries a draft marker. This is the point the document becomes official.
- Set `status = 'Dikirim ke Supplier'`.

#### `POST /purchase-orders/{id}/goods-receipt`
Record goods received against a PO.

**Request body:**
```json
{
  "items": [
    { "itemId": "string", "qtyDiterima": 95 }
  ]
}
```

**Response `data`:** Updated `PurchaseOrder`

**Business logic:**
- Update each `ItemPO.qtyDiterima`.
- Set `status = 'Diterima'` if all items have `qtyDiterima >= qtyPesan`; otherwise `'Sebagian Diterima'`.
- **Add received qty to gudang `CabangInventory`**: use the authenticated user's `cabangId` as the target branch.
- Record `PergerakanStok` entries (jenis = 'masuk', referensi = nomorPO).

#### `POST /purchase-orders/{id}/batalkan`
Cancel a purchase order.

**Request body:**
```json
{
  "alasan": "string"
}
```

**Response `data`:** Updated `PurchaseOrder`

**Business logic:** Set `status = 'Dibatalkan'`, store `alasan` in `catatan`, set `sisaHutang = 0`.

#### `GET /purchase-orders/{id}/pembayaran`
List all payment records for a PO.

**Response `data`:** `PembayaranPO[]` (non-paginated)

#### `POST /purchase-orders/{id}/pembayaran`
Record a payment against a PO.

**Request body:**
```json
{
  "nominal": 5000000,
  "tanggal": "date string",
  "metode": "Transfer | Tunai | Cek",
  "catatan": "optional string"
}
```

**Response `data`:** `PembayaranPO` (HTTP 201)

**Business logic:**
- Create new `PembayaranPO` record.
- Update parent PO: `totalDibayar += nominal`, `sisaHutang = max(0, totalKeseluruhan - totalDibayar)`.
- Recompute `statusPembayaran`: `'Lunas'` if `sisaHutang == 0`; else `'Sebagian'`.

### 6.12 Pelanggan VIP

#### `GET /customers/vip`
List all VIP customers (paginated).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by `namaLengkap` or `nomorTelepon` |
| `status` | `'aktif'` \| `'suspend'` | Filter by account status |
| `statusKredit` | StatusKreditPelanggan | Filter by credit status |
| `page` | integer | |
| `limit` | integer | |

**Response `data`:** `PaginatedResponse<PelangganVIP>`

#### `POST /customers/vip`
Create a new VIP customer.

**Request body:**
```json
{
  "namaLengkap": "string",
  "nomorTelepon": "string",
  "alamat": "string",
  "creditLimit": 10000000,
  "catatan": "optional string",
  "status": "aktif (default)"
}
```

**Response `data`:** `PelangganVIP` (HTTP 201)

**Business logic:**
- `kreditTerpakai = 0`, `sisaKredit = creditLimit`, `statusKredit = 'aman'` on creation.

#### `GET /customers/vip/{id}`

**Response `data`:** `PelangganVIP`

#### `PATCH /customers/vip/{id}`
Update a VIP customer.

**Request body (all optional):**
Same fields as Create (excluding computed fields).

**Response `data`:** Updated `PelangganVIP`

#### `DELETE /customers/vip/{id}`

**Response `data`:** `{}`

#### `GET /customers/vip/{id}/tagihan`
List all invoices/bills for a VIP customer (paginated).

**Query params:** `page`, `limit`, `search`, `sortBy`, `sortOrder`

**Response `data`:** `PaginatedResponse<TagihanVIP>`

#### `GET /customers/vip/{id}/transaksi`
List all orders associated with a VIP customer (paginated).

**Query params:** `page`, `limit`, `search`, `sortBy`, `sortOrder`

**Response `data`:** `PaginatedResponse<Pesanan>`

**Business logic:** Returns orders where `pelangganId == id`.

#### `POST /customers/vip/pembayaran`
Record a payment against a VIP customer's bill.

**Important:** This endpoint has NO customer ID in the URL — the target bill is identified by `tagihanId` in the request body.

**Request body:**
```json
{
  "tagihanId": "string",
  "nominal": 500000,
  "tanggal": "date string",
  "metodePembayaran": "string",
  "catatan": "optional string"
}
```

**Response `data`:** `{}`

**Business logic:**
- Apply payment to `TagihanVIP`: `jumlahDibayar += min(nominal, sisaTagihan)`, `sisaTagihan -= amount_applied`.
- Recompute `TagihanVIP.status`.
- Update `PelangganVIP`: `kreditTerpakai -= amount_applied`, `sisaKredit = creditLimit - kreditTerpakai`.
- Recompute `PelangganVIP.statusKredit`.

### 6.13 Tagihan VIP

Tagihan (bills) are created automatically by the backend when a `Pesanan` is created with `metodePembayaran = 'Kredit VIP'`. There is no standalone create-tagihan endpoint exposed on the frontend.

### 6.14 Shift (POS App)

All POS shift endpoints use the `/api/` prefix.

#### `GET /api/shifts/active`
Get the currently active shift for the authenticated kasir.

**Response `data`:** `Shift (POS)` or `null` if no active shift.

#### `POST /api/shifts/open`
Open a new shift.

**Request body:**
```json
{
  "saldoAwal": 500000
}
```

**Response `data`:** `Shift (POS)` (HTTP 201)

**Business logic:**
- Set `kasirId` and `kasirNama` from authenticated user.
- Set `cabang` from user's branch name.
- Set `waktuBuka = now()`, `status = 'aktif'`.
- All totals start at 0.
- Only one shift can be active per kasir at a time (enforce uniqueness).

#### `POST /api/shifts/close`
Close the active shift.

**Request body:**
```json
{
  "saldoAkhir": 550000
}
```

**Response `data`:** Updated `Shift (POS)`

**Business logic:**
- Set `status = 'tutup'`, set `waktuTutup = now()`, set `saldoAkhir`.
- Finalize aggregated totals from all transactions in this shift.

### 6.15 Transaksi POS

All POS transaction endpoints use the `/api/` prefix.

#### `POST /api/transactions`
Create a new POS transaction.

**Request body:**
```json
{
  "items": [
    {
      "produkId": "string",
      "qty": 2,
      "hargaSatuan": 110000,
      "diskon": 0
    }
  ],
  "pembayaran": [
    { "metode": "Tunai", "nominal": 250000 }
  ],
  "sumber": "pos"
}
```

**Response `data`:** `Transaksi` (HTTP 201)

**Business logic:**
- Compute `subtotal = sum(hargaSatuan * qty)`.
- Compute `totalDiskon = sum(diskon per item)`.
- Compute `total = subtotal - totalDiskon`.
- Compute `kembalian`: if any payment is `Tunai`, `kembalian = max(0, tunai.nominal - total)`; else 0.
- Set `kasirId`, `kasirNama` from authenticated user.
- Set `shiftId` from the user's active shift (require an active shift).
- Generate `nomorStruk` (e.g. `STR-20260515-1234`).
- **Deduct stock** from `CabangInventory` for the user's branch for each item.
- Record `PergerakanStok` entries (jenis = 'keluar', referensi = nomorStruk).
- Update shift statistics: `totalTransaksi += 1`, `totalPenjualan += total`, split by payment method into `totalPenjualanTunai / totalPenjualanQRIS / totalPenjualanTransfer`.
- Also create a corresponding `Pesanan` record with `sumber = 'pos'` and `status = 'Selesai'` (so CRM orders list reflects POS sales).

#### `GET /api/transactions/{id}`
Get a single transaction by ID.

**Response `data`:** `Transaksi`

#### `POST /api/transactions/{id}/return`
Process a POS return.

**Request body:**
```json
{
  "items": [
    { "itemTransaksiId": "string", "qty": 1 }
  ],
  "metodeRefund": "Tunai | Kredit"
}
```

**Response `data`:** `Retur`

**Business logic:**
- Create `Retur` record.
- Compute `totalRefund = sum(hargaSatuan * qty)` for returned items.
- **Restore stock** to `CabangInventory`.
- Record `PergerakanStok` entries (jenis = 'masuk').
- Update shift: `totalRetur += totalRefund`.

### 6.16 Laporan (Reports)

All report endpoints accept date range params. Results are computed on the fly from source data.

#### `GET /reports/penjualan`

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `tanggalDari` | date string | yes | Start date |
| `tanggalSampai` | date string | yes | End date |

**Response `data`:**
```json
{
  "totalTransaksi": 150,
  "totalPendapatan": 45000000,
  "rataRataTransaksi": 300000,
  "harian": [
    { "tanggal": "05-01", "total": 5000000, "transaksi": 20 }
  ],
  "metodePembayaran": [
    { "name": "Tunai", "value": 60 }
  ],
  "topProduk": [
    { "nama": "Pupuk Urea 50kg", "qty": 200 }
  ]
}
```

**Business logic:**
- Filter `Pesanan` by `createdAt` in date range.
- `harian`: one entry per calendar day in the range (include 0-value days).
- `metodePembayaran`: percentage breakdown (value = %).
- `topProduk`: top 5 products by total quantity sold.

#### `GET /reports/stok`

**Query params:** `tanggalDari`, `tanggalSampai`

**Response `data`:**
```json
{
  "produkMenipis": 5,
  "produkHabis": 2,
  "produkKedaluwarsa": 1,
  "itemsMenipis": [
    { "nama": "...", "sku": "...", "stok": 8, "threshold": 10, "satuan": "kg" }
  ],
  "itemsHabis": [
    { "nama": "...", "sku": "...", "satuan": "kg" }
  ]
}
```

**Business logic:** Scope to user's branch if `cabangId` is not null. Same threshold rules as dashboard.

#### `GET /reports/pembelian`

**Query params:** `tanggalDari`, `tanggalSampai`

**Response `data`:**
```json
{
  "totalPO": 25,
  "totalNilai": 120000000,
  "totalDibayar": 95000000,
  "sisaHutang": 25000000,
  "statusBreakdown": [
    { "status": "Diterima", "count": 15 }
  ],
  "topSupplier": [
    { "nama": "PT Agro", "nilai": 50000000 }
  ]
}
```

#### `GET /reports/pelanggan-vip`

**Query params:** `tanggalDari`, `tanggalSampai`

**Response `data`:**
```json
{
  "totalPelanggan": 30,
  "totalKreditTerpakai": 75000000,
  "totalKreditLimit": 200000000,
  "totalTagihanOutstanding": 25000000,
  "statusKredit": [
    { "status": "aman", "count": 20 }
  ]
}
```

#### `GET /reports/pengiriman`

**Query params:** `tanggalDari`, `tanggalSampai`

**Response `data`:**
```json
{
  "totalPengiriman": 80,
  "selesai": 65,
  "gagal": 5,
  "berlangsung": 10,
  "successRate": 81
}
```

#### `GET /reports/shift`

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `tanggalDari` | date string | |
| `tanggalSampai` | date string | |
| `kasirId` | string | Optional filter by cashier |

**Response `data`:**
```json
{
  "totalShift": 10,
  "totalTransaksi": 350,
  "totalPendapatan": 85000000,
  "totalTunai": 50000000,
  "totalNonTunai": 35000000,
  "totalDiskon": 2000000,
  "shifts": [ ...Shift[] ]
}
```

**Business logic:**
- If requesting user is `superadmin`: return shifts from all branches.
- Otherwise: filter to shifts within the user's `cabangId`.
- Sort shifts newest-first (`mulaiAt` desc).

#### `GET /reports/{jenis}/export/pdf`
Export a report as PDF.

**Path params:** `jenis` = `penjualan | stok | pembelian | pelanggan-vip | pengiriman | shift`

**Query params:** `tanggalDari`, `tanggalSampai`

**Response:** `Blob` (binary, `Content-Type: application/pdf`)

#### `GET /reports/{jenis}/export/excel`
Export a report as Excel.

**Response:** `Blob` (binary, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

### 6.17 Notifikasi

#### `GET /notifications`
Get all notifications visible to the current user.

**Response `data`:** `(Notifikasi & { isRead: boolean })[]` (non-paginated, sorted newest-first)

**Business logic (targeting filter):**
A notification is visible to user X if **both** of the following are true:
1. `targetCabang === 'semua'` OR `user.cabangId` is in `targetCabang` array.
2. `targetRole === 'semua'` OR `user.role` is in `targetRole` array.

Add computed `isRead = readByUserIds.includes(user.id)` to each result.

#### `POST /notifications`
Create a new notification (admin/superadmin action).

**Request body:**
```json
{
  "judul": "string",
  "pesan": "string",
  "tipe": "info | peringatan | penting",
  "targetCabang": ["string"] | "semua",
  "targetRole": ["string"] | "semua"
}
```

**Response `data`:** `Notifikasi` (HTTP 201)

**Business logic:** Set `createdBy` and `createdByNama` from the authenticated user. `readByUserIds` starts as `[]`.

#### `POST /notifications/{id}/read`
Mark a notification as read by the current user.

**Request body:** None.

**Response `data`:** `{}`

**Business logic:** Add `user.id` to `readByUserIds` if not already present (idempotent).

#### `POST /notifications/read-all`
Mark all visible notifications as read for the current user.

**Request body:** None.

**Response `data`:** `{}`

**Business logic:** For all notifications visible to the current user (same targeting filter as GET), add `user.id` to `readByUserIds` if not already present.

**Note:** Route `/notifications/read-all` must be registered **before** `/notifications/{id}` in URL routing.

#### `DELETE /notifications/{id}`
Delete a notification.

**Response `data`:** `{}`

### 6.18 Pengaturan (Settings)

#### `GET /settings/toko`
Get store information.

**Response `data`:**
```json
{
  "nama": "string",
  "alamat": "string",
  "telepon": "string"
}
```

#### `PATCH /settings/toko`
Update store information.

**Request body:**
```json
{
  "nama": "string",
  "alamat": "string",
  "telepon": "string"
}
```

**Response `data`:** Updated `InfoToko`

#### `GET /settings/cabang`
List all branches (full list, not paginated) for settings management.

**Response `data`:** `Cabang[]`

#### `POST /settings/cabang/baru`
Create a new branch via settings.

**Request body:**
```json
{
  "nama": "string",
  "tipe": "toko | gudang",
  "lokasi": "string"
}
```

**Response `data`:** `Cabang` (HTTP 201)

**Note:** This is functionally identical to `POST /cabang` but exposed separately for the settings module. Both should create the same underlying model.

#### `PATCH /settings/cabang/{id}`
Update a branch via settings.

**Request body (all optional):**
```json
{
  "nama": "string",
  "tipe": "toko | gudang",
  "lokasi": "string",
  "aktif": true
}
```

**Response `data`:** Updated `Cabang`

#### `GET /settings/kategori`
List all product categories.

**Response `data`:** `KategoriProdukSetting[]` (non-paginated)

#### `POST /settings/kategori`
Create a product category.

**Request body:**
```json
{
  "nama": "string",
  "deskripsi": "optional string"
}
```

**Response `data`:** `KategoriProdukSetting` (HTTP 201)

#### `PATCH /settings/kategori/{id}`
Update a product category.

**Request body (all optional):**
```json
{
  "nama": "string",
  "deskripsi": "string | null"
}
```

**Response `data`:** Updated `KategoriProdukSetting`

#### `DELETE /settings/kategori/{id}`

**Response `data`:** `{}`

### 6.19 Audit Log

#### `GET /audit-logs`
List audit log entries (paginated).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | General search |
| `userId` | string | Filter by user |
| `modul` | string | Filter by module |
| `tanggalDari` | date string | |
| `tanggalSampai` | date string | |
| `page` | integer | |
| `limit` | integer | |

**Response `data`:** `PaginatedResponse<AuditLog>`

**Business logic:** Audit logs are read-only from the API perspective. The backend should auto-write audit log entries for all mutating operations (CREATE, UPDATE, DELETE) across all modules. The `nilaiLama` / `nilaiBaru` fields should contain the full serialized before/after state of the affected record.

## 7. Business Logic Notes

### 7.1 POS Order Auto-Complete
When a `Pesanan` is created with `sumber = 'pos'`, `status` must be set to `'Selesai'` immediately. POS sales are considered complete at the moment of transaction. Stock should be deducted at the same time.

### 7.2 Retur Logic (CRM Orders)
- Only sets `hasRetur = true` on the existing order (does not change `status`).
- Restores stock to the branch where the order's kasir is assigned.
- Calculates refund nominal as `sum(hargaSatuan * qty)` for each returned item.
- An order can have retur processed multiple times in theory but the frontend submits once — the backend should track returned quantities per item to prevent over-returning.

### 7.3 POS Retur Logic
Separate model (`Retur` + `ItemRetur`) linked to `Transaksi`. Restores stock to branch. Updates shift's `totalRetur`. `metodeRefund` determines how the customer is refunded.

### 7.4 Transfer Stok Inventory Flow
```
Transfer created (by Toko)
  → status: Menunggu Persetujuan
Approved (by Gudang):
  → qtyDisetujui set per item
  → Deduct from Gudang CabangInventory immediately
  → status: Disetujui
Shipped (by Gudang):
  → status: Dikirim
Received (by Toko):
  → qtyDiterima and statusPenerimaan set per item
  → Add qtyDiterima to Toko CabangInventory
  → status: Selesai
Rejected (by Gudang):
  → No inventory change
  → status: Ditolak
```

#### Sidebar badge & acknowledgement
The sidebar shows an unread badge on **Transfer Stok** (see `GET /transfer-stok/badge-count`, `POST /transfer-stok/acknowledge`):
- **Gudang** badge = open requests (`Menunggu Persetujuan`); clears naturally once approved/rejected/shipped.
- **Toko (manajer)** badge = documents the warehouse has responded to (`Disetujui` / `Ditolak` / `Dikirim`) that the manajer has not acknowledged. Acknowledgement is keyed by `(userId, transferId, status)`, so each new status change re-surfaces the badge until acknowledged again (or, for `Dikirim`, until `terima` moves it to `Selesai`).

Persist acknowledgements in a `TransferAcknowledgement(userId, transferId, status, acknowledgedAt)` table with a unique constraint on `(userId, transferId, status)`. Full contract: `docs/spec-backend-transfer-stok-badge.md`.

### 7.5 Stok Opname Reconciliation
On `approve`, the system sets each product's `CabangInventory.stok` to the `stokFisik` value counted during the opname. This overwrites the system count. Any discrepancy (`selisih != 0`) should generate a `PergerakanStok` entry of type `penyesuaian`.

### 7.6 Purchase Order Inventory Flow
On `goods-receipt`, received quantities are added to the authenticated user's branch `CabangInventory`. This implies the goods-receipt action should be performed by a user assigned to the gudang/branch where goods are being received.

### 7.7 PO Status Logic
- `Draft` → `Dikirim ke Supplier` → `Sebagian Diterima` or `Diterima`
- `Draft` → `Dibatalkan` (anytime before receiving)
- When all `ItemPO.qtyDiterima >= qtyPesan`: `status = 'Diterima'`; otherwise `'Sebagian Diterima'`

### 7.8 VIP Credit Tracking
- When an order is created with `metodePembayaran = 'Kredit VIP'`, create a `TagihanVIP` record and increase `PelangganVIP.kreditTerpakai` by the order total.
- When `POST /customers/vip/pembayaran` is called: reduce `kreditTerpakai` and update the tagihan status.
- `statusKredit` is always computed (never stored directly): `melebihi_limit` if `kreditTerpakai > creditLimit`; `mendekati_limit` if `kreditTerpakai > creditLimit * 0.85`; `aman` otherwise.

### 7.9 Notification Targeting
Notifications are not pushed in real time (no WebSocket in current implementation). They are fetched on demand. The backend must apply the targeting filter server-side: a user only sees notifications where their `cabangId` matches the `targetCabang` list (or `targetCabang = 'semua'`) AND their `role` matches `targetRole` (or `targetRole = 'semua'`). Superadmin with `cabangId = null`: they see notifications where `targetCabang = 'semua'` (they are not in any specific branch array).

### 7.10 Stock Threshold Alerts
`statusStok` on `Produk` is always computed: compare the product's global `stok` (or the relevant branch stok) against `thresholdStok`. This should be reflected in the dashboard counts. Consider triggering a `Notifikasi` automatically when `CabangInventory.stok` drops to or below `thresholdStok`.

### 7.11 Shift Reconciliation
The shift close endpoint receives `saldoAkhir` (physical cash count by the kasir). The expected closing balance would be `saldoAwal + totalPenjualanTunai - totalRetur`. Any discrepancy can be flagged in `catatanPenutupan`. The backend does not enforce balancing — it records whatever the kasir reports.

### 7.12 Delivery Biaya Total
Always compute `biaya.total = bbm + upahDriver + tol + lainnya` server-side. Never trust the client-supplied total.

### 7.13 Nomor Generation (Auto-numbering)
All entities with human-readable numbers (`nomorPesanan`, `nomorPengiriman`, `nomorTransfer`, `nomorOpname`, `nomorPO`, `nomorStruk`) must be generated server-side. The pattern is `PREFIX-YEAR-NNN` (zero-padded sequential). Use database sequences or row counts with appropriate locking to avoid collisions.

**Defer numbering for draft documents:** the official number must only be issued at the point a document becomes official, not while it is a provisional draft. For `nomorPO` this means generation happens on `/kirim` (transition out of `Draft`), not on create — drafts hold a temporary `DRAFT-…` marker until then. This avoids burning sequential numbers on drafts that get edited or cancelled.

## 8. Enum / Choice Values Reference

### UserRole
```
superadmin | admin | manajer | kasir | staf_gudang
```

### TipeCabang
```
toko | gudang
```

### KategoriProduk
```
Benih | Pupuk | Pestisida | Alat & Mesin | Lainnya
```

### StatusStok (computed)
```
normal | menipis | habis
```

### StatusPesanan
```
Baru | Diproses | Siap Kirim | Dalam Pengiriman | Selesai | Dibatalkan
```

### MetodePembayaran (CRM Orders)
```
Tunai | Transfer Bank | QRIS | Kartu Debit | Kredit VIP
```

### MetodePembayaranPOS (POS Transactions)
```
Tunai | QRIS | Transfer Bank
```

### MetodePengiriman
```
ambil_sendiri | dikirim
```

### StatusPengiriman
```
Dijadwalkan | Dalam Perjalanan | Selesai | Gagal
```

### StatusChecklistItem
```
terkirim | dikembalikan
```

### StatusTransferStok
```
Menunggu Persetujuan | Disetujui | Ditolak | Dikirim | Selesai
```

### StatusPenerimaanItem (Transfer Stok)
```
diterima | dikembalikan
```

### StatusStokOpname
```
Draft | Diajukan | Disetujui
```

### StatusPO
```
Draft | Dikirim ke Supplier | Sebagian Diterima | Diterima | Dibatalkan
```

### StatusPembayaranPO
```
Belum Bayar | Sebagian | Lunas
```

### StatusPelangganVIP
```
aktif | suspend
```

### StatusKreditPelanggan (computed)
```
aman | mendekati_limit | melebihi_limit
```

### StatusTagihan (computed)
```
Belum Bayar | Sebagian | Lunas | Jatuh Tempo
```

### StatusShift (CRM)
```
Aktif | Selesai
```

### StatusShift (POS)
```
aktif | tutup
```

### JenisPergerakan
```
masuk | keluar | penyesuaian
```

### AlasanPenyesuaian
```
Koreksi | Rusak | Hilang | Sampel | Lainnya
```

### TipeNotifikasi
```
info | peringatan | penting
```

### MetodePembayaranPO
```
Transfer | Tunai | Cek
```

### MetodeRefundPOS
```
Tunai | Kredit
```

## 9. Role-Based Access Matrix

The frontend enforces these role gates. The Django backend must mirror them with permission checks.

| Domain | superadmin | admin | manajer | kasir | staf_gudang |
|--------|-----------|-------|---------|-------|------------|
| **Users** — view | ✓ | ✓ | — | — | — |
| **Users** — create/edit/delete | ✓ | ✓ | — | — | — |
| **Cabang** — view | ✓ | ✓ | ✓ | — | — |
| **Cabang** — create/edit | ✓ | ✓ | — | — | — |
| **Produk** — view | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Produk** — create/edit/delete | ✓ | ✓ | — | — | — |
| **Inventori dashboard** | ✓ | ✓ | ✓ | — | ✓ |
| **Inventori penyesuaian** | ✓ | ✓ | — | — | ✓ |
| **Inventori pergerakan** | ✓ | ✓ | ✓ | — | ✓ |
| **Pesanan** — view | ✓ | ✓ | ✓ | ✓ | — |
| **Pesanan** — create | ✓ | ✓ | ✓ | ✓ | — |
| **Pesanan** — retur | ✓ | ✓ | ✓ | — | — |
| **Pengiriman** — view | ✓ | ✓ | ✓ | ✓ | — |
| **Pengiriman** — create/edit | ✓ | ✓ | ✓ | — | — |
| **Transfer Stok** — create (toko) | ✓ | ✓ | ✓ | — | — |
| **Transfer Stok** — approve/kirim (gudang) | ✓ | ✓ | — | — | ✓ |
| **Transfer Stok** — terima (toko) | ✓ | ✓ | ✓ | — | — |
| **Transfer Stok** — badge-count / acknowledge | — | ✓ | ✓ | — | ✓ |
| **Stok Opname** — create | ✓ | ✓ | ✓ | — | ✓ |
| **Stok Opname** — submit | ✓ | ✓ | ✓ | — | — |
| **Stok Opname** — approve | ✓ | ✓ | — | — | — |
| **Purchase Orders** — view | ✓ | ✓ | ✓ | — | ✓ |
| **Purchase Orders** — create/edit | ✓ | ✓ | — | — | — |
| **Purchase Orders** — goods-receipt | ✓ | ✓ | — | — | ✓ |
| **Pelanggan VIP** — view | ✓ | ✓ | ✓ | — | — |
| **Pelanggan VIP** — create/edit | ✓ | ✓ | ✓ | — | — |
| **Laporan** | ✓ | ✓ | ✓ | ✓ | — |
| **Notifikasi** — create | ✓ | ✓ | — | — | — |
| **Pengaturan** | ✓ | ✓ | ✓ | — | — |
| **Audit Log** | ✓ | ✓ | — | — | — |
| **POS Shift** | — | — | — | ✓ | — |
| **POS Transactions** | — | — | — | ✓ | — |

> Branch scoping: non-superadmin users should only be able to see/modify data belonging to their own `cabangId`. Superadmin sees everything. For example, a `kasir` at `toko-1` should not be able to read orders from `toko-2`.

*End of specification. All content derived from direct read-only audit of source files in `apps/crm/src/lib/api/`, `apps/crm/src/lib/mock/handler.ts`, `apps/crm/src/store/auth-store.ts`, `packages/types/`, and `apps/pos/src/lib/api/` plus `apps/pos/src/types/pos.ts`.*

## Summary of what was audited

Here are the key source files that produced this specification:

| File | What it contributed |
|------|-------------------|
| `/apps/crm/src/lib/api/*.ts` (16 files) | All API endpoint paths, HTTP methods, request/response shapes |
| `/apps/crm/src/lib/mock/handler.ts` | Business logic, filtering rules, computed fields, inventory mutation flows |
| `/packages/types/*.ts` (13 files) | All TypeScript data models and enums |
| `/apps/crm/src/store/auth-store.ts` | Token storage strategy, session structure, persisted auth state |
| `/apps/pos/src/lib/api/axios.ts` | POS-specific endpoints (shifts, transactions, inventory), `/api/` prefix pattern |
| `/apps/pos/src/lib/api/shifts.ts` | Shift open/close/active endpoints |
| `/apps/pos/src/lib/api/transactions.ts` | Transaction create/get/return endpoints |
| `/apps/pos/src/lib/api/products.ts` | POS cabang-inventory enriched endpoint |
| `/apps/pos/src/types/pos.ts` | POS-specific types (Transaksi, Retur, Shift, BukaShiftDto, etc.) |
