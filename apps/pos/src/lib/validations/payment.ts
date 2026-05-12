import { z } from 'zod'

export const paymentSchema = z.object({
  pembayaran: z
    .array(
      z.object({
        metode: z.enum(['Tunai', 'QRIS', 'Transfer Bank']),
        nominal: z.number().min(0, 'Nominal tidak valid'),
      })
    )
    .min(1, 'Pilih minimal satu metode pembayaran'),
})

export type PaymentFormValues = z.infer<typeof paymentSchema>

export const bukaShiftSchema = z.object({
  saldoAwal: z.number().min(0, 'Saldo awal tidak valid'),
})

export type BukaShiftFormValues = z.infer<typeof bukaShiftSchema>

export const tutupShiftSchema = z.object({
  saldoAkhir: z.number().min(0, 'Saldo akhir tidak valid'),
})

export type TutupShiftFormValues = z.infer<typeof tutupShiftSchema>

export const returSchema = z.object({
  nomorStruk: z.string().min(1, 'Nomor struk wajib diisi'),
})

export type ReturSearchValues = z.infer<typeof returSchema>
