import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import {
  mockCabang,
  mockUsers,
  mockProduk,
  mockTransferStok,
  mockPengiriman,
  mockPurchaseOrders,
  mockPembayaranPO,
  paginate,
} from './data'
import type { Cabang, User, TransferStok, Pengiriman, PurchaseOrder, PembayaranPO, StatusPenerimaanItem } from '@/types'

// In-memory mutable state for demo mutations
let cabang = [...mockCabang] as Cabang[]
let users = [...mockUsers] as User[]
const transferStok = [...mockTransferStok] as TransferStok[]
const pengiriman = [...mockPengiriman] as Pengiriman[]
const purchaseOrders = [...mockPurchaseOrders] as PurchaseOrder[]
const pembayaranPO = [...mockPembayaranPO] as PembayaranPO[]

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

  // ── Produk / Inventory ────────────────────────────────────────────────────
  if (rawUrl === '/products' || rawUrl.startsWith('/products?') || rawUrl === '/inventory' || rawUrl.startsWith('/inventory?')) {
    if (method === 'get') {
      let list = [...mockProduk]
      const q = params.search as string | undefined
      if (q) list = list.filter((p) => p.nama.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))
      if (params.kategori) list = list.filter((p) => p.kategori === params.kategori)
      if (params.statusStok) list = list.filter((p) => p.statusStok === params.statusStok)
      return ok(paginate(list, Number(params.page ?? 1), Number(params.limit ?? 25)))
    }
  }

  const produkIdMatch = matchPath(rawUrl, /^\/(?:products|inventory)\/([^/]+)$/)
  if (produkIdMatch) {
    const id = produkIdMatch[1]
    const item = mockProduk.find((p) => p.id === id)
    if (method === 'get') return ok(item ?? null)
    // mutations: return unchanged for demo
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

  // ── Unmatched ─────────────────────────────────────────────────────────────
  return null
}
