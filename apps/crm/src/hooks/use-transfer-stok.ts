import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { transferStokApi } from '@/lib/api'
import type {
  CreateTransferStokDto,
  ApproveTransferStokDto,
  TerimaTransferStokDto,
  TableParams,
  TransferStok,
  User,
} from '@/types'
import { useAuthStore } from '@/store/auth-store'
import { useTransferAckStore } from '@/store/transfer-ack-store'
import { canAccess } from '@/lib/rbac'

export const TRANSFER_STOK_KEY = 'transfer-stok'

/** Status yang menandakan dokumen sudah direspons Gudang & butuh aksi Manajer Toko. */
const TOKO_ACTIONABLE: TransferStok['status'][] = ['Disetujui', 'Ditolak', 'Dikirim']

/**
 * Daftar key dokumen transfer yang membutuhkan perhatian user saat ini:
 * - Gudang (admin/staf gudang): permintaan "Menunggu Persetujuan" untuk gudangnya.
 * - Manajer Toko: dokumen yang sudah direspons Gudang (Disetujui/Ditolak/Dikirim) untuk tokonya.
 * Key menyertakan status agar perubahan status memicu badge ulang.
 */
function actionableKeys(user: User | null | undefined, transfers: TransferStok[]): string[] {
  if (!user) return []
  const isGudang = user.tipeCabang === 'gudang' || user.role === 'staf_gudang'
  return transfers
    .filter((t) =>
      isGudang
        ? t.gudangId === user.cabangId && t.status === 'Menunggu Persetujuan'
        : t.tokoId === user.cabangId && TOKO_ACTIONABLE.includes(t.status)
    )
    .map((t) => `${user.id}:${t.id}:${t.status}`)
}

/** Error backend yang berarti "endpoint badge belum tersedia" → harus fallback ke klien. */
function isBadgeEndpointUnsupported(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status
  // 404/501 = belum diimplementasi; tanpa response = network/CORS (mis. backend lama).
  return status === 404 || status === 501 || !(err as { response?: unknown })?.response
}

type BadgeData =
  | { mode: 'server'; count: number }
  | { mode: 'client'; transfers: TransferStok[] }

/**
 * Mengambil data badge. Coba endpoint server-side dulu; bila belum didukung
 * (404/network, atau mode demo yang mengembalikan count non-numerik), fallback
 * mengambil daftar transfer untuk dihitung di klien.
 */
async function fetchBadgeData(): Promise<BadgeData> {
  try {
    const count = await transferStokApi.getBadgeCount()
    if (typeof count === 'number') return { mode: 'server', count }
  } catch (err) {
    if (!isBadgeEndpointUnsupported(err)) throw err
  }
  const list = await transferStokApi.getAll({ page: 1, limit: 200 })
  return { mode: 'client', transfers: list.data }
}

export function useTransferStokList(params: TableParams & { status?: string }) {
  return useQuery({
    queryKey: [TRANSFER_STOK_KEY, params],
    queryFn: () => transferStokApi.getAll(params),
    placeholderData: (prev) => prev,
  })
}

/**
 * Badge notifikasi Transfer Stok untuk sidebar.
 * - `count`     : jumlah dokumen yang butuh perhatian & belum diakui.
 * - `keys`      : dokumen actionable (hanya terisi pada mode klien) untuk ditandai dibaca lokal.
 * - `serverMode`: true bila perhitungan & acknowledgement ditangani backend.
 */
export function useTransferStokBadge() {
  const { user } = useAuthStore()
  const seen = useTransferAckStore((s) => s.seen)
  const enabled = canAccess(user, '/transfer-stok')

  const { data } = useQuery({
    queryKey: [TRANSFER_STOK_KEY, 'badge'],
    queryFn: fetchBadgeData,
    refetchInterval: 30000,
    enabled,
  })

  if (data?.mode === 'server') {
    return { count: data.count, keys: [] as string[], serverMode: true }
  }

  const keys = actionableKeys(user, data?.transfers ?? [])
  const count = keys.reduce((acc, key) => (seen[key] ? acc : acc + 1), 0)
  return { count, keys, serverMode: false }
}

export function useTransferStok(id: string) {
  return useQuery({
    queryKey: [TRANSFER_STOK_KEY, id],
    queryFn: () => transferStokApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateTransferStok() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTransferStokDto) => transferStokApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRANSFER_STOK_KEY] })
      toast.success('Permintaan stok berhasil dibuat')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal membuat permintaan stok')
    },
  })
}

export function useApproveTransferStok() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApproveTransferStokDto }) =>
      transferStokApi.approve(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRANSFER_STOK_KEY] })
      toast.success('Transfer stok disetujui')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menyetujui transfer')
    },
  })
}

export function useTolakTransferStok() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, catatan }: { id: string; catatan?: string }) =>
      transferStokApi.tolak(id, catatan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRANSFER_STOK_KEY] })
      toast.success('Transfer stok ditolak')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal menolak transfer')
    },
  })
}

export function useKirimTransferStok() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transferStokApi.kirim(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRANSFER_STOK_KEY] })
      toast.success('Transfer stok dikirim')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal mengirim transfer')
    },
  })
}

export function useTerimaTransferStok() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TerimaTransferStokDto }) =>
      transferStokApi.terima(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRANSFER_STOK_KEY] })
      toast.success('Stok berhasil diterima')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Gagal mengkonfirmasi penerimaan')
    },
  })
}
