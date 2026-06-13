import api from './axios'
import type { Denah, SaveDenahDto } from '@/types'

export const denahApi = {
  /** Get the floor plan for a branch. Returns an empty default if none exists. */
  getByCabang: async (cabangId: string): Promise<Denah> => {
    const { data } = await api.get(`/cabang/${cabangId}/denah`)
    return data.data
  },

  /** Replace the whole floor plan for a branch (positions + product assignment). */
  save: async (cabangId: string, payload: SaveDenahDto): Promise<Denah> => {
    const { data } = await api.put(`/cabang/${cabangId}/denah`, payload)
    return data.data
  },
}
