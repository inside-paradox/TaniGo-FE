'use client'

import { format } from 'date-fns'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Shows when product data was last successfully fetched. */
export function LastUpdated({
  timestamp,
  refreshing,
  className,
}: {
  timestamp?: number
  refreshing?: boolean
  className?: string
}) {
  if (!timestamp) return null
  return (
    <div className={cn('flex items-center gap-1.5 text-sm text-gray-500', className)}>
      <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
      <span>Terakhir diperbarui: pukul {format(timestamp, 'HH:mm')}</span>
    </div>
  )
}
