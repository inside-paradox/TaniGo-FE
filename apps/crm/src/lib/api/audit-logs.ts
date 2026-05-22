import api from './axios'
import type { PaginatedResponse, TableParams } from '@/types'

export interface AuditLog {
  id: string
  userId: string
  userNama: string
  modul: string
  aksi: string
  nilaiLama?: Record<string, unknown> | null
  nilaiBaru?: Record<string, unknown> | null
  ipAddress?: string | null
  createdAt: string
}

export const auditLogsApi = {
  getAll: async (
    params: TableParams & { userId?: string; modul?: string; tanggalDari?: string; tanggalSampai?: string }
  ): Promise<PaginatedResponse<AuditLog>> => {
    const { data } = await api.get('/audit-logs', { params })
    return { data: data.data, meta: data.meta }
  },
}
