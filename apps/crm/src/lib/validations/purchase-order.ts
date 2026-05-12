import { z } from 'zod'

export const poItemSchema = z.object({
  produkId: z.string().min(1, 'Pilih produk'),
  qtyPesan: z.number().min(1, 'Qty minimal 1'),
  hargaBeli: z.number().min(0, 'Harga tidak boleh negatif'),
})

export const biayaTambahanSchema = z.object({
  ongkosKirim: z.number().min(0).default(0),
  biayaBongkarMuat: z.number().min(0).default(0),
  upahKurir: z.number().min(0).default(0),
  lainnya: z.number().min(0).default(0),
  keteranganLainnya: z.string().optional(),
})

export const createPOSchema = z.object({
  supplierId: z.string().min(1, 'Pilih supplier'),
  items: z.array(poItemSchema).min(1, 'Minimal 1 item'),
  biayaTambahan: biayaTambahanSchema,
  catatan: z.string().optional(),
  estimasiTanggalTiba: z.string().optional(),
})

export type CreatePOFormData = z.infer<typeof createPOSchema>

export const pembayaranPOSchema = z.object({
  nominal: z.number().min(1, 'Nominal harus lebih dari 0'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  metode: z.enum(['Transfer', 'Tunai', 'Cek']),
  catatan: z.string().optional(),
})

export type PembayaranPOFormData = z.infer<typeof pembayaranPOSchema>
