import type { CreateTransaksiDto, CreateReturDto, Transaksi, Retur } from '@/types/pos'
import { api } from './axios'

// Backend wraps responses as { data: { data: T } } — unwrap both layers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap<T>(data: any): T {
  return data?.data?.data ?? data?.data ?? data
}

export async function createTransaksi(dto: CreateTransaksiDto): Promise<Transaksi> {
  const { data } = await api.post('/api/transactions', dto)
  return unwrap<Transaksi>(data)
}

export async function fetchTransaksi(id: string): Promise<Transaksi> {
  const { data } = await api.get(`/api/transactions/${id}`)
  return unwrap<Transaksi>(data)
}

export async function createRetur(transaksiId: string, dto: CreateReturDto): Promise<Retur> {
  const { data } = await api.post(`/api/transactions/${transaksiId}/return`, dto)
  return unwrap<Retur>(data)
}
