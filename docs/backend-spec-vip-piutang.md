# Backend Spec — VIP Piutang Visibility

**Tanggal:** 2026-05-24  
**Konteks:** Frontend sudah implement summary cards, filter tabs, dan badge jatuh tempo di halaman Pelanggan VIP. Fitur ini butuh 4 perubahan di backend.

---

## 1. Auto-set `dueDate` saat tagihan dibuat

Saat order dengan metode pembayaran **kredit** menghasilkan `VIPInvoice`, backend otomatis set:

```
dueDate = tanggal + 30 hari
```

Tidak ada perubahan request body dari frontend. Murni backend behavior.

**Contoh:**
- Order tanggal `2026-05-24` → `dueDate: "2026-06-23"`

---

## 2. Enrich `VIPCustomer` response dengan field `tagihanTerdekat`

**Endpoint yang terdampak:**
- `GET /customers/vip`
- `GET /customers/vip/{id}`

Tambahkan field computed `tagihanTerdekat` pada setiap object `VIPCustomer` di response.

### Schema

```json
{
  "id": "uuid",
  "namaLengkap": "PT Agro Nusantara",
  "kreditTerpakai": 15500000,
  "sisaKredit": 9500000,
  "statusKredit": "mendekati_limit",
  "status": "aktif",

  "tagihanTerdekat": {
    "jumlah": 2,
    "nominal": 15500000,
    "dueDate": "2026-05-14",
    "hariJatuhTempo": -10
  }
}
```

### Field `tagihanTerdekat`

| Field | Tipe | Keterangan |
|---|---|---|
| `jumlah` | `integer` | Jumlah tagihan aktif (status ≠ `Lunas`) milik pelanggan ini |
| `nominal` | `integer` | Total `sisaTagihan` dari semua tagihan aktif |
| `dueDate` | `string (date) \| null` | Due date dari tagihan aktif yang paling dekat jatuh temponya |
| `hariJatuhTempo` | `integer \| null` | Selisih hari antara `dueDate` dan hari ini. **Positif = masih X hari lagi. Negatif = sudah lewat X hari (overdue).** `0` = jatuh tempo hari ini |

### Aturan

- Jika pelanggan tidak memiliki tagihan aktif → `"tagihanTerdekat": null`
- "Tagihan aktif" = `status != "Lunas"`
- `dueDate` diambil dari tagihan aktif yang `dueDate`-nya paling dekat dengan hari ini (ascending)
- Jika semua tagihan aktif tidak memiliki `dueDate` → `dueDate: null`, `hariJatuhTempo: null`

---

## 3. Endpoint baru: `GET /customers/vip/ringkasan`

Endpoint ini mengembalikan agregat piutang seluruh pelanggan VIP, digunakan untuk summary cards di halaman list.

### Request

```
GET /customers/vip/ringkasan
Authorization: Bearer <token>
```

Tidak ada query params.

### Response `200 OK`

```json
{
  "totalPiutang": 23450000,
  "mendekatiJatuhTempo": {
    "count": 1,
    "nominal": 2750000
  },
  "sudahJatuhTempo": {
    "count": 2,
    "nominal": 13700000
  }
}
```

### Definisi field

| Field | Tipe | Keterangan |
|---|---|---|
| `totalPiutang` | `integer` | Jumlah seluruh `sisaTagihan` dari semua tagihan aktif, semua pelanggan |
| `mendekatiJatuhTempo.count` | `integer` | Jumlah **pelanggan** yang punya tagihan aktif dengan `dueDate` antara hari ini s/d +7 hari ke depan (eksklusif overdue) |
| `mendekatiJatuhTempo.nominal` | `integer` | Total outstanding dari pelanggan-pelanggan `mendekatiJatuhTempo` tersebut |
| `sudahJatuhTempo.count` | `integer` | Jumlah **pelanggan** yang punya minimal satu tagihan aktif dengan `dueDate < hari ini` |
| `sudahJatuhTempo.nominal` | `integer` | Total outstanding dari pelanggan-pelanggan `sudahJatuhTempo` tersebut |

> `count` = jumlah **pelanggan**, bukan jumlah tagihan. Satu pelanggan dengan 3 tagihan overdue tetap dihitung `count: 1`.

### Logika agregasi

```
today = tanggal hari ini (00:00:00)
sevenDaysLater = today + 7 hari

untuk setiap pelanggan:
  tagihanAktif = tagihan pelanggan dengan status != "Lunas"
  if tagihanAktif.length == 0: skip

  nominal = sum(tagihanAktif.sisaTagihan)
  totalPiutang += nominal

  isOverdue = ada tagihan aktif dengan dueDate < today
  isMendekati = tidak isOverdue AND ada tagihan aktif dengan today <= dueDate <= sevenDaysLater

  if isOverdue:
    sudahJatuhTempo.count++
    sudahJatuhTempo.nominal += nominal
  else if isMendekati:
    mendekatiJatuhTempo.count++
    mendekatiJatuhTempo.nominal += nominal
```

---

## 4. Tambah query param `statusTagihan` ke `GET /customers/vip`

Filter pelanggan berdasarkan status piutangnya.

### Request

```
GET /customers/vip?statusTagihan=overdue
```

### Nilai yang valid

| Value | Filter |
|---|---|
| `ada_hutang` | `kreditTerpakai > 0` |
| `mendekati_jt` | Punya tagihan aktif dengan `dueDate` antara hari ini s/d +7 hari ke depan |
| `overdue` | Punya tagihan aktif dengan `dueDate < hari ini` |

Param ini bersifat opsional. Jika tidak dikirim, tidak ada filter tambahan (behavior existing tidak berubah).

Param ini bisa dikombinasikan dengan filter yang sudah ada (`status`, `statusKredit`, `search`).

---

## Priority

| # | Item | Priority |
|---|---|---|
| 1 | Auto-set `dueDate = tanggal + 30 hari` | **P0** — data tidak bermakna tanpa ini |
| 2 | Enrich `tagihanTerdekat` di list response | **P0** — dipakai untuk badge per-row di tabel |
| 3 | `GET /customers/vip/ringkasan` | **P1** — dipakai untuk summary cards |
| 4 | Query param `statusTagihan` | **P1** — dipakai untuk filter tabs |

---

## Catatan Frontend

- Frontend sudah implement semua ini dalam mode mock/demo
- Saat backend ready, tidak ada perubahan contract dari sisi frontend — tinggal switch dari mock ke real API
- Endpoint `ringkasan` harus didaftarkan **sebelum** route `/{id}` di router agar tidak tertangkap sebagai `id = "ringkasan"`
