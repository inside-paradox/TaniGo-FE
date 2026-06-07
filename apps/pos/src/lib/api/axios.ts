import axios from 'axios'
import { getDemoInventory } from '@/lib/demo/inventory'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Demo mode interceptor — intercepts requests when token is 'demo-token'
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Demo mode: intercept requests and return mock data
    if (token === 'demo-token') {
      const url = config.url ?? ''
      const method = config.method?.toLowerCase() ?? 'get'
      const params = config.params ?? {}

      const mock = (data: unknown, status = 200) => {
        const mockError = new axios.Cancel('__mock__')
        ;(mockError as unknown as Record<string, unknown>).__mockData = { data: { data }, status }
        throw mockError
      }

      // ── Inventory ────────────────────────────────────────────────────────────
      if (url === '/cabang-inventory' || url.startsWith('/cabang-inventory?')) {
        const cabangId = params.cabangId as string | undefined
        mock(getDemoInventory(cabangId ?? 'toko-1'))
      }

      // ── Transactions ─────────────────────────────────────────────────────────
      if (url === '/api/transactions' && method === 'post') {
        const body = config.data
          ? typeof config.data === 'string' ? JSON.parse(config.data) : config.data
          : {}
        const inventory = getDemoInventory('toko-1')
        const items = (body.items ?? []) as Array<{
          produkId: string; qty: number; hargaSatuan: number; diskon?: number
        }>
        const subtotal = items.reduce((s, i) => s + i.hargaSatuan * i.qty, 0)
        const totalDiskon = items.reduce((s, i) => s + (i.diskon ?? 0), 0)
        const total = subtotal - totalDiskon
        const pembayaran = body.pembayaran ?? []
        const tunai = pembayaran.find((p: { metode: string; nominal: number }) => p.metode === 'Tunai')
        const kembalian = tunai ? Math.max(0, tunai.nominal - total) : 0
        // Get active shift from localStorage demo state
        const demoShiftRaw = localStorage.getItem('demo_active_shift')
        const demoShift = demoShiftRaw ? JSON.parse(demoShiftRaw) : null
        const transaksi = {
          id: `trx-${Date.now()}`,
          nomorStruk: `STR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`,
          items: items.map((i, idx) => {
            const produk = inventory.find((p) => p.produkId === i.produkId)
            return {
              id: `item-${idx}`,
              produkId: i.produkId,
              produkNama: produk?.produkNama ?? i.produkId,
              produkSku: produk?.produkSku ?? i.produkId,
              satuan: produk?.satuan ?? 'pcs',
              qty: i.qty,
              hargaSatuan: i.hargaSatuan,
              diskon: i.diskon ?? 0,
              subtotal: i.hargaSatuan * i.qty - (i.diskon ?? 0),
            }
          }),
          subtotal, totalDiskon, total, pembayaran, kembalian,
          kasirId: 'u-3', kasirNama: 'Siti Kasir',
          shiftId: demoShift?.id ?? 'shift-demo',
          createdAt: new Date().toISOString(),
        }
        // Update demo shift stats in localStorage
        if (demoShift) {
          demoShift.totalTransaksi += 1
          demoShift.totalPenjualan += total
          if (pembayaran.some((p: { metode: string }) => p.metode === 'Tunai'))
            demoShift.totalPenjualanTunai += total
          else if (pembayaran.some((p: { metode: string }) => p.metode === 'QRIS'))
            demoShift.totalPenjualanQRIS += total
          else if (pembayaran.some((p: { metode: string }) => p.metode === 'Transfer Bank'))
            demoShift.totalPenjualanTransfer += total
          localStorage.setItem('demo_active_shift', JSON.stringify(demoShift))
        }
        // Store transaction for later lookup (retur)
        const stored = JSON.parse(localStorage.getItem('demo_transactions') ?? '{}')
        stored[transaksi.id] = transaksi
        localStorage.setItem('demo_transactions', JSON.stringify(stored))
        mock(transaksi, 201)
      }

      // GET /api/transactions/:id  (also supports lookup by nomorStruk)
      const trxGetMatch = url.match(/^\/api\/transactions\/([^/]+)$/)
      if (trxGetMatch && method === 'get') {
        const id = trxGetMatch[1]
        const stored: Record<string, unknown> = JSON.parse(localStorage.getItem('demo_transactions') ?? '{}')

        // Seed a demo transaction if the store is empty so retur can be tested
        // without having to make a sale first.
        if (Object.keys(stored).length === 0) {
          const demoTrx = {
            id: 'trx-demo-001',
            nomorStruk: 'STR-DEMO-001',
            items: [
              { id: 'item-demo-1', produkId: 'p-1', produkNama: 'Pupuk Urea 100kg', produkSku: 'SKU-001', satuan: 'karung', qty: 3, hargaSatuan: 175000, diskon: 0, subtotal: 525000, qtyTersisa: 3 },
              { id: 'item-demo-2', produkId: 'p-2', produkNama: 'Pupuk NPK Mutiara', produkSku: 'SKU-002', satuan: 'kg', qty: 5, hargaSatuan: 16000, diskon: 0, subtotal: 80000, qtyTersisa: 5 },
            ],
            subtotal: 605000, totalDiskon: 0, total: 605000,
            pembayaran: [{ metode: 'Tunai', nominal: 700000 }],
            kembalian: 95000,
            kasirId: 'u-3', kasirNama: 'Siti Kasir',
            shiftId: 'shift-demo',
            createdAt: new Date().toISOString(),
          }
          stored['trx-demo-001'] = demoTrx
          localStorage.setItem('demo_transactions', JSON.stringify(stored))
        }

        // Lookup by id first, fallback to nomorStruk so kasir can search by struk number
        const trx = stored[id]
          ?? Object.values(stored).find((t: unknown) => (t as { nomorStruk?: string }).nomorStruk === id)
          ?? null
        mock(trx)
      }

      // POST /api/transactions/:id/return
      const returMatch = url.match(/^\/api\/transactions\/([^/]+)\/return$/)
      if (returMatch && method === 'post') {
        const transaksiId = returMatch[1]
        const stored = JSON.parse(localStorage.getItem('demo_transactions') ?? '{}')
        const trx = stored[transaksiId]
        const body = config.data
          ? typeof config.data === 'string' ? JSON.parse(config.data) : config.data
          : {}
        const returItems = (body.items ?? []) as Array<{ itemTransaksiId: string; qty: number }>
        const resolvedItems = returItems.map((ri) => {
          const orig = trx?.items?.find((i: { id: string }) => i.id === ri.itemTransaksiId)
          return {
            itemTransaksiId: ri.itemTransaksiId,
            produkId: orig?.produkId ?? '',
            produkNama: orig?.produkNama ?? '',
            produkSku: orig?.produkSku ?? '',
            satuan: orig?.satuan ?? 'pcs',
            qty: ri.qty,
            hargaSatuan: orig?.hargaSatuan ?? 0,
            subtotal: (orig?.hargaSatuan ?? 0) * ri.qty,
          }
        })
        const totalRefund = resolvedItems.reduce((s, i) => s + i.subtotal, 0)
        const metodeRefund: string = body.metodeRefund ?? 'Tunai'

        // Update qtyTersisa on stored transaction items so subsequent retur lookups are accurate
        if (trx) {
          returItems.forEach((ri) => {
            const origItem = trx.items?.find((i: { id: string }) => i.id === ri.itemTransaksiId)
            if (origItem) {
              origItem.qtyTersisa = Math.max(0, (origItem.qtyTersisa ?? origItem.qty) - ri.qty)
            }
          })
          stored[transaksiId] = trx
          localStorage.setItem('demo_transactions', JSON.stringify(stored))
        }

        // Update demo shift retur stats — breakdown by metode for expectedCash accuracy
        const demoShiftRaw2 = localStorage.getItem('demo_active_shift')
        const demoShift2 = demoShiftRaw2 ? JSON.parse(demoShiftRaw2) : null
        if (demoShift2) {
          demoShift2.totalRetur = (demoShift2.totalRetur ?? 0) + totalRefund
          if (metodeRefund === 'Tunai') {
            demoShift2.totalReturTunai = (demoShift2.totalReturTunai ?? 0) + totalRefund
          } else {
            demoShift2.totalReturTransfer = (demoShift2.totalReturTransfer ?? 0) + totalRefund
          }
          localStorage.setItem('demo_active_shift', JSON.stringify(demoShift2))
        }
        const retur = {
          id: `retur-${Date.now()}`,
          transaksiId,
          nomorStruk: trx?.nomorStruk ?? '',
          items: resolvedItems,
          totalRefund,
          metodeRefund: body.metodeRefund ?? 'Tunai',
          kasirId: 'u-3',
          kasirNama: 'Siti Kasir',
          createdAt: new Date().toISOString(),
        }
        mock(retur, 201)
      }

      // ── Shifts ───────────────────────────────────────────────────────────────
      if (url === '/api/shifts/active' && method === 'get') {
        const raw = localStorage.getItem('demo_active_shift')
        mock(raw ? JSON.parse(raw) : null)
      }

      if (url === '/api/shifts/open' && method === 'post') {
        const body = config.data
          ? typeof config.data === 'string' ? JSON.parse(config.data) : config.data
          : {}
        const shift = {
          id: `shift-${Date.now()}`,
          kasirId: 'u-3', kasirNama: 'Siti Kasir',
          cabang: 'Toko Utama',
          waktuBuka: new Date().toISOString(),
          waktuTutup: null,
          saldoAwal: body.saldoAwal ?? 0,
          saldoAkhir: null,
          totalTransaksi: 0,
          totalPenjualan: 0,
          totalPenjualanTunai: 0,
          totalPenjualanQRIS: 0,
          totalPenjualanTransfer: 0,
          totalDiskon: 0,
          totalRetur: 0,
          totalReturTunai: 0,
          totalReturTransfer: 0,
          status: 'aktif',
        }
        localStorage.setItem('demo_active_shift', JSON.stringify(shift))
        mock(shift, 201)
      }

      if (url === '/api/shifts/close' && method === 'post') {
        const raw = localStorage.getItem('demo_active_shift')
        const shift = raw ? JSON.parse(raw) : {}
        const body = config.data
          ? typeof config.data === 'string' ? JSON.parse(config.data) : config.data
          : {}
        const closed = { ...shift, status: 'tutup', saldoAkhir: body.saldoAkhir ?? 0, waktuTutup: new Date().toISOString() }
        localStorage.removeItem('demo_active_shift')
        mock(closed)
      }
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle demo mock cancellations
    if (axios.isCancel(error) && (error as unknown as Record<string, unknown>).__mockData) {
      return (error as unknown as Record<string, unknown>).__mockData
    }

    const original = error.config

    // Never intercept 401 from the login endpoint — wrong credentials should
    // be handled by the caller, not the refresh/redirect flow.
    if (error.response?.status === 401 && original.url === '/auth/login') {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        })

        localStorage.setItem('access_token', data.data.accessToken)
        original.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('tanigo-auth')
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)
