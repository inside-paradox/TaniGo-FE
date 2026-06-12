'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '@/lib/api/kiosk'

/**
 * Fetches products for a store with auto-refresh every 5 minutes so stock and
 * prices stay current on an unattended kiosk. On fetch failure React Query keeps
 * the previous (stale) data instead of erroring out.
 */
export function useProducts(storeId: string | undefined) {
  return useQuery({
    queryKey: ['kiosk', 'products', storeId],
    queryFn: () => fetchProducts(storeId as string),
    enabled: !!storeId,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchIntervalInBackground: true,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev, // keep showing old data while refetching
  })
}
