# Spec Backend — Filter `statusAktif` pada Katalog Produk

**Konteks tiket:** Dropdown produk pada halaman _Buat Permintaan Stok_
(`/transfer-stok/baru`) memuat seluruh katalog sekaligus (`page=1&limit=1000`) lalu
memfilter di sisi client. Produk di luar `limit` tidak pernah bisa ditemukan, dan
payload sebesar itu ditarik ulang setiap halaman dibuka.

Perbaikan yang diinginkan: memindahkan dropdown ke **pencarian server-side berdebounce**,
sama seperti dropdown produk di Buat PO (`docs/spec-backend-po-produk-filter-supplier.md`).
Blokernya satu: dropdown ini hanya boleh menampilkan **produk aktif**, dan saat ini
`GET /api/products` belum punya parameter untuk itu.

## Kenapa tidak bisa difilter di client

Filter `statusAktif` di client **tidak kompatibel dengan pagination server**. Bila backend
mengembalikan 50 baris lalu client membuang yang non-aktif, user melihat 43 baris dan
7 slot sisanya hilang begitu saja — tidak ada cara menjangkau produk aktif berikutnya.
Filter harus terjadi **sebelum** pagination, artinya di backend.

## Endpoint terdampak

`GET /api/products`

### Parameter query (tambahan)

| Param         | Tipe    | Wajib | Keterangan                                                        |
|---------------|---------|-------|-------------------------------------------------------------------|
| `statusAktif` | boolean | tidak | `true` = hanya produk aktif, `false` = hanya non-aktif. Absen/kosong = semua produk (perilaku lama, tidak berubah). |

Contoh request dari dropdown transfer stok:

```
GET /api/products?statusAktif=true&search=pupuk&page=1&limit=50
```

### Perilaku yang diharapkan

1. **Filter sebelum pagination.** `statusAktif` di-apply ke queryset sebelum
   `LIMIT/OFFSET`, sehingga `meta.total` mencerminkan jumlah produk aktif — bukan
   total katalog.
2. **Digabung AND** dengan filter lain yang sudah ada (`search`, `kategori`,
   `statusStok`, `satuan`, `supplierId`, `locationId`).
3. **Backward compatible.** Bila param tidak dikirim, response identik dengan
   sekarang. Halaman Katalog Produk yang menampilkan produk aktif & non-aktif
   sekaligus tidak boleh berubah perilakunya.
4. **Parsing boolean.** Terima `true`/`false` (string, lowercase) sesuai cara axios
   men-serialize boolean di query string. Nilai selain itu diperlakukan sebagai
   absen, bukan error.
5. **Envelope & pagination standar** `{ data, meta }` seperti endpoint list lain.

## Penamaan

Frontend mengirim **`statusAktif`** (camelCase), konsisten dengan field pada model
`Produk` dan dengan param lain di repo ini (`statusStok`, `supplierId`, `sortBy`).
Backend harus menerima nama ini apa pun nama kolom internalnya.

## Bonus (opsional, di luar blocker)

Halaman transfer stok saat ini memanggil `GET /api/cabang-inventory?cabangId=` secara
terpisah hanya untuk membangun peta stok per gudang. Karena `GET /api/products` sudah
mendukung `locationId` (lih. `docs/spec-backend-produk-filter-lokasi-stok.md`) yang
menghitung ulang `stok`/`statusStok` per lokasi, kedua request itu bisa digabung
menjadi satu:

```
GET /api/products?statusAktif=true&locationId=gudang-1&search=pupuk&page=1&limit=50
```

Tidak wajib untuk tiket ini — hanya perlu dipastikan `locationId` dan `statusAktif`
bisa dipakai bersamaan (AND) bila nanti frontend menggabungkannya.

## Catatan implementasi frontend (referensi)

- `ProdukFilter.statusAktif?: boolean` ditambahkan di `packages/types/product.ts`.
- `apps/crm/src/app/(dashboard)/transfer-stok/baru/page.tsx` beralih dari
  `useProducts({ page: 1, limit: 1000 })` + `.filter((p) => p.statusAktif)` menjadi
  komponen combobox berdebounce 300ms yang request
  `GET /products?statusAktif=true&search=`, mengikuti pola
  `components/purchase-order/produk-combobox.tsx`.
- Mock layer (`apps/crm/src/lib/mock/handler.ts`) perlu meniru kontrak yang sama agar
  demo mode konsisten.

## Kandidat penerapan lain (tidak wajib untuk tiket ini)

Pola truncation yang sama masih ada di tempat berikut dan akan ikut terbantu oleh
param ini bila nanti dimigrasikan:

- `app/(dashboard)/stok-opname/baru/page.tsx` (`limit: 100`)
- `app/(dashboard)/stok-opname/page.tsx` (`limit: 200`)
- `components/inventori/penyesuaian-stok-modal.tsx` (`limit: 200`)
