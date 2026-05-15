import api from './axios'
import type { Notifikasi, CreateNotifikasiDto } from '@/types'

export const notifikasiApi = {
  getAll: async (): Promise<Notifikasi[]> => {
    const { data } = await api.get('/notifications')
    return data.data
  },
  create: async (dto: CreateNotifikasiDto): Promise<Notifikasi> => {
    const { data } = await api.post('/notifications', dto)
    return data.data
  },
  markAsRead: async (id: string): Promise<void> => {
    await api.post(`/notifications/${id}/read`)
  },
  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/read-all')
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`)
  },
}
