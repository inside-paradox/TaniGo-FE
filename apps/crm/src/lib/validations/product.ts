import { z } from 'zod'

export const produkSchema = z.object({
  nama: z.string().min(1, 'Nama produk wajib diisi'),
  sku: z.string().optional(),
  kategori: z.enum(['Benih', 'Pupuk', 'Pestisida', 'Alat & Mesin', 'Lainnya']),
  satuan: z.string().min(1, 'Satuan wajib diisi'),
  hargaBeli: z.number().min(0, 'Harga beli tidak boleh negatif'),
  hargaJual: z.number().min(0, 'Harga jual tidak boleh negatif'),
  stokAwal: z.number().min(0, 'Stok awal tidak boleh negatif'),
  tanggalKedaluwarsa: z.string().optional().nullable(),
  thresholdStok: z.number().min(0, 'Threshold stok tidak boleh negatif'),
  statusAktif: z.boolean(),
})

export type ProdukFormData = z.infer<typeof produkSchema>
