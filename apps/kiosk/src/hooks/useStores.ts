'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchStores } from '@/lib/api/kiosk'

/** Fetches the list of stores (toko) the kiosk can display. */
export function useStores() {
  return useQuery({
    queryKey: ['kiosk', 'stores'],
    queryFn: fetchStores,
    staleTime: 1000 * 60 * 10, // store list rarely changes
  })
}
