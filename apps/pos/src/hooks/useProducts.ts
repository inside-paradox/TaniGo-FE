'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchCabangInventory } from '@/lib/api/products'
import { searchDemoInventory } from '@/lib/demo/inventory'
import { cacheInventory, getCachedInventory } from '@/lib/db/idb'
import { useAuthStore } from '@/store/authStore'
import { useOnlineStatus } from './useOnlineStatus'

export interface ProductSearchParams {
  search?: string
  limit?: number
}

export function useProducts(params: ProductSearchParams) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isDemo = accessToken === 'demo-token'
  const isOnline = useOnlineStatus()
  const cabangId = user?.cabangId ?? ''

  return useQuery({
    queryKey: ['cabang-inventory', cabangId, params.search, isDemo, isOnline],
    queryFn: async () => {
      if (isDemo) {
        return searchDemoInventory(cabangId, params.search ?? '')
      }

      if (!isOnline) {
        return getCachedInventory(params.search ?? '')
      }

      const result = await fetchCabangInventory(cabangId)

      // Cache all fetched inventory items for offline use
      if (!params.search) {
        cacheInventory(result).catch(() => {})
      }

      // Apply client-side search filter
      if (params.search) {
        const q = params.search.toLowerCase()
        return result.filter(
          (item) =>
            item.produkNama.toLowerCase().includes(q) ||
            item.produkSku.toLowerCase().includes(q)
        )
      }

      return result
    },
    placeholderData: (prev) => prev,
    enabled: !!cabangId || isDemo,
  })
}
