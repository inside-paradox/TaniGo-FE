import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { denahApi } from '@/lib/api'
import type { SaveDenahDto } from '@/types'

export const DENAH_KEY = 'denah'

export function useDenah(cabangId: string | undefined) {
  return useQuery({
    queryKey: [DENAH_KEY, cabangId],
    queryFn: () => denahApi.getByCabang(cabangId as string),
    enabled: !!cabangId,
  })
}

export function useSaveDenah() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cabangId, payload }: { cabangId: string; payload: SaveDenahDto }) =>
      denahApi.save(cabangId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [DENAH_KEY, vars.cabangId] })
      toast.success('Denah toko berhasil disimpan')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan denah toko')
    },
  })
}
