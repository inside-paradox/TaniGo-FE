# Backend Spec — Dashboard Summary

**Tanggal:** 2026-05-25  
**Konteks:** Dashboard frontend menampilkan 3 tampilan berbeda berdasarkan role user. Section stok & penjualan sudah pakai real API. Yang belum: card operasional (semua role) masih hardcoded karena belum ada endpoint summary-nya.

---

## Keputusan Scoping: Delivery & PO Branch

**Pilihan yang dipilih: Option 1 — Fix create, set branch dari JWT**

Saat Delivery atau PurchaseOrder dibuat, backend otomatis set `branch = user.branch` dari JWT — tidak perlu field tambahan dari frontend. Record lama yang `branch = null` dibiarkan, dashboard count hanya berlaku untuk data baru ke depan.

---

## Ringkasan Endpoint yang Dibutuhkan

| Endpoint | Untuk Role | Tipe Cabang |
|----------|-----------|-------------|
| `GET /dashboard/toko` | `manajer`, `kasir` | `toko` |
| `GET /dashboard/gudang` | `admin`, `staf_gudang` | `gudang` |
| `GET /dashboard/superadmin` | `superadmin` | — |

Semua endpoint scope otomatis dari JWT. Tidak ada query param tambahan.

---

## 1. `GET /dashboard/toko`

**Untuk:** `manajer`, `kasir` dengan `tipeCabang = toko`

### Response `200 OK`

```json
{
  "pengirimanHariIni": 8,
  "pesananBaru": 12,
  "tagihanJatuhTempo": 3,
  "transferStokPending": 2
}
```

### Definisi field

| Field | Tipe | Logika |
|-------|------|--------|
| `pengirimanHariIni` | `integer` | Delivery milik cabang ini (`branch = user.branch`) dengan `tanggalPengiriman = hari ini`, status apapun kecuali `Gagal` |
| `pesananBaru` | `integer` | Order milik cabang ini dengan `status = "Baru"` |
| `tagihanJatuhTempo` | `integer` | Tagihan VIP dengan `status = "Jatuh Tempo"` ATAU `dueDate < hari ini` dan `status != "Lunas"` |
| `transferStokPending` | `integer` | Transfer stok di mana `tokoId = user.cabangId` dan `status = "Menunggu Persetujuan"` |

---

## 2. `GET /dashboard/gudang`

**Untuk:** `admin`, `staf_gudang` dengan `tipeCabang = gudang`

### Response `200 OK`

```json
{
  "poMenunggu": 4,
  "transferMasuk": 7,
  "siapDikirim": 3
}
```

### Definisi field

| Field | Tipe | Logika |
|-------|------|--------|
| `poMenunggu` | `integer` | PurchaseOrder milik gudang ini (`branch = user.branch`) dengan `status = "Draft"` |
| `transferMasuk` | `integer` | Transfer stok di mana `gudangId = user.cabangId` dan `status = "Menunggu Persetujuan"` |
| `siapDikirim` | `integer` | Transfer stok di mana `gudangId = user.cabangId` dan `status = "Disetujui"` |

---

## 3. `GET /dashboard/superadmin`

**Untuk:** `superadmin` (semua cabang)

### Response `200 OK`

```json
{
  "performaToko": [
    {
      "cabangId": "uuid",
      "nama": "Toko Utama",
      "pendapatan": 39100000,
      "transaksi": 142,
      "pertumbuhan": 12.4
    },
    {
      "cabangId": "uuid",
      "nama": "Toko Selatan",
      "pendapatan": 28500000,
      "transaksi": 103,
      "pertumbuhan": -3.2
    }
  ]
}
```

### Definisi field

| Field | Tipe | Logika |
|-------|------|--------|
| `performaToko` | `array` | Hanya cabang dengan `tipe = "toko"` |
| `performaToko[].cabangId` | `string (uuid)` | ID cabang |
| `performaToko[].nama` | `string` | Nama cabang |
| `performaToko[].pendapatan` | `integer` | Total `total` orders cabang dalam **7 hari terakhir** |
| `performaToko[].transaksi` | `integer` | Jumlah orders cabang dalam **7 hari terakhir** |
| `performaToko[].pertumbuhan` | `number` | % perubahan pendapatan vs 7 hari sebelumnya. Positif = naik, negatif = turun |

### Rumus `pertumbuhan`

```
periode_ini  = hari ini - 6  s/d  hari ini
periode_lalu = hari ini - 13  s/d  hari ini - 7

pertumbuhan = ((pendapatan_ini - pendapatan_lalu) / pendapatan_lalu) * 100

Jika pendapatan_lalu = 0 dan pendapatan_ini > 0  →  pertumbuhan = 100.0
Jika keduanya = 0                                →  pertumbuhan = 0.0
```

---

## Aturan Umum

- Semua endpoint wajib `Authorization: Bearer <token>`
- Scope cabang otomatis dari JWT — tidak ada query param `cabangId`
- Role yang tidak sesuai → `403 Forbidden`
- Frontend tidak perlu perubahan apapun — siap wire up setelah endpoint tersedia
