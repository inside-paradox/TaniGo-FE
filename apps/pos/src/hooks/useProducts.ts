'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchProducts, type ProductSearchParams } from '@/lib/api/products'
import { searchDemoProducts } from '@/lib/demo/products'
import { cacheProducts, getCachedProducts } from '@/lib/db/idb'
import { useAuthStore } from '@/store/authStore'
import { useOnlineStatus } from './useOnlineStatus'

export function useProducts(params: ProductSearchParams) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const isDemo = accessToken === 'demo-token'
  const isOnline = useOnlineStatus()

  return useQuery({
    queryKey: ['products', params, isDemo, isOnline],
    queryFn: async () => {
      if (isDemo) {
        return searchDemoProducts(params.search ?? '', params.limit)
      }

      if (!isOnline) {
        const cached = await getCachedProducts(params.search ?? '')
        const data = cached.slice(0, params.limit ?? 50)
        return {
          data,
          meta: { total: cached.length, page: 1, limit: params.limit ?? 50, totalPages: 1 },
        }
      }

      const result = await fetchProducts(params)
      // Cache all fetched products for offline use (only cache full/unfiltered loads)
      if (!params.search) {
        cacheProducts(result.data).catch(() => {})
      }
      return result
    },
    placeholderData: (prev) => prev,
  })
}
