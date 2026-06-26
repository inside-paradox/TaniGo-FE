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

## Syarat Ketahanan (wajib dipenuhi backend)

Tiga gejala bug pernah muncul saat endpoint backend tidak stabil: badge muncul
padahal tak ada permintaan baru (false trigger), `POST /acknowledge` dipanggil
berulang menghasilkan **400** beruntun (auto-loop), dan badge berkedip
muncul-hilang (state fluctuation). Akarnya: frontend dulu memutuskan ulang
server-vs-klien tiap refetch (30 dtk) sehingga mode **berganti-ganti** dan setiap
peralihan memicu acknowledge lagi.

Frontend kini menambal ini (mode dikunci per sesi + acknowledge dimatikan setelah
gagal sekali — lihat `serverBadgeSupported`/`acknowledgeBroken` di
`hooks/use-transfer-stok.ts`). Agar mode server berfungsi penuh, backend **harus**:

1. **`GET /transfer-stok/badge-count` deterministik & stabil.** Selalu balas
   `{ data: { count: <integer> } }`. Jangan balas 400/500 untuk request normal —
   error (selain 401) membuat frontend mengunci ke mode klien untuk sesi itu.
2. **`POST /transfer-stok/acknowledge` idempoten & selalu 2xx** untuk request
   valid (body kosong). Bila endpoint mengembalikan **400**, frontend
   menonaktifkannya untuk sesi tersebut (badge tak lagi auto-clear di server).
   Jadi pastikan acknowledge tidak mensyaratkan body/param yang tidak dikirim.
3. **`count` konsisten dengan efek `acknowledge`.** Setelah acknowledge sukses,
   `badge-count` berikutnya harus mengecualikan dokumen yang baru di-ack
   (key `(user_id, transfer_id, status)`), agar badge benar-benar turun dan tidak
   "false trigger".
