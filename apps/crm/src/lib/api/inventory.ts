import api from './axios'
import type {
  CabangInventory,
  PergerakanStok,
  PenyesuaianStokDto,
  DashboardStok,
  DashboardToko,
  DashboardGudang,
  DashboardSuperadmin,
  Supplier,
  CreateSupplierDto,
  PaginatedResponse,
  TableParams,
} from '@/types'

export const inventoryApi = {
  getCabangInventory: async (cabangId: string): Promise<CabangInventory[]> => {
    const { data } = await api.get('/cabang-inventory', { params: { cabangId } })
    return data.data
  },

  getDashboard: async (): Promise<DashboardStok> => {
    const { data } = await api.get('/inventory/dashboard')
    return data.data
  },

  getDashboardToko: async (): Promise<DashboardToko> => {
    const { data } = await api.get('/dashboard/toko')
    return data.data
  },

  getDashboardGudang: async (): Promise<DashboardGudang> => {
    const { data } = await api.get('/dashboard/gudang')
    return data.data
  },

  getDashboardSuperadmin: async (): Promise<DashboardSuperadmin> => {
    const { data } = await api.get('/dashboard/superadmin')
    return data.data
  },

  getPergerakan: async (
    params: TableParams & { produkId?: string; jenis?: string }
  ): Promise<PaginatedResponse<PergerakanStok>> => {
    const { data } = await api.get('/inventory/pergerakan', { params })
    return { data: data.data, meta: data.meta }
  },

  penyesuaianStok: async (payload: PenyesuaianStokDto): Promise<PergerakanStok> => {
    const { data } = await api.post('/inventory/penyesuaian', payload)
    return data.data
  },

  getSuppliers: async (params: TableParams): Promise<PaginatedResponse<Supplier>> => {
    const { data } = await api.get('/suppliers', { params })
    return { data: data.data, meta: data.meta }
  },

  getSupplierById: async (id: string): Promise<Supplier> => {
    const { data } = await api.get(`/suppliers/${id}`)
    return data.data
  },

  createSupplier: async (payload: CreateSupplierDto): Promise<Supplier> => {
    const { data } = await api.post('/suppliers', payload)
    return data.data
  },

  updateSupplier: async (id: string, payload: Partial<CreateSupplierDto>): Promise<Supplier> => {
    const { data } = await api.patch(`/suppliers/${id}`, payload)
    return data.data
  },

  deleteSupplier: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`)
  },
}
