import { z } from 'zod'

export const penyesuaianStokSchema = z.object({
  produkId: z.string().min(1, 'Pilih produk'),
  jumlah: z.number().refine((v) => v !== 0, 'Jumlah tidak boleh 0'),
  alasan: z.enum(['Koreksi', 'Rusak', 'Hilang', 'Sampel', 'Lainnya']),
  catatan: z.string().optional(),
})

export type PenyesuaianStokFormData = z.infer<typeof penyesuaianStokSchema>

export const supplierSchema = z.object({
  nama: z.string().min(1, 'Nama supplier wajib diisi'),
  kontak: z.string().min(1, 'Kontak wajib diisi'),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
})

export type SupplierFormData = z.infer<typeof supplierSchema>
