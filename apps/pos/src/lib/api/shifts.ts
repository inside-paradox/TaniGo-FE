import type { BukaShiftDto, TutupShiftDto, Shift } from '@/types/pos'
import { api } from './axios'

export async function bukaShift(dto: BukaShiftDto): Promise<Shift> {
  const { data } = await api.post('/api/shifts/open', dto)
  return data?.data ?? data
}

export async function tutupShift(dto: TutupShiftDto): Promise<Shift> {
  const { data } = await api.post('/api/shifts/close', dto)
  return data?.data ?? data
}

export async function fetchActiveShift(): Promise<Shift | null> {
  try {
    const { data } = await api.get('/api/shifts/active')
    // Backend may return { data: Shift }, Shift directly, or null/{}
    const shift: Shift | null = data?.data ?? data ?? null
    return shift?.id ? shift : null
  } catch {
    return null
  }
}
