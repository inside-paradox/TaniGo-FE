import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '@/lib/api'
import { reportsApi } from '@/lib/api'
import { format, subDays } from 'date-fns'

export function useDashboardStok() {
  return useQuery({
    queryKey: ['dashboard-stok'],
    queryFn: () => inventoryApi.getDashboard(),
  })
}

export function useDashboardPenjualan() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd')

  return useQuery({
    queryKey: ['dashboard-penjualan', today],
    queryFn: () =>
      reportsApi.getPenjualan({
        tanggalDari: sevenDaysAgo,
        tanggalSampai: today,
      }),
  })
}
