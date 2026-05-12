'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
}

const LIMIT_OPTIONS = [10, 25, 50, 100]

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const getPageNumbers = () => {
    const delta = 2
    const range: (number | '...')[] = []
    const rangeWithDots: (number | '...')[] = []

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i)
      }
    }

    let prev: number | undefined
    for (const i of range) {
      if (typeof i === 'number') {
        if (prev !== undefined && i - prev > 1) {
          rangeWithDots.push('...')
        }
        rangeWithDots.push(i)
        prev = i
      }
    }

    return rangeWithDots
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>
          Menampilkan {from}–{to} dari {total} data
        </span>
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-green-500 focus:outline-none"
            >
              {LIMIT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>per halaman</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <PageButton
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          title="Halaman pertama"
        >
          <ChevronsLeft className="h-4 w-4" />
        </PageButton>
        <PageButton
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          title="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </PageButton>

        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <PageButton
              key={p}
              onClick={() => onPageChange(p)}
              active={p === page}
            >
              {p}
            </PageButton>
          )
        )}

        <PageButton
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || totalPages === 0}
          title="Halaman berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </PageButton>
        <PageButton
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || totalPages === 0}
          title="Halaman terakhir"
        >
          <ChevronsRight className="h-4 w-4" />
        </PageButton>
      </div>
    </div>
  )
}

function PageButton({
  children,
  onClick,
  disabled,
  active,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors',
        active
          ? 'bg-green-600 text-white'
          : 'text-gray-600 hover:bg-gray-100',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent'
      )}
    >
      {children}
    </button>
  )
}
