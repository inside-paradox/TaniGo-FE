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
  paginate,
} from './data'
import type { Cabang, User, TransferStok, Pengiriman, PurchaseOrder, PembayaranPO, Pesanan, PelangganVIP, TagihanVIP, StokOpname, CabangInventory, Supplier, PergerakanStok, StatusPenerimaanItem } from '@/types'

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

function ok(data: unknown, status = 200): Omit<AxiosResponse, 'config'> {
  return { data: { data }, status, statusText: 'OK', headers: {} }
}

function parseParams(url: string): URLSearchParams {
  const q = url.includes('?') ? url.split('?')[1] : ''
  return new URLSearchParams(q)
}

function matchPath(url: string, pattern: RegExp): RegExpMatchArray | null {
  const path = url.split('?')[0]
  return path.match(pattern)
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
      return ok(paginate(list, Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
    if (method === 'post') {
      const newItem: Cabang = {
        id: `cabang-${Date.now()}`,
        nama: body.nama,
        tipe: body.tipe,
        lokasi: body.lokasi,
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

  // ── Users ─────────────────────────────────────────────────────────────────
  if (rawUrl === '/users' || rawUrl.startsWith('/users?')) {
    if (method === 'get') {
      let list = [...users]
      const q = params.search as string | undefined
      if (q) list = list.filter((u) => u.nama.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
      if (params.cabangId) list = list.filter((u) => u.cabangId === params.cabangId)
      if (params.role) list = list.filter((u) => u.role === params.role)
      return ok(paginate(list, Number(params.page ?? 1), Number(params.limit ?? 25)))
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
      const q = params.search as string | undefined
      if (q) list = list.filter((p) => p.produkNama.toLowerCase().includes(q.toLowerCase()) || p.produkSku.toLowerCase().includes(q.toLowerCase()))
      if (params.produkId) list = list.filter((p) => p.produkId === params.produkId)
      if (params.jenis) list = list.filter((p) => p.jenis === params.jenis)
      list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return ok(paginate(list, Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
  }

  if (rawUrl === '/inventory/penyesuaian' && method === 'post') {
    const produk = mockProduk.find((p) => p.id === body.produkId)
    if (!produk) return ok(null)
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const currentUser = storedUser ? JSON.parse(storedUser) : null
    const cabangId = currentUser?.cabangId ?? 'gudang-1'
    const invIdx = cabangInventory.findIndex((i) => i.cabangId === cabangId && i.produkId === body.produkId)
    const stokSebelum = invIdx !== -1 ? cabangInventory[invIdx].stok : 0
    const stokSesudah = Math.max(0, stokSebelum + body.jumlah)
    if (invIdx !== -1) cabangInventory[invIdx] = { ...cabangInventory[invIdx], stok: stokSesudah, updatedAt: new Date().toISOString() }
    const entry: PergerakanStok = {
      id: `pg-s-${Date.now()}`,
      produkId: produk.id, produkNama: produk.nama, produkSku: produk.sku,
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
      return ok(paginate(list, Number(params.page ?? 1), Number(params.limit ?? 25)))
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
      return ok(paginate(list, Number(params.page ?? 1), Number(params.limit ?? 25)))
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
      return ok(paginate(list, Number(params.page ?? 1), Number(params.limit ?? 25)))
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
          const incoming = (body.items as Array<{ transferItemId: string; qtyDisetujui: number }> | undefined)?.find((i) => i.transferItemId === item.id)
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
          const incoming = (body.items as Array<{ transferItemId: string; qtyDiterima: number; status: string }> | undefined)?.find((i) => i.transferItemId === item.id)
          return incoming
            ? { ...item, qtyDiterima: incoming.qtyDiterima, statusPenerimaan: incoming.status as StatusPenerimaanItem }
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
      return ok(paginate(list, Number(params.page ?? 1), Number(params.limit ?? 25)))
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
      return ok(paginate(list, Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
    if (method === 'post') {
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
      const bt = body.biayaTambahan ?? { ongkosKirim: 0, biayaBongkarMuat: 0, upahKurir: 0, lainnya: 0 }
      const totalBarang = items.reduce((s, i) => s + i.subtotal, 0)
      const totalBiaya = (bt.ongkosKirim ?? 0) + (bt.biayaBongkarMuat ?? 0) + (bt.upahKurir ?? 0) + (bt.lainnya ?? 0)
      const totalKeseluruhan = totalBarang + totalBiaya
      const totalQty = items.reduce((s, i) => s + i.qtyPesan, 0)
      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}`,
        nomorPO: `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
        supplierId: body.supplierId ?? 'sup-1',
        supplierNama: 'Supplier Demo',
        items,
        biayaTambahan: bt,
        totalHargaBarang: totalBarang,
        totalBiayaTambahan: totalBiaya,
        totalKeseluruhan,
        hppPerUnit: totalQty > 0 ? Math.round(totalKeseluruhan / totalQty) : 0,
        totalQty,
        status: 'Draft',
        statusPembayaran: 'Belum Bayar',
        totalDibayar: 0,
        sisaHutang: totalKeseluruhan,
        catatan: body.catatan,
        estimasiTanggalTiba: body.estimasiTanggalTiba,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

      if (action === 'kirim' && method === 'post') {
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
      if (params.status) list = list.filter((o) => o.status === params.status)
      if (params.pelangganId) list = list.filter((o) => o.pelangganId === params.pelangganId)
      if (params.kasirId) list = list.filter((o) => o.kasirId === params.kasirId)
      const q = params.search as string | undefined
      if (q) list = list.filter((o) => o.nomorPesanan.toLowerCase().includes(q.toLowerCase()) || o.pelangganNama.toLowerCase().includes(q.toLowerCase()))
      // sort newest first
      list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return ok(paginate(list, Number(params.page ?? 1), Number(params.limit ?? 25)))
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
        status: 'Baru',
        catatan: body.catatan,
        kasirId: 'u-3',
        kasirNama: 'Siti Kasir',
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
  }

  // ── Pelanggan VIP ─────────────────────────────────────────────────────────
  if (rawUrl === '/customers/vip' || rawUrl.startsWith('/customers/vip?')) {
    if (method === 'get') {
      let list = [...pelangganVIP]
      if (params.status) list = list.filter((c) => c.status === params.status)
      if (params.statusKredit) list = list.filter((c) => c.statusKredit === params.statusKredit)
      const q = params.search as string | undefined
      if (q) list = list.filter((c) => c.namaLengkap.toLowerCase().includes(q.toLowerCase()) || c.nomorTelepon.includes(q))
      return ok(paginate(list, Number(params.page ?? 1), Number(params.limit ?? 25)))
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
      return ok(paginate(list, Number(params.page ?? 1), Number(params.limit ?? 25)))
    }

    if (action === 'transaksi' && method === 'get') {
      const list = pesanan.filter((o) => o.pelangganId === id)
      return ok(paginate(list, Number(params.page ?? 1), Number(params.limit ?? 25)))
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
      return ok(paginate(list, Number(params.page ?? 1), Number(params.limit ?? 25)))
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

  // ── Unmatched ─────────────────────────────────────────────────────────────
  return null
}
