# Backend Spec: Edit Draft PO & Penundaan Nomor PO Resmi

## Latar Belakang

Dua isu pada siklus hidup dokumen **Purchase Order (PO)** saat berstatus `Draft`:

1. **Tidak ada fitur edit.** PO `Draft` hanya bisa "Kirim ke Supplier" atau
   "Batalkan". Bila terjadi negosiasi ulang/perubahan dari supplier, Admin
   terpaksa membuat PO baru dari awal — boros waktu.
2. **Nomor PO ter-generate terlalu cepat.** Sistem langsung menerbitkan nomor
   dokumen resmi (mis. `PO-2026-015`) padahal status masih `Draft`. Draft yang
   kemudian diedit/dibatalkan membuat nomor urut resmi "terbakar" (ada gap).

Frontend sudah disesuaikan (tombol **Edit Draft**, form create dipakai ganda,
penanda `DRAFT-xxxx`, label ramah di detail). Spec ini mendefinisikan kontrak
backend yang harus diimplementasikan agar perilaku konsisten dengan frontend.

> Catatan: poin-poin di bawah sudah ditambahkan ke `BACKEND_SPEC.md`
> (bagian 6.11 Purchase Orders & 7.13 Nomor Generation). Dokumen ini adalah
> spec ringkas khusus tiket untuk acuan implementasi backend.

---

## Perubahan 1 — Penundaan Nomor PO Resmi

Nomor resmi dengan pola `PO-YEAR-NNN` (zero-padded sequential) **hanya boleh
diterbitkan saat PO keluar dari status `Draft`** (yaitu pada `/kirim`), bukan
saat create.

### `POST /purchase-orders` (create)
- **JANGAN** generate `nomorPO` resmi.
- Set penanda sementara: `nomorPO = 'DRAFT-' + short uuid` (mis.
  `DRAFT-9ec1d8a3`), atau biarkan kosong/`-` bila lebih disukai.
- Sisanya tetap: hitung total finansial, `status = 'Draft'`,
  `statusPembayaran = 'Belum Bayar'`, `totalDibayar = 0`,
  `sisaHutang = totalKeseluruhan`, isi `supplierNama` dari FK.

### `POST /purchase-orders/{id}/kirim`
- **Generate `nomorPO` resmi di sini** (`PO-YEAR-NNN`) **bila PO masih memakai
  penanda draft**. Gunakan database sequence / row-count dengan locking agar
  tidak bentrok.
- Set `status = 'Dikirim ke Supplier'`.

> Implikasi: deret `PO-YEAR-NNN` menjadi rapat/tanpa gap karena hanya PO yang
> benar-benar dikirim yang mengonsumsi nomor.

---

## Perubahan 2 — Edit Draft PO

### `PATCH /purchase-orders/{id}` (baru)

Edit PO yang masih `Draft`: item, biaya tambahan, supplier, catatan,
estimasiTanggalTiba.

**Request body:** sama persis dengan `POST /purchase-orders`:

```json
{
  "supplierId": "string",
  "items": [
    { "produkId": "string", "qtyPesan": 100, "hargaBeli": 85000 }
  ],
  "biayaTambahan": {
    "ongkosKirim": 50000,
    "biayaBongkarMuat": 0,
    "upahKurir": 0,
    "lainnya": 0,
    "keteranganLainnya": null
  },
  "catatan": "optional string",
  "estimasiTanggalTiba": "date string (optional)"
}
```

**Response `data`:** `PurchaseOrder` (updated).

**Business logic:**
- **Hanya boleh saat `status == 'Draft'`.** Selain itu tolak dengan **422**
  (frontend menampilkan "Hanya PO berstatus Draft yang bisa diedit").
- Bangun ulang `items` dan **hitung ulang semua total** persis seperti `POST`:
  - `subtotal_i = qtyPesan_i * hargaBeli_i`
  - `totalHargaBarang = Σ subtotal`
  - `totalBiayaTambahan = Σ field biayaTambahan`
  - `totalKeseluruhan = totalHargaBarang + totalBiayaTambahan`
  - `totalQty = Σ qtyPesan`
  - `hppPerUnit = round(totalKeseluruhan / totalQty)`
  - `sisaHutang = totalKeseluruhan - totalDibayar`
- Pertahankan `id`, `nomorPO` (tetap penanda draft), `status`, `createdAt`;
  perbarui `updatedAt`.
- Perbarui `supplierNama` bila `supplierId` berubah.

---

## RBAC

Mengikuti matriks yang sudah ada: **Purchase Orders — create/edit** = Admin &
Manajer (gudang). `PATCH` tunduk pada izin yang sama dengan create.

## Catatan Validasi & Edge Case

- `PATCH` pada PO non-Draft → 422 (jangan ubah data).
- `/kirim` idempotensi nomor: bila karena suatu hal `nomorPO` sudah resmi
  (bukan penanda draft), jangan generate ulang — cukup ubah status.
- `qtyPesan` & `hargaBeli` harus > 0; minimal 1 item (selaras validasi frontend).
