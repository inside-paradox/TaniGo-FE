# Spec Backend: Status Pesanan Ambil Sendiri

**Tiket:** Bug — pesanan manual dengan metode pengiriman "Ambil Sendiri" salah masuk alur kurir  
**Tanggal:** 2026-06-30

## Perubahan yang Diperlukan

### 1. Tambah nilai `StatusPesanan`

Tambahkan nilai baru pada enum/choices status pesanan di backend:

```
siap_diambil   →  label: "Siap Diambil"
```

Urutan status lengkap menjadi:
```
baru → diproses → siap_kirim / siap_diambil → dalam_pengiriman (hanya dikirim) → selesai
```

### 2. Endpoint `PATCH /orders/{id}/status/`

Endpoint ini sudah ada. Pastikan menerima nilai `siap_diambil` pada field `status`.

Request body (tidak berubah):
```json
{
  "status": "siap_diambil",
  "catatan": "opsional"
}
```

### 3. Validasi transisi status di backend

Tambahkan conditional check pada logika transisi status berdasarkan `metode_pengiriman`:

| `metode_pengiriman` | Alur status yang valid |
|---|---|
| `dikirim` | `baru` → `diproses` → `siap_kirim` → `dalam_pengiriman` → `selesai` |
| `ambil_sendiri` | `baru` → `diproses` → `siap_diambil` → `selesai` |

Backend **tidak boleh** mengizinkan pesanan `ambil_sendiri` bertransisi ke `siap_kirim` atau `dalam_pengiriman`.

### 4. Response serializer

Pastikan field `status` pada response pesanan sudah menyertakan nilai `siap_diambil` di semua endpoint pesanan:
- `GET /orders/`
- `GET /orders/{id}/`
- `POST /orders/`
- `PATCH /orders/{id}/status/`

## Perubahan Frontend (sudah diimplementasi)

- `StatusPesanan` type ditambah `'Siap Diambil'`
- `DetailManual`: workflow button bercabang berdasarkan `metodePengiriman`
  - `ambil_sendiri` + status `Diproses` → tombol "Tandai Siap Diambil" → status `Siap Diambil`
  - `ambil_sendiri` + status `Siap Diambil` → tombol "Konfirmasi Pengambilan" → status `Selesai`
  - `dikirim` + status `Diproses` → tombol "Tandai Siap Kirim" → status `Siap Kirim` (tidak berubah)
  - `dikirim` + status `Siap Kirim` → tombol "Buat Jadwal Pengiriman" (tidak berubah)
