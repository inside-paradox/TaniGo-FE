import type { BukaShiftDto, TutupShiftDto, Shift } from '@/types/pos'
import { api } from './axios'

// Backend wraps responses as { data: { data: T } } — unwrap both layers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap<T>(data: any): T {
  return data?.data?.data ?? data?.data ?? data
}

export async function bukaShift(dto: BukaShiftDto): Promise<Shift> {
  const { data } = await api.post('/api/shifts/open', dto)
  return unwrap<Shift>(data)
}

export async function tutupShift(dto: TutupShiftDto): Promise<Shift> {
  const { data } = await api.post('/api/shifts/close', dto)
  return unwrap<Shift>(data)
}

export async function fetchActiveShift(): Promise<Shift | null> {
  try {
    const { data } = await api.get('/api/shifts/active')
    const shift = unwrap<Shift>(data)
    return shift?.id ? shift : null
  } catch {
    return null
  }
}
