import api from './axios'

export interface ReportParams {
  tanggalDari: string
  tanggalSampai: string
}

export const reportsApi = {
  getPenjualan: async (params: ReportParams) => {
    const { data } = await api.get('/reports/penjualan', { params })
    return data.data
  },

  getStok: async (params: ReportParams) => {
    const { data } = await api.get('/reports/stok', { params })
    return data.data
  },

  getShift: async (params: ReportParams & { kasirId?: string }) => {
    const { data } = await api.get('/reports/shift', { params })
    return data.data
  },

  getPembelian: async (params: ReportParams) => {
    const { data } = await api.get('/reports/pembelian', { params })
    return data.data
  },

  getPelangganVIP: async (params: ReportParams) => {
    const { data } = await api.get('/reports/pelanggan-vip', { params })
    return data.data
  },

  getPengiriman: async (params: ReportParams) => {
    const { data } = await api.get('/reports/pengiriman', { params })
    return data.data
  },

  exportPdf: async (jenis: string, params: ReportParams): Promise<Blob> => {
    const { data } = await api.get(`/reports/${jenis}/export/pdf`, {
      params,
      responseType: 'blob',
    })
    return data
  },

  exportExcel: async (jenis: string, params: ReportParams): Promise<Blob> => {
    const { data } = await api.get(`/reports/${jenis}/export/excel`, {
      params,
      responseType: 'blob',
    })
    return data
  },
}
