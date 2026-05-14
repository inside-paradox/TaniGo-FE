import api from './axios'

export interface InfoToko {
  nama: string
  alamat: string
  telepon: string
}

export interface CabangSetting {
  id: string
  nama: string
  tipe: 'toko' | 'gudang'
  lokasi: string
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
    const { data } = await api.patch('/settings/toko', payload)
    return data.data
  },

  getCabang: async (): Promise<CabangSetting[]> => {
    const { data } = await api.get('/settings/cabang')
    return data.data
  },

  createCabang: async (payload: Omit<CabangSetting, 'id' | 'aktif'>): Promise<CabangSetting> => {
    const { data } = await api.post('/settings/cabang/baru', payload)
    return data.data
  },

  updateCabang: async (id: string, payload: Partial<Omit<CabangSetting, 'id'>>): Promise<CabangSetting> => {
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
