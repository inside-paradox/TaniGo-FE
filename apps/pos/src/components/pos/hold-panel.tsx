'use client'

import { Clock, Trash2, Play } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useCartStore } from '@/store/cartStore'
import { formatRupiah } from '@tanigo/utils'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'

interface HoldPanelProps {
  open: boolean
  onClose: () => void
}

export function HoldPanel({ open, onClose }: HoldPanelProps) {
  const { heldTransactions, resumeHeld, deleteHeld } = useCartStore()

  const handleResume = (id: string) => {
    resumeHeld(id)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Transaksi Ditahan" size="md">
      {heldTransactions.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          <Clock size={40} className="mx-auto mb-2" />
          <p className="text-sm">Belum ada transaksi yang ditahan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {heldTransactions.map((trx) => {
            const total = trx.items.reduce((s, i) => s + i.subtotal, 0)
            const itemCount = trx.items.reduce((s, i) => s + i.qty, 0)

            return (
              <div key={trx.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {trx.label ?? `Transaksi ${trx.id.slice(0, 6).toUpperCase()}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(trx.createdAt), 'HH:mm', { locale: id })} &middot; {itemCount} item &middot;{' '}
                      {formatRupiah(total)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => deleteHeld(trx.id)}
                      className="rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <Button size="sm" onClick={() => handleResume(trx.id)}>
                      <Play size={12} />
                      Lanjutkan
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
