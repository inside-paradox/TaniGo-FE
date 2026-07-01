# Backend Spec: `GET /deliveries/available-orders`

## Bug context

`docs/bug-report-*` (Pengiriman module): pesanan yang sudah selesai dikirim masih muncul dan bisa dipilih kembali di form "Buat Jadwal Pengiriman" (`/pengiriman/baru`), berisiko memicu pengiriman ganda.

Root cause: form sebelumnya memfilter pilihan pesanan lewat `GET /orders?status=Siap Kirim`, tapi tidak ada proses yang mengubah `Pesanan.status` menjadi status lain setelah pengiriman dibuat/selesai — sehingga pesanan yang sudah dijadwalkan (bahkan yang sudah `Selesai` dikirim) tetap muncul selamanya di `status = 'Siap Kirim'`.

## Fix

FE (sudah diubah): picker "Pilih Pesanan" di `/pengiriman/baru` beralih dari `GET /orders` ke endpoint baru `GET /deliveries/available-orders`, yang secara eksplisit mengecualikan pesanan yang sudah punya `Pengiriman` aktif — bukan bergantung pada `Pesanan.status`.

## Endpoint

### `GET /deliveries/available-orders`

List pesanan yang boleh dipilih untuk dibuat jadwal pengiriman baru.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Cari berdasarkan `nomorPesanan` atau `pelangganNama` |

**Response `data`:** `Pesanan[]` (tidak dipaginasi — daftar pesanan yang tersedia biasanya kecil)

**Business logic:**
- Filter dasar: `Pesanan.status = 'Siap Kirim'`.
- **Exclude** pesanan yang `id`-nya sudah muncul di `Pengiriman.pesananIds` pada pengiriman manapun dengan `status != 'Gagal'` (yaitu `Dijadwalkan`, `Dalam Perjalanan`, atau `Selesai`).
- Pesanan yang pengirimannya berstatus `Gagal` tetap muncul kembali di daftar ini agar bisa dijadwalkan ulang.

## Related

- `POST /deliveries` (existing, `BACKEND_SPEC.md` §6.8) tetap tidak berubah kontraknya.
