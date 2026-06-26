# Spec Backend — Relasi Multi-Supplier pada Produk (Multi-Sourcing)

## Latar belakang

Form **Tambah/Edit Produk** belum punya field supplier, sehingga master produk
tidak menyimpan relasi ke pemasok. Akibatnya filter di modul **Purchase Order**
tidak bisa memetakan "produk apa saja yang tersedia untuk supplier X".

Kebutuhan operasional: satu produk dapat dipasok oleh **beberapa supplier
sekaligus** (multi-sourcing). Maka relasi produk↔supplier bersifat
**many-to-many**.

## Model data

Tambahkan relasi M2M antara `Product` dan `Supplier`.

- Jika belum ada, buat tabel pivot, mis. `product_supplier (product_id, supplier_id)`
  dengan unique constraint pasangan `(product_id, supplier_id)`.
- Django: `Product.suppliers = models.ManyToManyField('Supplier', related_name='products', blank=True)`.

> Catatan migrasi: field lama `Product.supplierId` (one-to-one/单) digantikan oleh
> relasi M2M ini. Saat migrasi data, salin `supplierId` lama → satu baris pivot.

## Perubahan kontrak API

### Response produk (`GET /api/products`, `GET /api/products/:id`)

Sertakan array id supplier pada setiap produk:

```jsonc
{
  "id": "p-1",
  "nama": "Pupuk Urea 50kg",
  // ...
  "supplierIds": ["sup-1", "sup-3"]   // sebelumnya: "supplierId": "sup-1"
}
```

`supplierIds` boleh kosong (`[]`) bila produk belum punya pemasok.

### `POST /api/products` & `PATCH /api/products/:id`

Form dikirim sebagai `multipart/form-data` (karena ada upload foto). Field
supplier dikirim sebagai **key berulang** `supplierIds[]`:

```
supplierIds[]: sup-1
supplierIds[]: sup-3
```

Backend (DRF) membacanya via `request.data.getlist('supplierIds[]')` (atau
`supplierIds`, sesuaikan parser), lalu `product.suppliers.set([...])`. Pada
`PATCH`, bila `supplierIds[]` dikirim → ganti seluruh relasi; bila tidak dikirim
→ biarkan apa adanya.

Validasi: setiap id pada array harus merujuk supplier yang valid & aktif.

### Filter PO — `GET /api/products?supplierId=<id>`

Param `supplierId` (tunggal) tetap dipakai modul PO untuk memuat produk per
pemasok. Setelah M2M, filter berubah dari kecocokan kolom tunggal menjadi
**keanggotaan relasi**:

```python
# sebelum: Product.objects.filter(supplier_id=supplier_id)
Product.objects.filter(suppliers__id=supplier_id)
```

Sehingga produk dengan banyak supplier muncul untuk tiap supplier yang memasoknya.

## Envelope & pagination

Tidak berubah.

## Catatan implementasi mock (sudah dikerjakan di frontend)

- `Produk.supplierIds: string[]` menggantikan `supplierId` (lihat
  `packages/types/product.ts`).
- Seed `mockProduk` memakai `supplierIds` (beberapa produk multi-supplier untuk
  demo, mis. Sprayer = `['sup-2','sup-4']`).
- Filter `GET /products?supplierId=` di mock kini memakai `supplierIds.includes`.
- `lib/api/products.ts` men-serialize array sebagai `supplierIds[]` berulang di
  FormData.

## Berkas frontend terkait

- `packages/types/product.ts` — `Produk.supplierIds`, `CreateProdukDto.supplierIds`
- `apps/crm/src/components/ui/multi-select.tsx` — komponen Multi-Select baru
- `apps/crm/src/components/produk/produk-form.tsx` — field Supplier (multi-select)
- `apps/crm/src/lib/validations/product.ts` — `supplierIds: string[]`
- `apps/crm/src/lib/api/products.ts` — serialisasi array di FormData
- `apps/crm/src/lib/mock/handler.ts`, `data.ts` — filter & seed
