import { cn } from '@/lib/cn'

/** "Tersedia" (green) / "Stok Habis" (red) badge derived from stock count. */
export function StockBadge({ stok, className }: { stok: number; className?: string }) {
  const available = stok > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold',
        available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
        className
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', available ? 'bg-green-500' : 'bg-red-500')} />
      {available ? 'Tersedia' : 'Stok Habis'}
    </span>
  )
}
