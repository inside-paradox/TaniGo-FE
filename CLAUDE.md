# CLAUDE.md

Guidance for working in the **TaniGo Luwu** monorepo. Frontend-only repo; the backend is a separate Django REST service specced in `BACKEND_SPEC.md`.

## Overview

A retail/agribusiness platform for a multi-branch (cabang) store, split into three Next.js apps that share types and utils. The backend does not live here — these apps talk to it over HTTP and currently run against an in-app **demo/mock layer** when logged in with a demo token.

| App | Purpose | Dev port |
|-----|---------|----------|
| `apps/crm` | Back-office dashboard: products, inventory, orders, deliveries, purchase orders, transfers, stock opname, branches, users, reports, store floor plan (denah) | 3000 |
| `apps/pos` | Point-of-sale terminal: transactions, returns (retur), shifts. **Offline-capable** via IndexedDB. | 3001 |
| `apps/kiosk` | Customer-facing product browse/lookup kiosk | 3002 |

Shared workspace packages:
- `@tanigo/types` (`packages/types`) — all domain TypeScript types, re-exported from `index.ts`.
- `@tanigo/utils` (`packages/utils`) — formatters (`formatRupiah`, `formatTanggal`, `generateNomor`, etc.).

## Commands

Run from the repo root (npm workspaces + Turborepo):

```bash
npm install              # install all workspaces
npm run dev              # all apps in parallel (turbo)
npm run dev:crm          # single app: crm | pos | kiosk
npm run build            # turbo build (respects ^build dep order)
npm run lint             # turbo lint (eslint, flat config)
npm run typecheck        # turbo typecheck (tsc --noEmit)
```

Per-app equivalents exist (`next dev`, `next build`, `eslint`, `tsc --noEmit`) — `cd` into the app or use `turbo <task> --filter=<app>`. There is **no test runner configured**; "verify" means `npm run typecheck` + `npm run lint` + manual run.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **TanStack Query v5** for server state, **Zustand v5** (with `persist`) for client state
- **axios** for HTTP, **react-hook-form** + **zod v4** for forms/validation
- **@tanstack/react-table** for tables, **recharts** (CRM reports), **lucide-react** icons, **sonner** for toasts
- POS-only: **idb** (IndexedDB wrapper) for offline queue
- CRM-only: **@dnd-kit** (drag-and-drop, used in denah/floor-plan)

## Architecture & conventions

**Path alias:** `@/*` → `<app>/src/*` in every app. Import shared code as `@tanigo/types` / `@tanigo/utils`.

**Per-app `src/` layout:**
- `app/` — App Router routes, organized by **route groups**: CRM uses `(auth)` + `(dashboard)`; POS uses `(pos)` + `login`. Indonesian route segments (`produk`, `pesanan`, `pengiriman`, `transfer-stok`…).
- `lib/api/` — one module per domain (`products.ts`, `orders.ts`, …) exporting a `<domain>Api` object of async functions. All go through `lib/api/axios.ts`. Barrel-exported from `lib/api/index.ts`.
- `hooks/` — one `use-<domain>.ts` per domain wrapping the api module in TanStack Query. Exports a `<DOMAIN>_KEY` constant; mutations call `qc.invalidateQueries` and fire a `sonner` toast on success/error.
- `store/` — Zustand stores (auth, ui, cart, shift, offline…).
- `components/` — `ui/` holds shared primitives (button, input, modal, table…); other folders are feature-grouped.
- `lib/validations/` — zod schemas. `lib/utils/` — app-local helpers.

**API layer pattern** (`lib/api/<domain>.ts`):
```ts
import api from './axios'
export const productsApi = {
  getAll: async (params): Promise<PaginatedResponse<Produk>> => {
    const { data } = await api.get('/products', { params })
    return { data: data.data, meta: data.meta }
  },
  // ...
}
```
Responses use an envelope: payload is under `data.data`, pagination under `data.meta`. File uploads (products) use `multipart/form-data`.

**axios client** (`lib/api/axios.ts`): reads `baseURL` from `NEXT_PUBLIC_API_URL`; attaches the bearer token from `localStorage`; auto-refreshes on 401 via `/auth/refresh` (skips `/auth/*` endpoints). **Demo mode:** when the stored token equals `demo-access-token`, the request adapter is swapped to serve responses from the in-memory mock (`lib/mock/handler.ts` in CRM, `lib/demo/*` in POS/kiosk) instead of hitting the network.

**Hooks pattern** (`hooks/use-<domain>.ts`):
```ts
export const PRODUCTS_KEY = 'products'
export function useProducts(params) {
  return useQuery({ queryKey: [PRODUCTS_KEY, params], queryFn: () => productsApi.getAll(params), placeholderData: (prev) => prev })
}
```

**POS offline** (`apps/pos/src/lib/db/idb.ts`): IndexedDB DB `tanigo-pos`, stores `products` (cached catalog) and `offline_queue` (queued transactions to sync). Bump the version + handle `upgrade()` when changing stores.

## Naming & language

- **Domain vocabulary is Indonesian**: `Cabang` (branch), `Produk`, `Pesanan` (order), `Pengiriman` (delivery), `Pelanggan/VIP` (customer), `Stok Opname` (stock-take), `Retur` (return), `Denah` (floor plan), `Shift`. Type names, routes, store keys, and toast messages follow this. **Match the surrounding language** — keep domain terms Indonesian; code keywords stay English.
- Currency is IDR — format with `formatRupiah` from `@tanigo/utils`, never hand-roll.
- Dates via `date-fns` with the `id` locale (see utils helpers).

## Environment

Each app needs `.env.local` with:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```
(See `apps/crm/.env.example`.) Apps work without a live backend by logging in with the demo token, which routes everything through the mock layer.

## Backend contract

The frontend was built first; `BACKEND_SPEC.md` is the derived spec for the Django REST backend (data models, response envelope, pagination, endpoints by domain). When changing API calls or types, keep this spec and the `lib/api` modules in sync. Active backend specs and bug reports live in `docs/`.

## Conventions to follow

- TypeScript strict; prefer `import type` for type-only imports (codebase does).
- No semicolons; single quotes; 2-space indent — follow Prettier-style formatting already in files.
- Reuse `ui/` primitives and existing api/hook patterns rather than introducing new ones.
- Do **not** add a `Co-Authored-By` trailer to commits (Vercel Hobby plan constraint).
