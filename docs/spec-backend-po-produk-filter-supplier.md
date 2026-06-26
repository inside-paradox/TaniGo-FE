# Spec Backend — Dropdown Produk di PO: Filter Supplier + Search Server-Side

**Konteks tiket:** Pada halaman _Buat Purchase Order Baru_ (`/purchase-order/baru`), dropdown
"Cari produk..." sebelumnya (a) menampilkan seluruh produk global tanpa mempedulikan supplier
yang dipilih, dan (b) memuat data terbatas (`limit` awal) sehingga produk yang berada di luar
halaman pertama tidak bisa ditemukan.

Frontend sudah diubah agar dropdown produk **dependent pada supplier** dan melakukan
**pencarian server-side berdebounce**. Backend perlu mendukung kontrak berikut.

## Endpoint terdampak

`GET /api/products`

### Parameter query (tambahan)

| Param        | Tipe   | Wajib | Keterangan                                                                 |
|--------------|--------|-------|---------------------------------------------------------------------------|
| `supplierId` | string | tidak | Filter produk yang berelasi dengan supplier ini. Dipakai oleh dropdown PO. |
| `search`     | string | tidak | Pencarian substring case-insensitive pada `nama` **atau** `sku`.          |
| `page`       | number | tidak | Default `1`.                                                              |
| `limit`      | number | tidak | Frontend mengirim `limit=50` untuk dropdown.                              |

Contoh request dari dropdown PO:

```
GET /api/products?supplierId=sup-3&search=kompos&page=1&limit=50
```

### Perilaku yang diharapkan

1. **Filter supplier (AND).** Bila `supplierId` dikirim, hanya kembalikan produk dengan
   `produk.supplier_id == supplierId`. Digabung (AND) dengan `search` bila keduanya ada.
2. **Search server-side.** `search` mem-filter pada `nama` ILIKE `%q%` OR `sku` ILIKE `%q%`.
   Tujuannya agar seluruh master data (ribuan baris) dapat ditelusuri tanpa frontend menarik
   semua data sekaligus.
3. **Pagination tetap berlaku** dengan envelope standar `{ data, meta }` seperti endpoint list lain.

## Relasi data

Produk memiliki relasi opsional ke Supplier. Model `Produk` di frontend sudah punya field
`supplierId?: string | null` (lihat `packages/types/product.ts`). Backend perlu memastikan:

- Kolom/relasi `supplier_id` ada pada tabel produk (FK ke `suppliers`).
- Field ini disertakan pada serializer produk (response `GET /products` & `GET /products/:id`).
- Form Tambah/Edit Produk ke depan idealnya bisa men-set `supplierId` (di luar scope tiket ini;
  saat ini relasi diasumsikan sudah terisi dari data master).

> Catatan model: tiket mengasumsikan **satu produk = satu supplier utama**. Jika kebutuhan
> bisnis berkembang menjadi many-to-many (satu produk dipasok beberapa supplier), endpoint
> filter `?supplierId=` tetap kompatibel (filter "produk yang memiliki relasi ke supplier X"),
> namun model relasi & serializer perlu disesuaikan terpisah.

## Catatan implementasi frontend (referensi)

- `ProdukFilter.supplierId` ditambahkan di `packages/types/product.ts`.
- `useProducts(params, { enabled })` — query di-disable sampai supplier dipilih.
- Komponen `components/purchase-order/produk-combobox.tsx` melakukan debounce 300ms lalu
  request `GET /products?supplierId=&search=`.
- Mock layer (`lib/mock/handler.ts`) sudah meniru kontrak: filter `supplierId` + `search`.
