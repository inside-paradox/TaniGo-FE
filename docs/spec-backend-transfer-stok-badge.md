# Spec Backend — Badge Notifikasi Transfer Stok

## Latar Belakang

Sidebar CRM perlu menampilkan badge angka di menu **Transfer Stok** agar Admin
Gudang dan Manajer Toko tahu ada dokumen yang membutuhkan aksi, tanpa harus
membuka menu secara manual.

Saat ini badge dihitung di frontend dari daftar transfer (mode demo/mock) dan
status "sudah dibaca" disimpan lokal (`localStorage: tanigo-crm-transfer-ack`).
Spec ini mendefinisikan dukungan backend agar perhitungan & acknowledgement
konsisten lintas perangkat.

## Logika Badge per Role

| Role | Dokumen yang dihitung | Scope cabang |
|------|-----------------------|--------------|
| Admin Gudang / Staf Gudang | status `Menunggu Persetujuan` | `gudang_id == user.cabang_id` |
| Manajer Toko | status `Disetujui`, `Ditolak`, atau `Dikirim` yang belum di-_acknowledge_ | `toko_id == user.cabang_id` |

Dokumen hilang dari hitungan saat:
- **Gudang**: dokumen diproses (approve/tolak/kirim) → status keluar dari `Menunggu Persetujuan`.
- **Toko**: dokumen di-acknowledge (dibuka/diproses ke `Selesai`), atau diterima.

Karena Manajer perlu tahu setiap **perubahan** status, acknowledgement diikat ke
pasangan `(transfer_id, status)`. Jika Gudang mengubah status lagi
(mis. `Disetujui` → `Dikirim`), dokumen kembali dihitung.

## Endpoint

### `GET /transfer-stok/badge-count`

Mengembalikan jumlah dokumen yang butuh perhatian user yang sedang login.
Server menentukan logika berdasarkan role + `cabang_id` dari token.

Response:

```json
{
  "data": { "count": 3 }
}
```

### `POST /transfer-stok/acknowledge`

Menandai **semua** dokumen yang saat ini actionable bagi user (pada status
terkininya) sebagai sudah dibaca. Tanpa body — server menentukan dokumen mana
berdasarkan role + `cabang_id`. Dipanggil frontend ketika user membuka halaman
Transfer Stok.

Request: _(body kosong)_

Response: `{ "data": { "acknowledged": 2 } }`

Disimpan sebagai baris `transfer_acknowledgement(user_id, transfer_id, status, acknowledged_at)`
dengan unique constraint `(user_id, transfer_id, status)` (idempoten). Karena key
menyertakan `status`, perubahan status berikutnya otomatis dianggap belum dibaca.

## Catatan Implementasi Frontend (sudah siap dua mode)

Frontend sudah mendukung kedua endpoint dengan **fallback otomatis**, jadi tidak
perlu perubahan kode saat backend mengaktifkan endpoint:

- `useTransferStokBadge()` (`hooks/use-transfer-stok.ts`):
  - **Mode server** — bila `GET /transfer-stok/badge-count` mengembalikan angka,
    `count` diambil langsung dari backend.
  - **Mode klien (fallback)** — bila endpoint belum ada (404/501/network, atau
    response non-numerik seperti di mode demo), hook mengambil daftar transfer
    via `GET /transfer-stok` lalu menghitung `count` di klien, dengan status
    "dibaca" disimpan lokal di `useTransferAckStore`
    (`store/transfer-ack-store.ts`, key `${userId}:${transferId}:${status}`).
- Halaman `transfer-stok` saat dibuka:
  - Mode server → `POST /transfer-stok/acknowledge` lalu invalidasi badge.
  - Mode klien → `markSeen(keys)` lokal.
- Sidebar hanya membaca `count` — tidak berubah antar mode.

Begitu backend men-deploy kedua endpoint, mode server aktif otomatis dan
`transfer-ack-store` (penyimpanan lokal) berhenti dipakai dengan sendirinya.
