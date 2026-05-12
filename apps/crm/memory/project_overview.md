---
name: TaniGo CRM Project Overview
description: Overview stack dan progress build TaniGo CRM & Admin Dashboard, dalam Turborepo monorepo
type: project
---

Aplikasi CRM & Admin Dashboard untuk TaniGo (toko perlengkapan pertanian).

**Monorepo root:** `/Users/devfe/Documents/dev/tani-go-luwu/`
**CRM path:** `apps/crm/`
**POS path:** `apps/pos/`
**KIOSK path:** `apps/kiosk/`
**Shared packages:** `packages/types/` (@tanigo/types), `packages/utils/` (@tanigo/utils)

**Stack CRM:** Next.js 16 (App Router), TypeScript strict, Tailwind CSS, TanStack Query, TanStack Table, Zustand, React Hook Form + Zod v4, Recharts, Axios, date-fns, Sonner, Lucide React.

**Monorepo commands (dari root):**
- `npm run dev:crm` / `dev:pos` / `dev:kiosk` — jalankan satu app
- `npx turbo build` — build semua apps sekaligus
- `npm install` — install semua deps dari root

**Key notes:**
- Next.js 16 menggunakan `proxy.ts` bukan `middleware.ts` — export function harus bernama `proxy`
- Zod v4: jangan pakai `invalid_type_error` atau `.default()` pada field boolean — gunakan `z.number()` + `valueAsNumber: true` di form, dan set default via useForm `defaultValues`
- Route auth di `(auth)/`, semua dashboard di `(dashboard)/`
- `useSearchParams()` wajib dibungkus `<Suspense>` untuk build
- Semua API modules di `src/lib/api/`, semua hooks di `src/hooks/`
- Import `@/types` dan `@/lib/utils` di CRM tetap bekerja — keduanya re-export dari `@tanigo/types` dan `@tanigo/utils`
- Jangan import langsung `@/types/customer` dll — gunakan `@/types` (barrel)
- `cn` dan `downloadBlob` tetap per-app (di `src/lib/utils/index.ts`), bukan di shared package

**Shared packages:**
- `@tanigo/types` — semua TypeScript interfaces (auth, product, order, customer, dll)
- `@tanigo/utils` — pure utils: formatRupiah, formatTanggal, formatTanggalWaktu, formatTanggalInput, generateNomor, truncate, getInitials

**Progress CRM (selesai semua):**
- Foundation: types, axios instance, JWT interceptor, Zustand stores, utils, proxy/middleware
- Shared components: DataTable, Pagination, SearchInput, PageHeader
- UI components: Button, Input, Select, Textarea, Badge, Card, Skeleton, Modal, ConfirmModal
- 10 halaman utama + semua detail/form pages:
  - dashboard, produk, inventori, purchase-order (+ baru + [id]), pesanan (+ baru + [id])
  - pelanggan-vip (+ [id]), pengiriman (+ baru + [id]), laporan, pengguna, pengaturan, audit-log

**How to apply:** Build dari `apps/crm/` dengan `npx tsc --noEmit && npm run build`, atau dari root dengan `npx turbo build`.
