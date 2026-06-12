'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'touchstart',
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'wheel',
]

interface IdleTimerResult {
  /** True while the pre-idle warning countdown is showing. */
  warning: boolean
  /** Seconds remaining before onIdle fires (only meaningful while `warning`). */
  secondsLeft: number
  /** Cancel the warning and reset the idle timer ("Tetap di sini"). */
  stayActive: () => void
}

/**
 * Calls `onIdle` after `timeoutMs` of no user interaction. For the final
 * `warningMs` window it surfaces a countdown so the UI can warn the user and
 * offer to stay. Any interaction (touch/mouse/key/scroll) resets everything.
 */
export function useIdleTimer(
  timeoutMs: number,
  onIdle: () => void,
  warningMs = 30_000,
): IdleTimerResult {
  const [warning, setWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(warningMs / 1000))

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const onIdleRef = useRef(onIdle)
  onIdleRef.current = onIdle

  const clearTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (countdownTimer.current) clearInterval(countdownTimer.current)
    idleTimer.current = null
    countdownTimer.current = null
  }, [])

  const startCountdown = useCallback(() => {
    setWarning(true)
    let remaining = Math.ceil(warningMs / 1000)
    setSecondsLeft(remaining)
    countdownTimer.current = setInterval(() => {
      remaining -= 1
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        clearTimers()
        setWarning(false)
        onIdleRef.current()
      }
    }, 1000)
  }, [warningMs, clearTimers])

  const reset = useCallback(() => {
    clearTimers()
    setWarning(false)
    setSecondsLeft(Math.ceil(warningMs / 1000))
    // Start the warning countdown after the quiet period (timeout minus warning window).
    const quiet = Math.max(0, timeoutMs - warningMs)
    idleTimer.current = setTimeout(startCountdown, quiet)
  }, [clearTimers, startCountdown, timeoutMs, warningMs])

  const stayActive = useCallback(() => reset(), [reset])

  useEffect(() => {
    reset()
    // While the warning is showing we still want activity to reset, so the
    // listener stays attached for the whole lifetime.
    const handle = () => reset()
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handle, { passive: true }))
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handle))
      clearTimers()
    }
  }, [reset, clearTimers])

  return { warning, secondsLeft, stayActive }
}
