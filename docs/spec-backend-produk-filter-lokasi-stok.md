# Spec Backend — Filter Lokasi pada Katalog Produk (stok per lokasi)

## Latar belakang

Tabel Katalog Produk (`GET /api/products`) saat ini hanya menampilkan **stok
global** (akumulasi seluruh cabang & gudang). Angka global ini berisiko memicu
**overselling**: Manajer Toko/Kasir bisa menyanggupi pesanan besar padahal fisik
di lokasi mereka jauh lebih kecil dari total global.

Kebutuhan: visibilitas stok berdasarkan **lokasi fisik** barang. UI menambahkan
dropdown "Pilih Lokasi" di deretan search bar + filter kategori.

## Perubahan kontrak API

### `GET /api/products`

Menerima query parameter baru (opsional):

| Param | Tipe | Keterangan |
|-------|------|------------|
| `locationId` | string (id cabang/gudang) | Bila diisi, `stok` & `statusStok` tiap produk dihitung ulang khusus lokasi tsb. Bila kosong/absen, perilaku lama (stok global) dipertahankan. |

> Catatan penamaan: tiket awal menyebut `location_id`. Namun konvensi query
> param di repo ini camelCase (`statusStok`, `supplierId`, `sortBy`), sehingga
> frontend mengirim **`locationId`**. Backend harus menerima nama ini.

#### Perilaku saat `locationId` terisi

Untuk setiap produk pada hasil:

1. `stok` = kuantitas fisik produk tsb **di lokasi `locationId` saja**
   (mis. dari tabel inventory per-cabang). Produk tanpa catatan inventory di
   lokasi itu → `stok = 0`.
2. `statusStok` dihitung ulang dari `stok` lokasi tsb terhadap `thresholdStok`:
   - `stok === 0` → `habis`
   - `stok <= thresholdStok` → `menipis`
   - selain itu → `normal`
3. Filter `statusStok` (bila dikirim) diterapkan **setelah** perhitungan lokasi,
   agar konsisten dengan angka yang tampil.

Field lain (harga, kategori, satuan, dst.) tetap dari master produk.

#### Contoh

```
GET /api/products?locationId=toko-1&statusStok=menipis&page=1&limit=25
```

Mengembalikan produk yang **menipis di Toko Utama** (bukan global), dengan kolom
`stok` = stok fisik di Toko Utama.

### `GET /api/cabang?aktif=true`

Tidak berubah — frontend memakai endpoint ini untuk mengisi opsi dropdown lokasi
(toko & gudang yang aktif). Pastikan response menyertakan `id`, `nama`, `tipe`
(`toko` | `gudang`).

## Envelope & pagination

Tidak berubah — tetap `{ data: [...], meta: { total, page, limit, totalPages } }`.
Pagination dihitung dari hasil setelah filter (termasuk filter lokasi).

## Catatan implementasi mock (sudah dikerjakan di frontend)

`apps/crm/src/lib/mock/handler.ts` (`GET /products`) sudah meniru perilaku ini:
saat `locationId` ada, stok di-`map` dari `cabangInventory` untuk lokasi tsb dan
`statusStok` dihitung ulang sebelum filter `statusStok` diterapkan.

## Berkas frontend terkait

- `packages/types/product.ts` — `ProdukFilter.locationId`
- `apps/crm/src/components/produk/produk-filter.tsx` — dropdown lokasi
- `apps/crm/src/app/(dashboard)/produk/page.tsx` — wiring + header kolom kontekstual
- `apps/crm/src/components/produk/produk-columns.tsx` — header kolom "Stok · {lokasi}"
