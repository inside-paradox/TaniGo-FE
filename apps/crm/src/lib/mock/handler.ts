import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import {
  mockCabang,
  mockUsers,
  mockProduk,
  mockTransferStok,
  mockPengiriman,
  mockPurchaseOrders,
  mockPembayaranPO,
  mockPesanan,
  mockPelangganVIP,
  mockTagihanVIP,
  mockStokOpname,
  mockCabangInventory,
  mockSuppliers,
  mockPergerakanStok,
  mockShift,
  mockNotifikasi,
  mockDenah,
  paginate,
} from './data'
import type { Cabang, User, TransferStok, Pengiriman, PurchaseOrder, PembayaranPO, Pesanan, PelangganVIP, TagihanVIP, StokOpname, CabangInventory, Supplier, PergerakanStok, Shift, StatusPenerimaanItem, Notifikasi, Denah, SaveDenahDto } from '@/types'

// In-memory mutable state for demo mutations
let cabang = [...mockCabang] as Cabang[]
let users = [...mockUsers] as User[]
const transferStok = [...mockTransferStok] as TransferStok[]
const pengiriman = [...mockPengiriman] as Pengiriman[]
const purchaseOrders = [...mockPurchaseOrders] as PurchaseOrder[]
const pembayaranPO = [...mockPembayaranPO] as PembayaranPO[]
const pesanan = [...mockPesanan] as Pesanan[]
const pelangganVIP = [...mockPelangganVIP] as PelangganVIP[]
const tagihanVIP = [...mockTagihanVIP] as TagihanVIP[]
const stokOpname = [...mockStokOpname] as StokOpname[]
const cabangInventory = [...mockCabangInventory] as CabangInventory[]
let suppliers = [...mockSuppliers] as Supplier[]
const pergerakanStok = [...mockPergerakanStok] as PergerakanStok[]
const shifts = [...mockShift] as Shift[]
let notifikasi = [...mockNotifikasi] as Notifikasi[]
const denah = [...mockDenah] as Denah[]

// ── VIP helpers ───────────────────────────────────────────────────────────────

function computeTagihanTerdekat(customerId: string) {
  const aktif = tagihanVIP.filter((t) => t.pelangganId === customerId && t.status !== 'Lunas')
  if (aktif.length === 0) return null

  const nominal = aktif.reduce((sum, t) => sum + t.sisaTagihan, 0)
  const withDue = aktif.filter((t) => t.dueDate)

  if (withDue.length === 0) return { jumlah: aktif.length, nominal, dueDate: null, hariJatuhTempo: null }

  const sorted = [...withDue].sort(
    (a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
  )
  const nearest = sorted[0]
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(nearest.dueDate!); due.setHours(0, 0, 0, 0)
  const hariJatuhTempo = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  return { jumlah: aktif.length, nominal, dueDate: nearest.dueDate!, hariJatuhTempo }
}

function computeRingkasan() {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const sevenDaysLater = new Date(today.getTime() + 7 * 86_400_000)

  let totalPiutang = 0
  let mendekatiCount = 0, mendekatiNominal = 0
  let overdueCount = 0, overdueNominal = 0

  for (const customer of pelangganVIP) {
    const tagihanAktif = tagihanVIP.filter(
      (t) => t.pelangganId === customer.id && t.status !== 'Lunas'
    )
    if (tagihanAktif.length === 0) continue

    const nominal = tagihanAktif.reduce((sum, t) => sum + t.sisaTagihan, 0)
    totalPiutang += nominal

    const isOverdue = tagihanAktif.some((t) => {
      if (!t.dueDate) return false
      const due = new Date(t.dueDate); due.setHours(0, 0, 0, 0)
      return due < today
    })

    const isMendekati =
      !isOverdue &&
      tagihanAktif.some((t) => {
        if (!t.dueDate) return false
        const due = new Date(t.dueDate); due.setHours(0, 0, 0, 0)
        return due >= today && due <= sevenDaysLater
      })

    if (isOverdue) { overdueCount++; overdueNominal += nominal }
    else if (isMendekati) { mendekatiCount++; mendekatiNominal += nominal }
  }

  return {
    totalPiutang,
    mendekatiJatuhTempo: { count: mendekatiCount, nominal: mendekatiNominal },
    sudahJatuhTempo: { count: overdueCount, nominal: overdueNominal },
  }
}

// Settings state
let infoToko = {
  nama: 'TaniGo Luwu',
  alamat: 'Jl. Poros Palopo - Makassar No. 12, Luwu, Sulawesi Selatan',
  telepon: '0853-4567-8901',
}
interface KategoriSetting { id: string; nama: string; deskripsi?: string | null }
let kategoriProduk: KategoriSetting[] = [
  { id: 'kat-1', nama: 'Pupuk', deskripsi: 'Pupuk organik dan anorganik' },
  { id: 'kat-2', nama: 'Pestisida', deskripsi: 'Herbisida, insektisida, fungisida' },
  { id: 'kat-3', nama: 'Benih', deskripsi: 'Benih padi, jagung, sayuran' },
  { id: 'kat-4', nama: 'Alat & Mesin', deskripsi: 'Peralatan dan mesin pertanian' },
  { id: 'kat-5', nama: 'Irigasi', deskripsi: 'Selang, pompa, sprinkler' },
]

function upsertInventory(branchId: string, produkId: string, stok: number, now: string) {
  const produk = mockProduk.find((p) => p.id === produkId)
  const idx = cabangInventory.findIndex((inv) => inv.cabangId === branchId && inv.produkId === produkId)
  if (idx !== -1) {
    cabangInventory[idx] = { ...cabangInventory[idx], stok, updatedAt: now }
  } else if (produk) {
    cabangInventory.push({
      id: `ci-${branchId}-${produkId}-${Date.now()}`,
      cabangId: branchId, produkId,
      produkNama: produk.nama, produkSku: produk.sku, satuan: produk.satuan,
      stok, updatedAt: now,
    })
  }
}

function addInventory(branchId: string, produkId: string, qty: number, now: string) {
  const produk = mockProduk.find((p) => p.id === produkId)
  const idx = cabangInventory.findIndex((inv) => inv.cabangId === branchId && inv.produkId === produkId)
  if (idx !== -1) {
    cabangInventory[idx] = { ...cabangInventory[idx], stok: cabangInventory[idx].stok + qty, updatedAt: now }
  } else if (produk) {
    cabangInventory.push({
      id: `ci-${branchId}-${produkId}-${Date.now()}`,
      cabangId: branchId, produkId,
      produkNama: produk.nama, produkSku: produk.sku, satuan: produk.satuan,
      stok: qty, updatedAt: now,
    })
  }
}

function deductInventory(branchId: string, produkId: string, qty: number, now: string) {
  const idx = cabangInventory.findIndex((inv) => inv.cabangId === branchId && inv.produkId === produkId)
  if (idx !== -1) {
    cabangInventory[idx] = { ...cabangInventory[idx], stok: Math.max(0, cabangInventory[idx].stok - qty), updatedAt: now }
  }
}

// Nomor PO resmi hanya digenerate saat "Kirim ke Supplier", bukan saat draft.
function generateNomorPO(): string {
  const year = new Date().getFullYear()
  const prefix = `PO-${year}-`
  const max = purchaseOrders
    .map((p) => p.nomorPO)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((m, n) => Math.max(m, n), 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

// Penanda sementara untuk dokumen yang masih draft (belum punya nomor resmi).
function generateNomorDraft(): string {
  return `DRAFT-${Math.random().toString(16).slice(2, 10)}`
}

// Bangun item + kalkulasi finansial PO dari body (dipakai saat create & update draft).
function buildPOFinansial(body: Record<string, unknown>) {
  const items = (body.items as Array<{ produkId: string; qtyPesan: number; hargaBeli: number }>).map((item, i) => {
    const produk = mockProduk.find((p) => p.id === item.produkId)
    return {
      id: `poi-new-${i}`,
      produkId: item.produkId,
      produkNama: produk?.nama ?? item.produkId,
      produkSku: produk?.sku ?? '',
      qtyPesan: item.qtyPesan,
      qtyDiterima: 0,
      hargaBeli: item.hargaBeli,
      subtotal: item.qtyPesan * item.hargaBeli,
    }
  })
  const bt = (body.biayaTambahan as PurchaseOrder['biayaTambahan']) ?? { ongkosKirim: 0, biayaBongkarMuat: 0, upahKurir: 0, lainnya: 0 }
  const totalHargaBarang = items.reduce((s, i) => s + i.subtotal, 0)
  const totalBiayaTambahan = (bt.ongkosKirim ?? 0) + (bt.biayaBongkarMuat ?? 0) + (bt.upahKurir ?? 0) + (bt.lainnya ?? 0)
  const totalKeseluruhan = totalHargaBarang + totalBiayaTambahan
  const totalQty = items.reduce((s, i) => s + i.qtyPesan, 0)
  const supplierId = (body.supplierId as string) ?? 'sup-1'
  const supplierNama = suppliers.find((s) => s.id === supplierId)?.nama ?? 'Supplier Demo'
  return {
    items,
    biayaTambahan: bt,
    totalHargaBarang,
    totalBiayaTambahan,
    totalKeseluruhan,
    totalQty,
    hppPerUnit: totalQty > 0 ? Math.round(totalKeseluruhan / totalQty) : 0,
    supplierId,
    supplierNama,
  }
}

function ok(data: unknown, status = 200): Omit<AxiosResponse, 'config'> {
  // Paginated responses from paginate() already have { data, meta } shape —
  // spread them so the mock matches the real backend envelope: { data: [...], meta: {...} }
  const isPaginated =
    data !== null &&
    typeof data === 'object' &&
    'data' in (data as object) &&
    'meta' in (data as object)
  return {
    data: isPaginated ? data : { data },
    status,
    statusText: 'OK',
    headers: {},
  }
}

function parseParams(url: string): URLSearchParams {
  const q = url.includes('?') ? url.split('?')[1] : ''
  return new URLSearchParams(q)
}

function matchPath(url: string, pattern: RegExp): RegExpMatchArray | null {
  const path = url.split('?')[0]
  return path.match(pattern)
}

// Current logged-in demo user (persisted by the auth store under `user`).
function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('user')
  return stored ? (JSON.parse(stored) as User) : null
}

// Generic client-side sort for demo/mock list endpoints. Reads sortBy/sortOrder
// (sent by DataTable via the page hooks) and reorders by the matching field.
// Returns the list untouched when no sort param is present, so each endpoint's
// own default ordering is preserved.
function applySort<T>(list: T[], params: Record<string, unknown>): T[] {
  const sortBy = params.sortBy as string | undefined
  if (!sortBy) return list
  const dir = (params.sortOrder as string) === 'desc' ? -1 : 1
  return [...list].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortBy]
    const bv = (b as Record<string, unknown>)[sortBy]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    const ad = Date.parse(av as string)
    const bd = Date.parse(bv as string)
    if (!Number.isNaN(ad) && !Number.isNaN(bd)) return (ad - bd) * dir
    return String(av).localeCompare(String(bv), 'id', { numeric: true }) * dir
  })
}

export function getMockResponse(config: AxiosRequestConfig): Omit<AxiosResponse, 'config'> | null {
  const rawUrl = config.url ?? ''
  const method = (config.method ?? 'get').toLowerCase()
  const params = config.params ?? {}
  const body = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {}

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (rawUrl === '/auth/me' && method === 'get') {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const user = stored ? JSON.parse(stored) : users[0]
    return ok(user)
  }

  if (rawUrl === '/auth/me' && method === 'patch') {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const current = stored ? JSON.parse(stored) : users[0]
    const updated = { ...current, ...body, updatedAt: new Date().toISOString() }
    const idx = users.findIndex((u) => u.id === current.id)
    if (idx !== -1) users[idx] = updated
    if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(updated))
    return ok(updated)
  }

  if (rawUrl === '/auth/change-password' && method === 'post') {
    // Demo mode: accept any non-empty values
    if (!body.passwordLama || !body.passwordBaru) {
      return { status: 400, statusText: 'Bad Request', data: { message: 'Password lama dan baru wajib diisi' }, headers: {} }
    }
    return ok({})
  }

  if (rawUrl === '/auth/logout' && method === 'post') {
    return ok({})
  }

  // ── Cabang ────────────────────────────────────────────────────────────────
  if (rawUrl === '/cabang' || rawUrl.startsWith('/cabang?')) {
    if (method === 'get') {
      let list = [...cabang]
      if (params.tipe) list = list.filter((c) => c.tipe === params.tipe)
      if (params.aktif !== undefined) list = list.filter((c) => c.aktif === (params.aktif === true || params.aktif === 'true'))
      const q = params.search as string | undefined
      if (q) list = list.filter((c) => c.nama.toLowerCase().includes(q.toLowerCase()) || c.lokasi.toLowerCase().includes(q.toLowerCase()))
      return ok(paginate(applySort(list, params), Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
    if (method === 'post') {
      const newItem: Cabang = {
        id: `cabang-${Date.now()}`,
        nama: body.nama,
        tipe: body.tipe,
        lokasi: body.lokasi,
        telepon: body.telepon ?? '',
        aktif: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      cabang = [...cabang, newItem]
      return ok(newItem, 201)
    }
  }

  const cabangIdMatch = matchPath(rawUrl, /^\/cabang\/([^/]+)$/)
  if (cabangIdMatch) {
    const id = cabangIdMatch[1]
    const idx = cabang.findIndex((c) => c.id === id)
    if (method === 'get') {
      return ok(cabang[idx] ?? null)
    }
    if (method === 'patch' && idx !== -1) {
      cabang[idx] = { ...cabang[idx], ...body, updatedAt: new Date().toISOString() }
      return ok(cabang[idx])
    }
  }

  // ── Denah Toko (floor plan) ─────────────────────────────────────────────────
  const denahMatch = matchPath(rawUrl, /^\/cabang\/([^/]+)\/denah$/)
  if (denahMatch) {
    const cabangId = denahMatch[1]
    const idx = denah.findIndex((d) => d.cabangId === cabangId)
    if (method === 'get') {
      // Return an empty default plan for branches that have none yet.
      return ok(
        denah[idx] ?? { cabangId, kolom: 16, baris: 12, elemen: [], updatedAt: new Date().toISOString() }
      )
    }
    if (method === 'put') {
      const payload = body as SaveDenahDto
      const next: Denah = {
        cabangId,
        kolom: payload.kolom,
        baris: payload.baris,
        elemen: payload.elemen,
        updatedAt: new Date().toISOString(),
      }
      if (idx !== -1) denah[idx] = next
      else denah.push(next)
      return ok(next)
    }
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  if (rawUrl === '/users' || rawUrl.startsWith('/users?')) {
    if (method === 'get') {
      let list = [...users]
      const q = params.search as string | undefined
      if (q) list = list.filter((u) => u.nama.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
      if (params.cabangId) list = list.filter((u) => u.cabangId === params.cabangId)
      if (params.role) list = list.filter((u) => u.role === params.role)
      return ok(paginate(applySort(list, params), Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
    if (method === 'post') {
      const cabangItem = body.cabangId ? cabang.find((c) => c.id === body.cabangId) : null
      const newUser: User = {
        id: `u-${Date.now()}`,
        nama: body.nama,
        email: body.email,
        role: body.role,
        cabangId: body.cabangId ?? null,
        cabang: cabangItem?.nama ?? null,
        tipeCabang: cabangItem?.tipe ?? null,
        aktif: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      users = [...users, newUser]
      return ok(newUser, 201)
    }
  }

  const userIdMatch = matchPath(rawUrl, /^\/users\/([^/]+)(?:\/(reset-password))?$/)
  if (userIdMatch) {
    const id = userIdMatch[1]
    const sub = userIdMatch[2]
    const idx = users.findIndex((u) => u.id === id)

    if (sub === 'reset-password' && method === 'post') return ok({})

    if (method === 'get') return ok(users[idx] ?? null)
    if (method === 'patch' && idx !== -1) {
      const cabangItem = body.cabangId !== undefined
        ? (body.cabangId ? cabang.find((c) => c.id === body.cabangId) : null)
        : undefined
      users[idx] = {
        ...users[idx],
        ...body,
        ...(cabangItem !== undefined ? { cabang: cabangItem?.nama ?? null, tipeCabang: cabangItem?.tipe ?? null } : {}),
        updatedAt: new Date().toISOString(),
      }
      return ok(users[idx])
    }
    if (method === 'delete' && idx !== -1) {
      users = users.filter((_, i) => i !== idx)
      return ok({})
    }
  }

  // ── Inventory dashboard / pergerakan / penyesuaian ───────────────────────
  if (rawUrl === '/inventory/dashboard' && method === 'get') {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const currentUser = storedUser ? JSON.parse(storedUser) : null
    const cabangId = currentUser?.cabangId
    const inv = cabangId ? cabangInventory.filter((i) => i.cabangId === cabangId) : cabangInventory
    const produkIds = new Set(inv.map((i) => i.produkId))
    const produkMap = Object.fromEntries(mockProduk.map((p) => [p.id, p]))
    let menipis = 0, habis = 0
    for (const i of inv) {
      const p = produkMap[i.produkId]
      if (!p) continue
      if (i.stok === 0) habis++
      else if (i.stok <= p.thresholdStok) menipis++
    }
    return ok({ totalProduk: produkIds.size, produkMenipis: menipis, produkHabis: habis, produkKedaluwarsa30Hari: 0 })
  }

  if (rawUrl === '/inventory/pergerakan' || rawUrl.startsWith('/inventory/pergerakan?')) {
    if (method === 'get') {
      let list = [...pergerakanStok]
      // Data scoping by role: non-superadmin users only see movements that
      // happened at their own cabang, so Stok Sebelum/Sesudah read sequentially.
      const me = getCurrentUser()
      if (me && me.role !== 'superadmin' && me.cabangId) {
        list = list.filter((p) => p.cabangId === me.cabangId)
      }
      const q = params.search as string | undefined
      if (q) list = list.filter((p) => p.produkNama.toLowerCase().includes(q.toLowerCase()) || p.produkSku.toLowerCase().includes(q.toLowerCase()))
      if (params.produkId) list = list.filter((p) => p.produkId === params.produkId)
      if (params.jenis) list = list.filter((p) => p.jenis === params.jenis)
      list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return ok(paginate(applySort(list, params), Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
  }

  if (rawUrl === '/inventory/penyesuaian' && method === 'post') {
    const produk = mockProduk.find((p) => p.id === body.produkId)
    if (!produk) return ok(null)
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const currentUser = storedUser ? JSON.parse(storedUser) : null
    const cabangId = currentUser?.cabangId ?? 'gudang-1'
    const cabangNama = currentUser?.cabang ?? cabang.find((c) => c.id === cabangId)?.nama ?? '—'
    const invIdx = cabangInventory.findIndex((i) => i.cabangId === cabangId && i.produkId === body.produkId)
    const stokSebelum = invIdx !== -1 ? cabangInventory[invIdx].stok : 0
    const stokSesudah = Math.max(0, stokSebelum + body.jumlah)
    if (invIdx !== -1) cabangInventory[invIdx] = { ...cabangInventory[invIdx], stok: stokSesudah, updatedAt: new Date().toISOString() }
    const entry: PergerakanStok = {
      id: `pg-s-${Date.now()}`,
      produkId: produk.id, produkNama: produk.nama, produkSku: produk.sku,
      cabangId, cabangNama,
      jenis: 'penyesuaian', jumlah: body.jumlah, stokSebelum, stokSesudah,
      referensi: null, userId: currentUser?.id ?? '', userNama: currentUser?.nama ?? '',
      catatan: body.catatan, alasan: body.alasan,
      createdAt: new Date().toISOString(),
    }
    pergerakanStok.unshift(entry)
    return ok(entry, 201)
  }

  // ── Suppliers ─────────────────────────────────────────────────────────────
  if (rawUrl === '/suppliers' || rawUrl.startsWith('/suppliers?')) {
    if (method === 'get') {
      let list = [...suppliers]
      const q = params.search as string | undefined
      if (q) list = list.filter((s) => s.nama.toLowerCase().includes(q.toLowerCase()) || s.kontak.includes(q))
      return ok(paginate(applySort(list, params), Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
    if (method === 'post') {
      const newSupplier: Supplier = {
        id: `sup-${Date.now()}`,
        nama: body.nama, kontak: body.kontak, alamat: body.alamat,
        produkDisuplai: body.produkDisuplai ?? [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      suppliers = [...suppliers, newSupplier]
      return ok(newSupplier, 201)
    }
  }

  const supplierIdMatch = matchPath(rawUrl, /^\/suppliers\/([^/]+)$/)
  if (supplierIdMatch) {
    const id = supplierIdMatch[1]
    const idx = suppliers.findIndex((s) => s.id === id)
    if (method === 'get') return ok(suppliers[idx] ?? null)
    if (method === 'patch' && idx !== -1) {
      suppliers[idx] = { ...suppliers[idx], ...body, updatedAt: new Date().toISOString() }
      return ok(suppliers[idx])
    }
    if (method === 'delete' && idx !== -1) {
      suppliers = suppliers.filter((_, i) => i !== idx)
      return ok({})
    }
  }

  // ── Cabang Inventory (per-branch stock) ──────────────────────────────────
  if (rawUrl === '/cabang-inventory' || rawUrl.startsWith('/cabang-inventory?')) {
    if (method === 'get') {
      let list = [...cabangInventory]
      if (params.cabangId) list = list.filter((inv) => inv.cabangId === params.cabangId)
      return ok(list)
    }
  }

  // ── Produk (master catalog) ───────────────────────────────────────────────
  if (rawUrl === '/products' || rawUrl.startsWith('/products?')) {
    if (method === 'get') {
      let list = [...mockProduk]
      const q = params.search as string | undefined
      if (q) list = list.filter((p) => p.nama.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))
      if (params.kategori) list = list.filter((p) => p.kategori === params.kategori)
      if (params.statusStok) list = list.filter((p) => p.statusStok === params.statusStok)
      if (params.supplierId) list = list.filter((p) => p.supplierId === params.supplierId)
      return ok(paginate(applySort(list, params), Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
  }

  const produkIdMatch = matchPath(rawUrl, /^\/products\/([^/]+)$/)
  if (produkIdMatch) {
    const id = produkIdMatch[1]
    const item = mockProduk.find((p) => p.id === id)
    if (method === 'get') return ok(item ?? null)
    if (method === 'patch') return ok({ ...item, ...body, updatedAt: new Date().toISOString() })
  }

  // ── Transfer Stok ─────────────────────────────────────────────────────────
  if (rawUrl === '/transfer-stok' || rawUrl.startsWith('/transfer-stok?')) {
    if (method === 'get') {
      let list = [...transferStok]
      if (params.status) list = list.filter((t) => t.status === params.status)
      const q = params.search as string | undefined
      if (q) list = list.filter((t) => t.nomorTransfer.toLowerCase().includes(q.toLowerCase()) || t.tokNama?.toLowerCase().includes(q.toLowerCase()))
      return ok(paginate(applySort(list, params), Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
    if (method === 'post') {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const currentUser = storedUser ? JSON.parse(storedUser) : null
      const gudangItem = cabang.find((c) => c.id === body.gudangId)
      const tokoItem = currentUser?.cabangId ? cabang.find((c) => c.id === currentUser.cabangId) : null
      const newTs: TransferStok = {
        id: `ts-${Date.now()}`,
        nomorTransfer: `TS-2026-${String(transferStok.length + 1).padStart(3, '0')}`,
        tokoId: currentUser?.cabangId ?? 'toko-1',
        tokNama: tokoItem?.nama ?? currentUser?.cabang ?? 'Toko',
        gudangId: body.gudangId,
        gudangNama: gudangItem?.nama ?? 'Gudang',
        status: 'Menunggu Persetujuan',
        items: body.items ?? [],
        catatanToko: body.catatan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      transferStok.push(newTs)
      return ok(newTs, 201)
    }
  }

  // Badge endpoints — ditangani eksplisit SEBELUM regex id/aksi di bawah, supaya
  // 'badge-count'/'acknowledge' tidak disalahartikan sebagai ID transfer.
  // Mode demo sengaja mengembalikan count non-numerik agar badge dihitung di
  // klien (sumber kebenaran tunggal di demo); acknowledge cukup no-op 200.
  if (rawUrl === '/transfer-stok/badge-count' && method === 'get') {
    return ok({ count: null })
  }
  if (rawUrl === '/transfer-stok/acknowledge' && method === 'post') {
    return ok({ acknowledged: 0 })
  }

  const tsActionMatch = matchPath(rawUrl, /^\/transfer-stok\/([^/]+)(?:\/(.+))?$/)
  if (tsActionMatch) {
    const id = tsActionMatch[1]
    const action = tsActionMatch[2]
    const idx = transferStok.findIndex((t) => t.id === id)

    if (method === 'get') return ok(transferStok[idx] ?? null)

    if (method === 'patch' && idx !== -1) {
      const now = new Date().toISOString()
      const ts = { ...transferStok[idx] }

      if (action === 'approve') {
        ts.status = 'Disetujui'
        ts.catatanGudang = body.catatan ?? ts.catatanGudang
        ts.approvedAt = now
        ts.items = ts.items.map((item) => {
          const incoming = (body.items as Array<{ itemId: string; qtyDisetujui: number }> | undefined)?.find((i) => i.itemId === item.id)
          return { ...item, qtyDisetujui: incoming?.qtyDisetujui ?? item.qtyDiminta }
        })
        // Deduct approved qty from gudang inventory
        for (const item of ts.items) {
          deductInventory(ts.gudangId, item.produkId, item.qtyDisetujui ?? item.qtyDiminta, now)
        }
      } else if (action === 'tolak') {
        ts.status = 'Ditolak'
        ts.catatanGudang = body.catatan ?? ts.catatanGudang
      } else if (action === 'kirim') {
        ts.status = 'Dikirim'
        ts.shippedAt = now
      } else if (action === 'terima') {
        ts.status = 'Selesai'
        ts.receivedAt = now
        ts.items = ts.items.map((item) => {
          const incoming = (body.items as Array<{ itemId: string; qtyDiterima: number; statusPenerimaan: StatusPenerimaanItem }> | undefined)?.find((i) => i.itemId === item.id)
          return incoming
            ? { ...item, qtyDiterima: incoming.qtyDiterima, statusPenerimaan: incoming.statusPenerimaan ?? 'diterima' }
            : item
        })
        // Add received qty to toko inventory
        for (const item of ts.items) {
          if (item.qtyDiterima && item.qtyDiterima > 0) {
            addInventory(ts.tokoId, item.produkId, item.qtyDiterima, now)
          }
        }
      }

      ts.updatedAt = now
      transferStok[idx] = ts
      return ok(ts)
    }
  }

  // ── Pengiriman ────────────────────────────────────────────────────────────
  if (rawUrl === '/deliveries' || rawUrl.startsWith('/deliveries?')) {
    if (method === 'get') {
      let list = [...pengiriman]
      if (params.status) list = list.filter((p) => p.status === params.status)
      const q = params.search as string | undefined
      if (q) list = list.filter((p) => p.nomorPengiriman.toLowerCase().includes(q.toLowerCase()) || p.driverNama?.toLowerCase().includes(q.toLowerCase()))
      return ok(paginate(applySort(list, params), Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
    if (method === 'post') {
      const newPg: Pengiriman = {
        id: `pg-${Date.now()}`,
        nomorPengiriman: `PG-2026-${String(pengiriman.length + 1).padStart(3, '0')}`,
        pesananIds: body.pesananIds ?? [],
        pesananList: (body.pesananIds ?? []).map((pid: string) => ({ id: pid, nomorPesanan: pid, pelangganNama: '-', alamat: '-' })),
        driverNama: body.driverNama,
        tanggalPengiriman: body.tanggalPengiriman,
        estimasiWaktu: body.estimasiWaktu,
        status: 'Dijadwalkan',
        catatan: body.catatan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      pengiriman.push(newPg)
      return ok(newPg, 201)
    }
  }

  const pgActionMatch = matchPath(rawUrl, /^\/deliveries\/([^/]+)(?:\/(.+))?$/)
  if (pgActionMatch) {
    const id = pgActionMatch[1]
    const action = pgActionMatch[2]
    const idx = pengiriman.findIndex((p) => p.id === id)

    if (method === 'get') return ok(pengiriman[idx] ?? null)

    if (idx !== -1) {
      const now = new Date().toISOString()
      const pg = { ...pengiriman[idx] }

      if (action === 'status' && method === 'patch') {
        const newStatus = body.status
        pg.status = newStatus
        if (newStatus === 'Selesai') {
          pg.catatanHasil = body.catatanHasil
          pg.checklistSubmittedAt = pg.checklistSubmittedAt ?? now
        }
        if (newStatus === 'Gagal') pg.alasanGagal = body.alasanGagal
        pg.updatedAt = now
        pengiriman[idx] = pg
        return ok(pg)
      }

      if (action === 'biaya' && method === 'patch') {
        const biaya = { ...body }
        biaya.total = (biaya.bbm ?? 0) + (biaya.upahDriver ?? 0) + (biaya.tol ?? 0) + (biaya.lainnya ?? 0)
        pg.biaya = biaya
        pg.updatedAt = now
        pengiriman[idx] = pg
        return ok(pg)
      }

      if (action === 'checklist' && method === 'post') {
        pg.checklistItems = body.items
        pg.checklistSubmittedAt = now
        pg.updatedAt = now
        pengiriman[idx] = pg
        return ok(pg)
      }

      if (action === 'bukti' && method === 'post') {
        pg.updatedAt = now
        pengiriman[idx] = pg
        return ok(pg)
      }
    }
  }

  // ── Purchase Orders ───────────────────────────────────────────────────────
  if (rawUrl === '/purchase-orders' || rawUrl.startsWith('/purchase-orders?')) {
    if (method === 'get') {
      let list = [...purchaseOrders]
      if (params.status) list = list.filter((p) => p.status === params.status)
      if (params.supplierId) list = list.filter((p) => p.supplierId === params.supplierId)
      const q = params.search as string | undefined
      if (q) list = list.filter((p) => p.nomorPO.toLowerCase().includes(q.toLowerCase()) || p.supplierNama.toLowerCase().includes(q.toLowerCase()))
      return ok(paginate(applySort(list, params), Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
    if (method === 'post') {
      const f = buildPOFinansial(body)
      const now = new Date().toISOString()
      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}`,
        // Draft belum punya nomor resmi — pakai penanda sementara sampai dikirim ke supplier.
        nomorPO: generateNomorDraft(),
        supplierId: f.supplierId,
        supplierNama: f.supplierNama,
        items: f.items,
        biayaTambahan: f.biayaTambahan,
        totalHargaBarang: f.totalHargaBarang,
        totalBiayaTambahan: f.totalBiayaTambahan,
        totalKeseluruhan: f.totalKeseluruhan,
        hppPerUnit: f.hppPerUnit,
        totalQty: f.totalQty,
        status: 'Draft',
        statusPembayaran: 'Belum Bayar',
        totalDibayar: 0,
        sisaHutang: f.totalKeseluruhan,
        catatan: body.catatan,
        estimasiTanggalTiba: body.estimasiTanggalTiba,
        createdAt: now,
        updatedAt: now,
      }
      purchaseOrders.push(newPO)
      return ok(newPO, 201)
    }
  }

  const poActionMatch = matchPath(rawUrl, /^\/purchase-orders\/([^/]+)(?:\/(.+))?$/)
  if (poActionMatch) {
    const id = poActionMatch[1]
    const action = poActionMatch[2]
    const idx = purchaseOrders.findIndex((p) => p.id === id)

    // GET detail
    if (method === 'get' && !action) return ok(purchaseOrders[idx] ?? null)

    // GET pembayaran list
    if (method === 'get' && action === 'pembayaran') {
      return ok(pembayaranPO.filter((p) => p.purchaseOrderId === id))
    }

    if (idx !== -1) {
      const now = new Date().toISOString()
      const po = { ...purchaseOrders[idx] }

      // Edit draft — hanya boleh saat status masih Draft.
      if (!action && method === 'patch') {
        if (po.status !== 'Draft') {
          return ok({ message: 'Hanya PO berstatus Draft yang bisa diedit' }, 422)
        }
        const f = buildPOFinansial(body)
        const updated: PurchaseOrder = {
          ...po,
          supplierId: f.supplierId,
          supplierNama: f.supplierNama,
          items: f.items,
          biayaTambahan: f.biayaTambahan,
          totalHargaBarang: f.totalHargaBarang,
          totalBiayaTambahan: f.totalBiayaTambahan,
          totalKeseluruhan: f.totalKeseluruhan,
          hppPerUnit: f.hppPerUnit,
          totalQty: f.totalQty,
          sisaHutang: f.totalKeseluruhan - po.totalDibayar,
          catatan: (body.catatan as string | undefined) ?? po.catatan,
          estimasiTanggalTiba: (body.estimasiTanggalTiba as string | undefined) ?? po.estimasiTanggalTiba,
          updatedAt: now,
        }
        purchaseOrders[idx] = updated
        return ok(updated)
      }

      if (action === 'kirim' && method === 'post') {
        // Nomor resmi baru digenerate di sini jika PO masih memakai penanda draft.
        if (po.nomorPO.startsWith('DRAFT-')) po.nomorPO = generateNomorPO()
        po.status = 'Dikirim ke Supplier'
        po.updatedAt = now
        purchaseOrders[idx] = po
        return ok(po)
      }

      if (action === 'goods-receipt' && method === 'post') {
        const incoming = body.items as Array<{ itemId: string; qtyDiterima: number }>
        po.items = po.items.map((item) => {
          const match = incoming.find((i) => i.itemId === item.id)
          return match ? { ...item, qtyDiterima: match.qtyDiterima } : item
        })
        const allReceived = po.items.every((i) => i.qtyDiterima >= i.qtyPesan)
        po.status = allReceived ? 'Diterima' : 'Sebagian Diterima'
        po.updatedAt = now
        purchaseOrders[idx] = po
        // Add received qty to gudang inventory
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
        const currentUser = storedUser ? JSON.parse(storedUser) : null
        const gudangId = currentUser?.cabangId ?? 'gudang-1'
        for (const line of incoming) {
          if (line.qtyDiterima > 0) {
            const poItem = po.items.find((i) => i.id === line.itemId)
            if (poItem) addInventory(gudangId, poItem.produkId, line.qtyDiterima, now)
          }
        }
        return ok(po)
      }

      if (action === 'batalkan' && method === 'post') {
        po.status = 'Dibatalkan'
        po.catatan = body.alasan ?? po.catatan
        po.sisaHutang = 0
        po.updatedAt = now
        purchaseOrders[idx] = po
        return ok(po)
      }

      if (action === 'pembayaran' && method === 'post') {
        const newBayar: PembayaranPO = {
          id: `pay-${Date.now()}`,
          purchaseOrderId: id,
          nominal: body.nominal,
          tanggal: body.tanggal,
          metode: body.metode,
          catatan: body.catatan,
        }
        pembayaranPO.push(newBayar)
        po.totalDibayar = (po.totalDibayar ?? 0) + body.nominal
        po.sisaHutang = Math.max(0, po.totalKeseluruhan - po.totalDibayar)
        po.statusPembayaran = po.sisaHutang === 0 ? 'Lunas' : 'Sebagian'
        po.updatedAt = now
        purchaseOrders[idx] = po
        return ok(newBayar, 201)
      }
    }
  }

  // ── Pesanan ───────────────────────────────────────────────────────────────
  if (rawUrl === '/orders' || rawUrl.startsWith('/orders?')) {
    if (method === 'get') {
      let list = [...pesanan]
      if (params.status === 'ada_retur') list = list.filter((o) => o.hasRetur)
      else if (params.status) list = list.filter((o) => o.status === params.status)
      if (params.sumber) list = list.filter((o) => o.sumber === params.sumber)
      if (params.pelangganId) list = list.filter((o) => o.pelangganId === params.pelangganId)
      if (params.kasirId) list = list.filter((o) => o.kasirId === params.kasirId)
      const q = params.search as string | undefined
      if (q) list = list.filter((o) => o.nomorPesanan.toLowerCase().includes(q.toLowerCase()) || o.pelangganNama.toLowerCase().includes(q.toLowerCase()))
      // sort newest first
      list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return ok(paginate(applySort(list, params), Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
    if (method === 'post') {
      const items = (body.items as Array<{ produkId: string; qty: number; hargaSatuan: number }>).map((item, i) => {
        const produk = mockProduk.find((p) => p.id === item.produkId)
        return {
          id: `oi-new-${i}`,
          produkId: item.produkId,
          produkNama: produk?.nama ?? item.produkId,
          produkSku: produk?.sku ?? '',
          qty: item.qty,
          hargaSatuan: item.hargaSatuan,
          subtotal: item.qty * item.hargaSatuan,
        }
      })
      const subtotal = items.reduce((s, i) => s + i.subtotal, 0)
      const diskon = body.diskon ?? 0
      const newOrder: Pesanan = {
        id: `ord-${Date.now()}`,
        nomorPesanan: `ORD-2026-${String(pesanan.length + 48).padStart(3, '0')}`,
        pelangganId: body.pelangganId,
        pelangganNama: body.pelangganNama,
        pelangganTelepon: body.pelangganTelepon,
        items,
        subtotal,
        diskon,
        total: subtotal - diskon,
        metodePembayaran: body.metodePembayaran,
        metodePengiriman: body.metodePengiriman,
        alamatPengiriman: body.alamatPengiriman,
        catatan: body.catatan,
        kasirId: 'u-3',
        kasirNama: 'Siti Kasir',
        sumber: (body.sumber as 'pos' | 'manual') ?? 'manual',
        status: body.sumber === 'pos' ? 'Selesai' : 'Baru',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      pesanan.unshift(newOrder)
      return ok(newOrder, 201)
    }
  }

  const orderActionMatch = matchPath(rawUrl, /^\/orders\/([^/]+)(?:\/(.+))?$/)
  if (orderActionMatch) {
    const id = orderActionMatch[1]
    const action = orderActionMatch[2]
    const idx = pesanan.findIndex((o) => o.id === id)

    if (method === 'get' && !action) return ok(pesanan[idx] ?? null)

    // struk & surat-jalan: return empty blob stub
    if (method === 'get' && (action === 'struk' || action === 'surat-jalan')) {
      return ok(new Blob([''], { type: 'application/pdf' }))
    }

    if (action === 'status' && method === 'patch' && idx !== -1) {
      const now = new Date().toISOString()
      pesanan[idx] = { ...pesanan[idx], status: body.status, catatan: body.catatan ?? pesanan[idx].catatan, updatedAt: now }
      return ok(pesanan[idx])
    }

    if (action === 'retur' && method === 'post' && idx !== -1) {
      const now = new Date().toISOString()
      const order = pesanan[idx]
      const returnItems = body.items as Array<{ produkId: string; qty: number }>

      // Get the branch where this order was handled (use kasir's cabang or default toko-1)
      const kasirUser = users.find((u) => u.id === order.kasirId)
      const branchId = kasirUser?.cabangId ?? 'toko-1'

      // Restore stock and calculate refund amount
      let returNominal = 0
      const returItemsDetail: { produkId: string; produkNama: string; qty: number; nominal: number }[] = []
      for (const ri of returnItems) {
        addInventory(branchId, ri.produkId, ri.qty, now)
        const orderItem = order.items.find((i) => i.produkId === ri.produkId)
        if (orderItem) {
          const nominal = orderItem.hargaSatuan * ri.qty
          returNominal += nominal
          returItemsDetail.push({ produkId: ri.produkId, produkNama: orderItem.produkNama, qty: ri.qty, nominal })
        }
      }

      pesanan[idx] = { ...order, hasRetur: true, returNominal, returItems: returItemsDetail, updatedAt: now }
      return ok(pesanan[idx])
    }
  }

  // ── Pelanggan VIP ─────────────────────────────────────────────────────────

  // GET /customers/vip/ringkasan — summary piutang (must come before the /{id} catch-all)
  if ((rawUrl === '/customers/vip/ringkasan' || rawUrl.startsWith('/customers/vip/ringkasan?')) && method === 'get') {
    return ok(computeRingkasan())
  }

  if (rawUrl === '/customers/vip' || rawUrl.startsWith('/customers/vip?')) {
    if (method === 'get') {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const sevenDaysLater = new Date(today.getTime() + 7 * 86_400_000)

      let list = [...pelangganVIP]
      if (params.status) list = list.filter((c) => c.status === params.status)
      if (params.statusKredit) list = list.filter((c) => c.statusKredit === params.statusKredit)
      const q = params.search as string | undefined
      if (q) list = list.filter((c) => c.namaLengkap.toLowerCase().includes(q.toLowerCase()) || c.nomorTelepon.includes(q))

      // Filter by statusTagihan
      const statusTagihan = params.statusTagihan as string | undefined
      if (statusTagihan === 'ada_hutang') {
        list = list.filter((c) => c.kreditTerpakai > 0)
      } else if (statusTagihan === 'mendekati_jt') {
        list = list.filter((c) => {
          const aktif = tagihanVIP.filter((t) => t.pelangganId === c.id && t.status !== 'Lunas')
          return aktif.some((t) => {
            if (!t.dueDate) return false
            const due = new Date(t.dueDate); due.setHours(0, 0, 0, 0)
            return due >= today && due <= sevenDaysLater
          })
        })
      } else if (statusTagihan === 'overdue') {
        list = list.filter((c) => {
          const aktif = tagihanVIP.filter((t) => t.pelangganId === c.id && t.status !== 'Lunas')
          return aktif.some((t) => {
            if (!t.dueDate) return false
            const due = new Date(t.dueDate); due.setHours(0, 0, 0, 0)
            return due < today
          })
        })
      }

      // Enrich each customer with tagihanTerdekat
      const enriched = list.map((c) => ({ ...c, tagihanTerdekat: computeTagihanTerdekat(c.id) }))
      return ok(paginate(applySort(enriched, params), Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
    if (method === 'post') {
      const newVIP: PelangganVIP = {
        id: `vip-${Date.now()}`,
        namaLengkap: body.namaLengkap,
        nomorTelepon: body.nomorTelepon,
        alamat: body.alamat,
        creditLimit: body.creditLimit,
        kreditTerpakai: 0,
        sisaKredit: body.creditLimit,
        statusKredit: 'aman',
        status: body.status ?? 'aktif',
        catatan: body.catatan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      pelangganVIP.push(newVIP)
      return ok(newVIP, 201)
    }
  }

  // POST catat pembayaran tagihan (no ID in URL)
  if (rawUrl === '/customers/vip/pembayaran' && method === 'post') {
    const tIdx = tagihanVIP.findIndex((t) => t.id === body.tagihanId)
    if (tIdx !== -1) {
      const t = tagihanVIP[tIdx]
      const bayar = Math.min(body.nominal, t.sisaTagihan)
      tagihanVIP[tIdx] = {
        ...t,
        jumlahDibayar: t.jumlahDibayar + bayar,
        sisaTagihan: t.sisaTagihan - bayar,
        status: t.sisaTagihan - bayar === 0 ? 'Lunas' : 'Sebagian',
      }
      // update kredit pelanggan
      const cIdx = pelangganVIP.findIndex((c) => c.id === t.pelangganId)
      if (cIdx !== -1) {
        const c = pelangganVIP[cIdx]
        const kreditTerpakai = Math.max(0, c.kreditTerpakai - bayar)
        const sisaKredit = c.creditLimit - kreditTerpakai
        pelangganVIP[cIdx] = {
          ...c,
          kreditTerpakai,
          sisaKredit,
          statusKredit: kreditTerpakai > c.creditLimit ? 'melebihi_limit' : kreditTerpakai > c.creditLimit * 0.85 ? 'mendekati_limit' : 'aman',
          updatedAt: new Date().toISOString(),
        }
      }
    }
    return ok({})
  }

  const vipActionMatch = matchPath(rawUrl, /^\/customers\/vip\/([^/]+)(?:\/(.+))?$/)
  if (vipActionMatch) {
    const id = vipActionMatch[1]
    const action = vipActionMatch[2]
    const idx = pelangganVIP.findIndex((c) => c.id === id)

    if (method === 'get' && !action) return ok(pelangganVIP[idx] ?? null)

    if (action === 'tagihan' && method === 'get') {
      const list = tagihanVIP.filter((t) => t.pelangganId === id)
      return ok(paginate(applySort(list, params), Number(params.page ?? 1), Number(params.limit ?? 25)))
    }

    if (action === 'transaksi' && method === 'get') {
      const list = pesanan.filter((o) => o.pelangganId === id)
      return ok(paginate(applySort(list, params), Number(params.page ?? 1), Number(params.limit ?? 25)))
    }

    if (method === 'patch' && idx !== -1) {
      pelangganVIP[idx] = { ...pelangganVIP[idx], ...body, updatedAt: new Date().toISOString() }
      return ok(pelangganVIP[idx])
    }

    if (method === 'delete' && idx !== -1) {
      pelangganVIP.splice(idx, 1)
      return ok({})
    }
  }

  // ── Stok Opname ───────────────────────────────────────────────────────────
  if (rawUrl === '/stok-opname' || rawUrl.startsWith('/stok-opname?')) {
    if (method === 'get') {
      let list = [...stokOpname]
      if (params.cabangId) list = list.filter((s) => s.cabangId === params.cabangId)
      if (params.status) list = list.filter((s) => s.status === params.status)
      list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return ok(paginate(applySort(list, params), Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
    if (method === 'post') {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const currentUser = storedUser ? JSON.parse(storedUser) : null
      const cabangItem = currentUser?.cabangId ? cabang.find((c) => c.id === currentUser.cabangId) : null
      const items = (body.items as Array<{ produkId: string; stokSistem?: number; stokFisik: number }>).map((item, i) => {
        const produk = mockProduk.find((p) => p.id === item.produkId)
        const stokSistem = item.stokSistem ?? produk?.stok ?? 0
        return {
          id: `soi-new-${i}`,
          produkId: item.produkId,
          produkNama: produk?.nama ?? item.produkId,
          produkSku: produk?.sku ?? '',
          satuan: produk?.satuan ?? '',
          stokSistem,
          stokFisik: item.stokFisik,
          selisih: item.stokFisik - stokSistem,
        }
      })
      const newOpname: StokOpname = {
        id: `so-${Date.now()}`,
        nomorOpname: `SO-2026-${String(stokOpname.length + 1).padStart(3, '0')}`,
        cabangId: currentUser?.cabangId ?? 'gudang-1',
        cabangNama: cabangItem?.nama ?? currentUser?.cabang ?? 'Cabang',
        status: 'Draft',
        items,
        catatan: body.catatan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      stokOpname.unshift(newOpname)
      return ok(newOpname, 201)
    }
  }

  const soActionMatch = matchPath(rawUrl, /^\/stok-opname\/([^/]+)(?:\/(.+))?$/)
  if (soActionMatch) {
    const id = soActionMatch[1]
    const action = soActionMatch[2]
    const idx = stokOpname.findIndex((s) => s.id === id)

    if (method === 'get' && !action) return ok(stokOpname[idx] ?? null)

    if (action === 'submit' && method === 'post' && idx !== -1) {
      const now = new Date().toISOString()
      stokOpname[idx] = { ...stokOpname[idx], status: 'Diajukan', submittedAt: now, updatedAt: now }
      return ok(stokOpname[idx])
    }

    if (action === 'approve' && method === 'post' && idx !== -1) {
      const now = new Date().toISOString()
      const so = stokOpname[idx]
      stokOpname[idx] = { ...so, status: 'Disetujui', approvedAt: now, updatedAt: now }
      // Set branch inventory to stokFisik (reconciled count)
      for (const item of so.items) {
        upsertInventory(so.cabangId, item.produkId, item.stokFisik, now)
      }
      return ok(stokOpname[idx])
    }

    if (method === 'delete' && idx !== -1) {
      stokOpname.splice(idx, 1)
      return ok({})
    }
  }

  // ── Laporan ───────────────────────────────────────────────────────────────
  const reportPath = rawUrl.split('?')[0]

  if (reportPath === '/reports/penjualan') {
    const dari = params.tanggalDari ? new Date(params.tanggalDari as string) : new Date(Date.now() - 7 * 86400000)
    const sampai = params.tanggalSampai ? new Date(params.tanggalSampai as string) : new Date()
    sampai.setHours(23, 59, 59)
    const filtered = pesanan.filter((o) => { const d = new Date(o.createdAt); return d >= dari && d <= sampai })
    const totalTransaksi = filtered.length
    const totalPendapatan = filtered.reduce((s, o) => s + o.total, 0)
    const rataRataTransaksi = totalTransaksi > 0 ? Math.round(totalPendapatan / totalTransaksi) : 0
    const dailyMap: Record<string, { total: number; count: number }> = {}
    filtered.forEach((o) => {
      const k = o.createdAt.slice(0, 10)
      if (!dailyMap[k]) dailyMap[k] = { total: 0, count: 0 }
      dailyMap[k].total += o.total
      dailyMap[k].count += 1
    })
    const harian: { tanggal: string; total: number; transaksi: number }[] = []
    const cur = new Date(dari)
    while (cur <= sampai) {
      const k = cur.toISOString().slice(0, 10)
      harian.push({ tanggal: k.slice(5), total: dailyMap[k]?.total ?? 0, transaksi: dailyMap[k]?.count ?? 0 })
      cur.setDate(cur.getDate() + 1)
    }
    const metodeCounts: Record<string, number> = {}
    filtered.forEach((o) => { if (o.metodePembayaran) metodeCounts[o.metodePembayaran] = (metodeCounts[o.metodePembayaran] ?? 0) + 1 })
    const mTotal = Object.values(metodeCounts).reduce((s, v) => s + v, 0)
    const metodePembayaran = Object.entries(metodeCounts).map(([name, count]) => ({ name, value: mTotal > 0 ? Math.round((count / mTotal) * 100) : 0 }))
    const produkMap: Record<string, number> = {}
    filtered.forEach((o) => o.items.forEach((i) => { produkMap[i.produkNama] = (produkMap[i.produkNama] ?? 0) + i.qty }))
    const topProduk = Object.entries(produkMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nama, qty]) => ({ nama, qty }))
    return ok({ totalTransaksi, totalPendapatan, rataRataTransaksi, harian, metodePembayaran, topProduk })
  }

  if (reportPath === '/reports/stok') {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const currentUser = storedUser ? JSON.parse(storedUser) : null
    const cId = currentUser?.cabangId
    const inv = cId ? cabangInventory.filter((i) => i.cabangId === cId) : cabangInventory
    const produkMap = Object.fromEntries(mockProduk.map((p) => [p.id, p]))
    let menipis = 0, habis = 0
    const itemsMenipis: { nama: string; sku: string; stok: number; threshold: number; satuan: string }[] = []
    const itemsHabis: { nama: string; sku: string; satuan: string }[] = []
    for (const i of inv) {
      const p = produkMap[i.produkId]
      if (!p) continue
      if (i.stok === 0) { habis++; itemsHabis.push({ nama: p.nama, sku: p.sku, satuan: p.satuan }) }
      else if (i.stok <= p.thresholdStok) { menipis++; itemsMenipis.push({ nama: p.nama, sku: p.sku, stok: i.stok, threshold: p.thresholdStok, satuan: p.satuan }) }
    }
    return ok({ produkMenipis: menipis, produkHabis: habis, produkKedaluwarsa: 0, itemsMenipis, itemsHabis })
  }

  if (reportPath === '/reports/pembelian') {
    const totalPO = purchaseOrders.length
    const totalNilai = purchaseOrders.reduce((s, po) => s + po.totalKeseluruhan, 0)
    const totalDibayar = purchaseOrders.reduce((s, po) => s + (po.totalDibayar ?? 0), 0)
    const statusMap: Record<string, number> = {}
    purchaseOrders.forEach((po) => { statusMap[po.status] = (statusMap[po.status] ?? 0) + 1 })
    const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({ status, count }))
    const supplierMap: Record<string, number> = {}
    purchaseOrders.forEach((po) => { supplierMap[po.supplierNama] = (supplierMap[po.supplierNama] ?? 0) + po.totalKeseluruhan })
    const topSupplier = Object.entries(supplierMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([nama, nilai]) => ({ nama, nilai }))
    return ok({ totalPO, totalNilai, totalDibayar, sisaHutang: totalNilai - totalDibayar, statusBreakdown, topSupplier })
  }

  if (reportPath === '/reports/pelanggan-vip') {
    const totalPelanggan = pelangganVIP.length
    const totalKreditTerpakai = pelangganVIP.reduce((s, c) => s + c.kreditTerpakai, 0)
    const totalKreditLimit = pelangganVIP.reduce((s, c) => s + c.creditLimit, 0)
    const totalTagihanOutstanding = tagihanVIP.filter((t) => t.status !== 'Lunas').reduce((s, t) => s + t.sisaTagihan, 0)
    const statusMap: Record<string, number> = {}
    pelangganVIP.forEach((c) => { statusMap[c.statusKredit] = (statusMap[c.statusKredit] ?? 0) + 1 })
    const statusKredit = Object.entries(statusMap).map(([status, count]) => ({ status, count }))
    return ok({ totalPelanggan, totalKreditTerpakai, totalKreditLimit, totalTagihanOutstanding, statusKredit })
  }

  if (reportPath === '/reports/pengiriman') {
    const total = pengiriman.length
    const selesai = pengiriman.filter((p) => p.status === 'Selesai').length
    const gagal = pengiriman.filter((p) => p.status === 'Gagal').length
    const berlangsung = total - selesai - gagal
    return ok({ totalPengiriman: total, selesai, gagal, berlangsung, successRate: total > 0 ? Math.round((selesai / total) * 100) : 0 })
  }

  if (reportPath === '/reports/shift') {
    const dari = params.tanggalDari ? new Date(params.tanggalDari as string) : new Date(Date.now() - 7 * 86400000)
    const sampai = params.tanggalSampai ? new Date(params.tanggalSampai as string) : new Date()
    sampai.setHours(23, 59, 59)
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const currentUser = storedUser ? JSON.parse(storedUser) : null
    const isSuperadmin = currentUser?.role === 'superadmin'
    let list = shifts.filter((s) => {
      const d = new Date(s.mulaiAt)
      return d >= dari && d <= sampai
    })
    if (!isSuperadmin && currentUser?.cabangId) {
      list = list.filter((s) => s.cabangId === currentUser.cabangId)
    }
    list = list.sort((a, b) => new Date(b.mulaiAt).getTime() - new Date(a.mulaiAt).getTime())
    const totalShift = list.length
    const totalTransaksi = list.reduce((s, sh) => s + sh.totalTransaksi, 0)
    const totalPendapatan = list.reduce((s, sh) => s + sh.totalPendapatan, 0)
    const totalTunai = list.reduce((s, sh) => s + sh.totalTunai, 0)
    const totalNonTunai = list.reduce((s, sh) => s + sh.totalNonTunai, 0)
    const totalDiskon = list.reduce((s, sh) => s + sh.totalDiskon, 0)
    return ok({ totalShift, totalTransaksi, totalPendapatan, totalTunai, totalNonTunai, totalDiskon, shifts: list })
  }

  if (reportPath.startsWith('/reports/') && (reportPath.endsWith('/export/pdf') || reportPath.endsWith('/export/excel'))) {
    return ok(new Blob([''], { type: 'application/octet-stream' }))
  }

  // ── Settings ──────────────────────────────────────────────────────────────
  if (rawUrl === '/settings/toko') {
    if (method === 'get') return ok(infoToko)
    if (method === 'patch') {
      infoToko = { ...infoToko, ...body }
      return ok(infoToko)
    }
  }

  if (rawUrl === '/settings/kategori') {
    if (method === 'get') return ok(kategoriProduk)
    if (method === 'post') {
      const newKat: KategoriSetting = { id: `kat-${Date.now()}`, nama: body.nama, deskripsi: body.deskripsi ?? null }
      kategoriProduk = [...kategoriProduk, newKat]
      return ok(newKat, 201)
    }
  }

  const katIdMatch = matchPath(rawUrl, /^\/settings\/kategori\/([^/]+)$/)
  if (katIdMatch) {
    const id = katIdMatch[1]
    const idx = kategoriProduk.findIndex((k) => k.id === id)
    if (method === 'patch' && idx !== -1) {
      kategoriProduk[idx] = { ...kategoriProduk[idx], ...body }
      return ok(kategoriProduk[idx])
    }
    if (method === 'delete' && idx !== -1) {
      kategoriProduk = kategoriProduk.filter((k) => k.id !== id)
      return ok({})
    }
  }

  if (rawUrl === '/settings/cabang') {
    if (method === 'get') return ok(cabang)
  }

  const settingsCabangIdMatch = matchPath(rawUrl, /^\/settings\/cabang\/([^/]+)$/)
  if (settingsCabangIdMatch) {
    const id = settingsCabangIdMatch[1]
    const idx = cabang.findIndex((c) => c.id === id)
    if (method === 'patch' && idx !== -1) {
      cabang[idx] = { ...cabang[idx], ...body, updatedAt: new Date().toISOString() }
      return ok(cabang[idx])
    }
    if (method === 'post') {
      const newCabang: Cabang = {
        id: `cabang-${Date.now()}`,
        nama: body.nama,
        tipe: body.tipe,
        lokasi: body.lokasi,
        telepon: body.telepon ?? '',
        aktif: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      cabang = [...cabang, newCabang]
      return ok(newCabang, 201)
    }
  }

  if (rawUrl === '/settings/cabang/baru' && method === 'post') {
    const newCabang: Cabang = {
      id: `cabang-${Date.now()}`,
      nama: body.nama,
      tipe: body.tipe,
      lokasi: body.lokasi,
      telepon: body.telepon ?? '',
      aktif: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    cabang = [...cabang, newCabang]
    return ok(newCabang, 201)
  }

  // ── Notifikasi ────────────────────────────────────────────────────────────
  // Resolve demo current user from localStorage (same pattern as other handlers)
  const getDemoUser = (): User => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    return stored ? JSON.parse(stored) : (users.find((u) => u.id === 'u-3') ?? users[0])
  }

  if (rawUrl === '/notifications' || rawUrl.startsWith('/notifications?')) {
    if (method === 'get') {
      const currentUser = getDemoUser()
      let list = notifikasi.filter((n) => {
        const cabangOk = n.targetCabang === 'semua' || (currentUser.cabangId != null && (n.targetCabang as string[]).includes(currentUser.cabangId))
        const roleOk = n.targetRole === 'semua' || (n.targetRole as string[]).includes(currentUser.role)
        return cabangOk && roleOk
      })
      list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      const dataWithRead = list.map((n) => ({
        ...n,
        isRead: n.readByUserIds.includes(currentUser.id),
      }))
      return ok(dataWithRead)
    }
    if (method === 'post') {
      const currentUser = getDemoUser()
      const newNotif: Notifikasi = {
        id: `notif-${Date.now()}`,
        judul: body.judul,
        pesan: body.pesan,
        tipe: body.tipe,
        targetCabang: body.targetCabang,
        targetRole: body.targetRole,
        createdBy: currentUser.id,
        createdByNama: currentUser.nama,
        readByUserIds: [],
        createdAt: new Date().toISOString(),
      }
      notifikasi = [newNotif, ...notifikasi]
      return ok(newNotif, 201)
    }
  }

  if (rawUrl === '/notifications/read-all' && method === 'post') {
    const currentUser = getDemoUser()
    notifikasi = notifikasi.map((n) => {
      const cabangOk = n.targetCabang === 'semua' || (currentUser.cabangId != null && (n.targetCabang as string[]).includes(currentUser.cabangId))
      const roleOk = n.targetRole === 'semua' || (n.targetRole as string[]).includes(currentUser.role)
      if (cabangOk && roleOk && !n.readByUserIds.includes(currentUser.id)) {
        return { ...n, readByUserIds: [...n.readByUserIds, currentUser.id] }
      }
      return n
    })
    return ok({})
  }

  const notifActionMatch = matchPath(rawUrl, /^\/notifications\/([^/]+)(?:\/(.+))?$/)
  if (notifActionMatch) {
    const id = notifActionMatch[1]
    const action = notifActionMatch[2]
    const idx = notifikasi.findIndex((n) => n.id === id)

    if (action === 'read' && method === 'post') {
      const currentUser = getDemoUser()
      if (idx !== -1 && !notifikasi[idx].readByUserIds.includes(currentUser.id)) {
        notifikasi[idx] = {
          ...notifikasi[idx],
          readByUserIds: [...notifikasi[idx].readByUserIds, currentUser.id],
        }
      }
      return ok({})
    }

    if (method === 'delete' && idx !== -1) {
      notifikasi = notifikasi.filter((_, i) => i !== idx)
      return ok({})
    }
  }

  // ── Unmatched ─────────────────────────────────────────────────────────────
  return null
}
