import type { BukaShiftDto, TutupShiftDto, Shift } from '@/types/pos'
import { api } from './axios'

export async function bukaShift(dto: BukaShiftDto): Promise<Shift> {
  const { data } = await api.post<{ data: Shift }>('/api/shifts/open', dto)
  return data.data
}

export async function tutupShift(dto: TutupShiftDto): Promise<Shift> {
  const { data } = await api.post<{ data: Shift }>('/api/shifts/close', dto)
  return data.data
}

export async function fetchActiveShift(): Promise<Shift | null> {
  try {
    const { data } = await api.get<{ data: Shift }>('/api/shifts/active')
    return data.data
  } catch {
    return null
  }
}
