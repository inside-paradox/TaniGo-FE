import api from './axios'

export interface InfoToko {
  nama: string
  alamat: string
  telepon: string
  logo?: string | null
}

export interface Cabang {
  id: string
  nama: string
  alamat: string
  telepon: string
  aktif: boolean
}

export interface KategoriProdukSetting {
  id: string
  nama: string
  deskripsi?: string | null
}

export const settingsApi = {
  getInfoToko: async (): Promise<InfoToko> => {
    const { data } = await api.get('/settings/toko')
    return data.data
  },

  updateInfoToko: async (payload: InfoToko): Promise<InfoToko> => {
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value))
      }
    })
    const { data } = await api.patch('/settings/toko', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },

  getCabang: async (): Promise<Cabang[]> => {
    const { data } = await api.get('/settings/cabang')
    return data.data
  },

  createCabang: async (payload: Omit<Cabang, 'id'>): Promise<Cabang> => {
    const { data } = await api.post('/settings/cabang', payload)
    return data.data
  },

  updateCabang: async (id: string, payload: Partial<Omit<Cabang, 'id'>>): Promise<Cabang> => {
    const { data } = await api.patch(`/settings/cabang/${id}`, payload)
    return data.data
  },

  getKategori: async (): Promise<KategoriProdukSetting[]> => {
    const { data } = await api.get('/settings/kategori')
    return data.data
  },

  createKategori: async (payload: Omit<KategoriProdukSetting, 'id'>): Promise<KategoriProdukSetting> => {
    const { data } = await api.post('/settings/kategori', payload)
    return data.data
  },

  updateKategori: async (id: string, payload: Partial<Omit<KategoriProdukSetting, 'id'>>): Promise<KategoriProdukSetting> => {
    const { data } = await api.patch(`/settings/kategori/${id}`, payload)
    return data.data
  },

  deleteKategori: async (id: string): Promise<void> => {
    await api.delete(`/settings/kategori/${id}`)
  },
}
