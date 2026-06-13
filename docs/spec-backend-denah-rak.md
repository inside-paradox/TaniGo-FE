# Backend Spec: Denah Toko & Penempatan Produk di Rak

## Latar Belakang

Fitur **Denah Toko** menambahkan tata letak fisik toko ke sistem:

- Di **CRM** (`apps/crm`, menu **Denah Toko**), manajer toko menyusun denah
  secara *drag-and-drop* di atas kanvas grid: menempatkan **rak**, **kasir**,
  **pintu**, dan **dinding**, lalu mengisi setiap rak dengan produk yang ada di
  sana. Satu produk boleh berada di **lebih dari satu rak**.
  **Halaman ini dedikasi untuk satu toko** — tidak ada pemilih toko; FE memakai
  `cabangId` milik pengguna yang login (manajer toko). Superadmin yang tidak
  terikat cabang memakai toko pertama sebagai fallback.
- Di **Kiosk** (`apps/kiosk`), pelanggan melihat denah tersebut sebagai **peta
  toko** dan rak tempat sebuah produk berada akan disorot (highlight).

Frontend kedua aplikasi sudah dibangun penuh dan berjalan dengan **mock/demo
fallback**. Begitu endpoint berikut tersedia, keduanya otomatis memakainya tanpa
perubahan FE.

Tipe data ada di `packages/types/denah.ts` (`Denah`, `ElemenDenah`,
`SaveDenahDto`, `TipeElemen`).

---

## Model Data

Satu denah dimiliki oleh satu **cabang bertipe `toko`**. Denah adalah kanvas
grid `kolom × baris` (default `16 × 12`) berisi daftar **elemen**. Ukuran grid
bisa diperbesar di CRM: `kolom` 8–32, `baris` 6–24. Grid tidak boleh diperkecil
hingga lebih kecil dari area yang sudah ditempati elemen.

```ts
type TipeElemen = 'rak' | 'pintu' | 'kasir' | 'dinding'

interface ElemenDenah {
  id: string            // unik per elemen
  tipe: TipeElemen
  kode: string          // label di elemen, mis. "A1", "Kasir"
  lorong?: string | null // pengelompokan lorong (opsional), mis. "Lorong 1"
  x: number             // posisi kolom kiri-atas (satuan sel grid)
  y: number             // posisi baris kiri-atas (satuan sel grid)
  w: number             // lebar (sel)
  h: number             // tinggi (sel)
  warna?: string | null // kunci warna rak: green|amber|red|blue|purple|gray
  produkIds: string[]   // produk di elemen ini; hanya relevan untuk tipe 'rak'
}

interface Denah {
  cabangId: string
  kolom: number
  baris: number
  elemen: ElemenDenah[]
  updatedAt: string     // ISO 8601
}
```

Saran skema DB: tabel `denah_toko` (`cabang_id` PK, `kolom`, `baris`,
`updated_at`) + tabel `denah_elemen` (`id` PK, `cabang_id` FK, `tipe`, `kode`,
`lorong`, `x`, `y`, `w`, `h`, `warna`) + tabel pivot `denah_rak_produk`
(`elemen_id` FK, `produk_id` FK) untuk relasi many-to-many rak↔produk.

---

## 1. `GET /cabang/:cabangId/denah` (CRM, perlu auth)

Ambil denah satu toko. Jika belum ada, kembalikan denah kosong default
(`kolom: 16, baris: 12, elemen: []`) — **jangan 404**.

**Response 200:**
```json
{
  "data": {
    "cabangId": "toko-1",
    "kolom": 16,
    "baris": 12,
    "updatedAt": "2026-06-13T00:00:00.000Z",
    "elemen": [
      {
        "id": "el-1-a1", "tipe": "rak", "kode": "A1", "lorong": "Lorong 1",
        "x": 1, "y": 1, "w": 2, "h": 1, "warna": "amber",
        "produkIds": ["p-1", "p-6"]
      },
      {
        "id": "el-1-kasir", "tipe": "kasir", "kode": "Kasir", "lorong": null,
        "x": 12, "y": 8, "w": 3, "h": 1, "warna": null, "produkIds": []
      }
    ]
  }
}
```

**Akses:** `superadmin`, dan `manajer` pada toko tersebut. Validasi bahwa cabang
bertipe `toko`. Manajer **hanya** boleh mengakses denah cabang miliknya sendiri
(`cabangId` harus sama dengan `cabangId` pengguna); selain itu `403`. Superadmin
boleh mengakses cabang toko mana pun.

---

## 2. `PUT /cabang/:cabangId/denah` (CRM, perlu auth)

Ganti **seluruh** denah toko (posisi + ukuran + warna + penempatan produk)
sekaligus. FE mengirim seluruh state denah saat tombol **Simpan Denah** ditekan.

**Request body (`SaveDenahDto`):**
```json
{
  "kolom": 16,
  "baris": 12,
  "elemen": [
    {
      "id": "el-1-a1", "tipe": "rak", "kode": "A1", "lorong": "Lorong 1",
      "x": 1, "y": 1, "w": 2, "h": 1, "warna": "amber",
      "produkIds": ["p-1", "p-6"]
    }
  ]
}
```

**Validasi yang disarankan:**
- `kolom` 8–32, `baris` 6–24.
- `0 ≤ x`, `x + w ≤ kolom`; `0 ≤ y`, `y + h ≤ baris`; `w, h ≥ 1`.
- `produkIds` hanya untuk `tipe === 'rak'`; abaikan untuk lainnya.
- `produkIds` harus produk yang valid; duplikat dibuang.
- `warna` salah satu dari daftar kunci yang diizinkan atau `null`.

**Response 200:** objek `Denah` yang sudah tersimpan (sama seperti GET) dengan
`updatedAt` baru.

**Akses:** sama seperti GET.

---

## 3. `GET /public/denah` (Kiosk, **publik tanpa token**)

Denah toko untuk ditampilkan di peta kiosk.

**Query params:**
| Param | Tipe | Keterangan |
|---|---|---|
| `cabangId` | string (wajib) | ID toko yang dipilih di kiosk. |

**Response 200:** bentuk sama seperti endpoint #1 (objek `Denah`).

Jika toko belum punya denah, boleh kembalikan denah kosong; kiosk akan
menyembunyikan tombol "Lihat di Peta" untuk produk yang raknya tidak ditemukan.

> Catatan keamanan: endpoint publik ini hanya boleh mengekspos `kode`, `lorong`,
> geometri, `warna`, dan `produkIds`. **Jangan** sertakan data internal.

---

## Catatan Integrasi FE

- CRM: `apps/crm/src/lib/api/denah.ts`, hook `useDenah`/`useSaveDenah`, halaman
  `app/(dashboard)/denah-toko`. Saat ini mock di `lib/mock/handler.ts`
  (route `^/cabang/:id/denah$`) + data `mockDenah` di `lib/mock/data.ts`.
- Kiosk: `apps/kiosk/src/lib/api/kiosk.ts` (`fetchDenah`), hook `useDenah`,
  komponen `StoreMap`/`StoreMapModal`. Demo fallback `getDemoDenah` di
  `lib/demo/data.ts` diturunkan dari `lokasiRak` produk.
- `produkIds` memakai ID produk yang sama dengan katalog (`/products` di CRM,
  `/public/cabang-inventory` di kiosk).

## Hubungan dengan lokasi produk

Lokasi rak yang ditampilkan di kiosk kini **diturunkan dari denah ini** — yaitu
rak (`tipe: 'rak'`) yang `produkIds`-nya memuat produk tersebut. Karena satu
produk bisa di banyak rak, kiosk menampilkan semua rak terkait dan menyorotnya
di peta.

Field `lokasiRak`/`lorong` pada produk (lihat
`spec-backend-kiosk-public-api.md`) kini hanya **fallback** ketika toko belum
punya denah; jika denah sudah ada, field itu diabaikan. Tidak perlu menambah
kolom lokasi baru di tabel produk — sumber kebenarannya adalah relasi
`denah_rak_produk`.
