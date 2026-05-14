import axios from 'axios'
import { getDemoInventory } from '@/lib/demo/inventory'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
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
      const params = config.params ?? {}

      if (url === '/cabang-inventory' || url.startsWith('/cabang-inventory?')) {
        const cabangId = params.cabangId as string | undefined
        const inventory = getDemoInventory(cabangId ?? 'toko-1')
        // Throw a special cancellation with mock data attached
        const mockError = new axios.Cancel('__mock__')
        ;(mockError as unknown as Record<string, unknown>).__mockData = { data: { data: inventory } }
        throw mockError
      }

      if (url === '/api/transactions' && config.method?.toLowerCase() === 'post') {
        const body = config.data
          ? typeof config.data === 'string'
            ? JSON.parse(config.data)
            : config.data
          : {}
        const items = (body.items ?? []) as Array<{
          produkId: string; qty: number; hargaSatuan: number; diskon?: number
        }>
        const subtotal = items.reduce((s, i) => s + i.hargaSatuan * i.qty, 0)
        const totalDiskon = items.reduce((s, i) => s + (i.diskon ?? 0), 0)
        const total = subtotal - totalDiskon
        const pembayaran = body.pembayaran ?? []
        const tunai = pembayaran.find((p: { metode: string; nominal: number }) => p.metode === 'Tunai')
        const kembalian = tunai ? Math.max(0, tunai.nominal - total) : 0

        const transaksi = {
          id: `trx-${Date.now()}`,
          nomorStruk: `STR-${Date.now()}`,
          items: items.map((i, idx) => ({
            id: `item-${idx}`,
            produkId: i.produkId,
            produkNama: `Produk ${i.produkId}`,
            produkSku: i.produkId,
            satuan: 'pcs',
            qty: i.qty,
            hargaSatuan: i.hargaSatuan,
            diskon: i.diskon ?? 0,
            subtotal: i.hargaSatuan * i.qty - (i.diskon ?? 0),
          })),
          subtotal,
          totalDiskon,
          total,
          pembayaran,
          kembalian,
          kasirId: 'demo-001',
          kasirNama: 'Kasir Demo',
          shiftId: 'shift-demo',
          createdAt: new Date().toISOString(),
        }

        const mockError = new axios.Cancel('__mock__')
        ;(mockError as unknown as Record<string, unknown>).__mockData = { data: { data: transaksi } }
        throw mockError
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
        localStorage.removeItem('auth_user')
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)
