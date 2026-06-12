'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useIdleTimer } from '@/hooks/useIdleTimer'
import { IdleOverlay } from './IdleOverlay'

const IDLE_TIMEOUT_MS = 3 * 60 * 1000 // 3 minutes
const WARNING_MS = 30 * 1000 // 30 second countdown

/**
 * Arms the idle timer everywhere except the home/beranda screen. After 3 minutes
 * idle it navigates back to beranda; a 30s countdown overlay lets the user stay.
 */
export function IdleManager() {
  const router = useRouter()
  const pathname = usePathname()
  const onHome = pathname === '/'

  const { warning, secondsLeft, stayActive } = useIdleTimer(IDLE_TIMEOUT_MS, () => {
    if (!onHome) router.push('/')
  })

  // No overlay on the home screen — it's already the idle destination.
  if (onHome || !warning) return null
  return <IdleOverlay secondsLeft={secondsLeft} onStay={stayActive} />
}
