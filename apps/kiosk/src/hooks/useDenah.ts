'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchDenah } from '@/lib/api/kiosk'

/**
 * Fetches the store floor plan, refreshing every 5 minutes so rack assignments
 * stay current on an unattended kiosk. Keeps showing the previous plan while
 * refetching, mirroring useProducts.
 */
export function useDenah(storeId: string | undefined) {
  return useQuery({
    queryKey: ['kiosk', 'denah', storeId],
    queryFn: () => fetchDenah(storeId as string),
    enabled: !!storeId,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: true,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
