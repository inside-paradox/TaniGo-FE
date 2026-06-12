'use client'

import { Clock4 } from 'lucide-react'

/** Full-screen warning shown during the idle countdown before returning home. */
export function IdleOverlay({
  secondsLeft,
  onStay,
}: {
  secondsLeft: number
  onStay: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm kiosk-fade-in">
      <div className="mx-4 w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <Clock4 className="h-10 w-10 text-amber-600" />
        </div>
        <h2 className="mt-6 text-3xl font-bold text-gray-900">Masih di sini?</h2>
        <p className="mt-3 text-xl text-gray-600">
          Layar akan kembali ke beranda dalam{' '}
          <span className="font-bold text-amber-600 tabular-nums">{secondsLeft}</span> detik...
        </p>
        <button
          onClick={onStay}
          className="mt-8 min-h-[64px] w-full rounded-2xl bg-green-600 px-8 text-2xl font-bold text-white transition-colors hover:bg-green-700 active:scale-[0.98]"
        >
          Tetap di Sini
        </button>
      </div>
    </div>
  )
}
