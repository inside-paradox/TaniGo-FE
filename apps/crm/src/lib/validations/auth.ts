import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi').min(6, 'Password minimal 6 karakter'),
})

export const changePasswordSchema = z
  .object({
    passwordLama: z.string().min(1, 'Password lama wajib diisi'),
    passwordBaru: z.string().min(6, 'Password baru minimal 6 karakter'),
    konfirmasiPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.passwordBaru === data.konfirmasiPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['konfirmasiPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
