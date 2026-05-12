import type { CreateTransaksiDto, CreateReturDto, Transaksi, Retur } from '@/types/pos'
import { api } from './axios'

export async function createTransaksi(dto: CreateTransaksiDto): Promise<Transaksi> {
  const { data } = await api.post<{ data: Transaksi }>('/api/transactions', dto)
  return data.data
}

export async function fetchTransaksi(id: string): Promise<Transaksi> {
  const { data } = await api.get<{ data: Transaksi }>(`/api/transactions/${id}`)
  return data.data
}

export async function createRetur(transaksiId: string, dto: CreateReturDto): Promise<Retur> {
  const { data } = await api.post<{ data: Retur }>(`/api/transactions/${transaksiId}/return`, dto)
  return data.data
}
