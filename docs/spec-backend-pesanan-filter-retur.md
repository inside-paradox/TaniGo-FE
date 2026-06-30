# Backend Spec: Filter Retur pada List Pesanan POS

## Konteks

Bug dilaporkan: filter "Ada Retur" di tab Transaksi POS mengembalikan 0 hasil, dan filter "Selesai" tidak mengecualikan transaksi yang sudah ada retornya.

Frontend kini mengirim parameter `hasRetur` (boolean) secara eksplisit ke endpoint `GET /orders`, menggantikan pendekatan `status=ada_retur` yang tidak terdokumentasi dengan baik.

## Perubahan yang Dibutuhkan

### `GET /orders` — Query Params Tambahan

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `hasRetur` | boolean (`true` / `false`) | Filter berdasarkan field `hasRetur` pada order. Jika tidak dikirim, tidak ada filter retur. |

### Kombinasi Param dari Frontend (Tab POS)

| Pilihan Filter UI | Params yang dikirim |
|-------------------|---------------------|
| Semua | `sumber=pos` |
| Selesai | `sumber=pos&status=Selesai&hasRetur=false` |
| Ada Retur | `sumber=pos&status=Selesai&hasRetur=true` |

### Logika Query Django

```python
# Tambahkan ke OrderListView atau filter class
has_retur = request.query_params.get('hasRetur')
if has_retur == 'true':
    queryset = queryset.filter(has_retur=True)
elif has_retur == 'false':
    queryset = queryset.filter(has_retur=False)
# Jika tidak ada param hasRetur → tidak difilter
```

### Catatan

- Field `hasRetur` sudah ada di model Order (disetel `true` saat `POST /orders/{id}/retur` berhasil diproses).
- Parameter `status=ada_retur` yang sebelumnya tercantum di BACKEND_SPEC.md (baris 1137) tidak perlu diimplementasikan — frontend sekarang tidak menggunakannya lagi.
- Pastikan filter `hasRetur` bisa dikombinasikan dengan filter `status` dan `sumber` tanpa konflik.
