# Backend Spec — Dashboard Summary

**Tanggal:** 2026-05-24  
**Konteks:** Dashboard frontend menampilkan 3 tampilan berbeda berdasarkan role user. Section stok & penjualan sudah pakai real API. Yang belum: card operasional (semua role) masih hardcoded karena belum ada endpoint summary-nya.

---

## Ringkasan Kebutuhan

| Role | Section yang hardcoded | Endpoint yang dibutuhkan |
|------|----------------------|--------------------------|
| `manajer`, `kasir` (tipeCabang: `toko`) | Operasional Hari Ini | `GET /dashboard/toko` |
| `admin`, `staf_gudang` (tipeCabang: `gudang`) | Aktivitas Gudang | `GET /dashboard/gudang` |
| `superadmin` | Performa per Toko | `GET /dashboard/superadmin` |

Semua endpoint di-scope otomatis berdasarkan `cabangId` user yang sedang login (dari JWT). Superadmin mendapat data semua cabang.

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
| `pengirimanHariIni` | `integer` | Jumlah pengiriman milik cabang ini dengan `tanggalPengiriman = hari ini` (status apapun kecuali `Gagal`) |
| `pesananBaru` | `integer` | Jumlah pesanan milik cabang ini dengan `status = "Baru"` |
| `tagihanJatuhTempo` | `integer` | Jumlah tagihan VIP (seluruh pelanggan) dengan `status = "Jatuh Tempo"` ATAU `dueDate < hari ini` dan `status != "Lunas"` |
| `transferStokPending` | `integer` | Jumlah transfer stok di mana `tokoId = cabangId user` dan `status = "Menunggu Persetujuan"` |

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
| `poMenunggu` | `integer` | Jumlah Purchase Order milik gudang ini dengan `status = "Draft"` |
| `transferMasuk` | `integer` | Jumlah transfer stok di mana `gudangId = cabangId user` dan `status = "Menunggu Persetujuan"` |
| `siapDikirim` | `integer` | Jumlah transfer stok di mana `gudangId = cabangId user` dan `status = "Disetujui"` |

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
| `performaToko[].pendapatan` | `integer` | Total `total` dari orders cabang tersebut dalam **7 hari terakhir** |
| `performaToko[].transaksi` | `integer` | Jumlah orders cabang tersebut dalam **7 hari terakhir** |
| `performaToko[].pertumbuhan` | `number` | Persentase perubahan pendapatan dibanding 7 hari sebelumnya. Positif = naik, negatif = turun. Contoh: `12.4` = naik 12.4% |

### Catatan perhitungan `pertumbuhan`

```
periode_ini    = 7 hari terakhir (hari ini - 6 s/d hari ini)
periode_lalu   = 7 hari sebelumnya (hari ini - 13 s/d hari ini - 7)

pertumbuhan = ((pendapatan_ini - pendapatan_lalu) / pendapatan_lalu) * 100

Jika pendapatan_lalu = 0 dan pendapatan_ini > 0 → pertumbuhan = 100.0
Jika keduanya = 0 → pertumbuhan = 0.0
```

---

## Aturan Umum

- Semua endpoint membutuhkan `Authorization: Bearer <token>`
- Response scope otomatis dari JWT — tidak perlu query param `cabangId`
- Jika user tidak memiliki akses ke endpoint yang diminta (misal kasir hit `/dashboard/superadmin`) → `403 Forbidden`
