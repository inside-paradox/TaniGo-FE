'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

/** Real-time clock + date for the kiosk corner. */
export function Clock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!now) return null // avoid SSR/CSR mismatch

  return (
    <div className={className}>
      <p className="text-2xl font-bold tabular-nums leading-none">{format(now, 'HH:mm:ss')}</p>
      <p className="mt-1 text-sm text-gray-500">{format(now, 'EEEE, d MMMM yyyy', { locale: id })}</p>
    </div>
  )
}
