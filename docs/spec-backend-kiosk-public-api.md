# Backend Spec: Public API untuk Aplikasi Kiosk

## Latar Belakang

Aplikasi **Kiosk** (`apps/kiosk`) adalah layar informasi produk mandiri untuk
pelanggan (petani) di dalam toko. Sifatnya **read-only** dan **tanpa
autentikasi** — pelanggan hanya melihat katalog & stok, tidak ada login, tidak
ada transaksi.

Saat ini belum ada endpoint publik di backend (`/cabang`, `/cabang-inventory`,
`/products` semuanya `401`). Frontend kiosk sudah dibangun lengkap dan berjalan
dengan **demo data fallback** — begitu endpoint publik berikut tersedia, kiosk
otomatis memakainya tanpa perubahan FE (tinggal set `NEXT_PUBLIC_API_URL`).

> Catatan keamanan: endpoint ini harus **publik (tanpa token)** namun hanya
> mengekspos data yang aman untuk pelanggan. **Jangan** sertakan `hargaBeli`
> (harga modal), margin, supplier, atau data internal lain.

---

## 1. `GET /public/cabang`

Daftar toko yang bisa dipilih untuk ditampilkan di kiosk.

**Query params:**
| Param | Tipe | Keterangan |
|---|---|---|
| `tipe` | string (opsional) | Filter tipe cabang. Kiosk mengirim `tipe=toko`. |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "e85869de-2000-43bd-bd26-b975a0ac0195",
      "nama": "Tani Go Bone Bone",
      "lokasi": "Jl. Poros Bone Bone, Luwu Utara",
      "telepon": "0812-1111-2222"
    }
  ]
}
```

Hanya kembalikan cabang **aktif** bertipe `toko`. Hanya field di atas (tanpa data
internal).

---

## 2. `GET /public/cabang-inventory`

Daftar produk + stok + harga jual untuk satu toko. Ini gabungan katalog produk
dan inventori cabang.

**Query params:**
| Param | Tipe | Keterangan |
|---|---|---|
| `cabangId` | string (wajib) | ID toko yang dipilih di kiosk. |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ci-xxx",
      "produkId": "p-1",
      "produkNama": "Pupuk Urea 50kg",
      "produkSku": "PUP-001",
      "kategori": "Pupuk",
      "satuan": "karung",
      "hargaJual": 110000,
      "stok": 24,
      "foto": "https://staging-api.tanigo.id/media/produk/urea.jpg",
      "lokasiRak": "Rak A1",
      "lorong": "Lorong 1",
      "updatedAt": "2026-06-09T03:00:00Z"
    }
  ]
}
```

### Field yang dibutuhkan FE

| Field | Wajib | Catatan |
|---|---|---|
| `id` | ✅ | ID unik baris (boleh inventory id atau produk id). |
| `produkNama` (atau `nama`) | ✅ | Nama produk. |
| `produkSku` (atau `sku`) | ✅ | SKU. |
| `kategori` | ✅ | String bebas; FE menormalkan ke Benih/Pupuk/Pestisida/Alat & Mesin/Lainnya. |
| `satuan` | ✅ | kg, botol, unit, dll. |
| `hargaJual` (atau `harga`) | ✅ | Harga jual ke pelanggan. **Bukan** harga beli. |
| `stok` | ✅ | Jumlah stok di toko ini. FE menampilkan "Tersedia" jika `>0`, "Stok Habis" jika `0`. |
| `foto` | ❌ | URL gambar produk; `null` jika tidak ada (FE pakai placeholder). |
| `lokasiRak` | ❌ | Lokasi rak fallback (mis. "Rak A3"). Lihat catatan di bawah. |
| `lorong` | ❌ | Info lorong fallback (mis. "Lorong 2"). |
| `updatedAt` | ❌ | Untuk indikator "terakhir diperbarui". |

> **`deskripsi` sudah tidak dipakai.** Form input produk di CRM tidak punya field
> deskripsi, jadi FE kiosk **menghapus** tampilan deskripsi. Tidak perlu
> dikembalikan endpoint ini.

> **Lokasi rak kini bersumber dari Denah Toko**, bukan field `lokasiRak`.
> Lihat `spec-backend-denah-rak.md` (`GET /public/denah`): kiosk mencocokkan
> produk ke rak lewat `produkIds`, menampilkan semua rak terkait, dan menyorot
> di peta. `lokasiRak`/`lorong` hanya **fallback** bila toko belum punya denah —
> aman untuk dikosongkan/`null`.

Hanya kembalikan produk **aktif** dengan stok yang relevan untuk ditampilkan.

---

## Catatan Implementasi

- **Tanpa auth** — kedua endpoint harus bisa diakses tanpa header `Authorization`.
- **Caching** — boleh di-cache pendek (mis. 60 detik) di sisi server/CDN; kiosk
  juga auto-refetch tiap 5 menit di sisi klien.
- **Envelope** — FE menerima `{ data: [...] }` maupun `{ data: { data: [...] } }`.
- **CORS** — izinkan origin domain kiosk.

## Prioritas

| Item | Prioritas |
|---|---|
| `GET /public/cabang?tipe=toko` | **High** — kiosk butuh daftar toko. |
| `GET /public/cabang-inventory?cabangId=` (field inti) | **High** — data produk utama. |
| `GET /public/denah?cabangId=` (lihat `spec-backend-denah-rak.md`) | **High** — sumber lokasi rak & peta toko. |
| Field `lokasiRak` / `lorong` | Low — hanya fallback bila denah belum ada. |
| Field `foto` | Medium — pelengkap halaman detail. |
