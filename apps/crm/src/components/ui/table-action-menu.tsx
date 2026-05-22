'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'

export interface TableActionItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  separator?: boolean
}

interface TableActionMenuProps {
  items: TableActionItem[]
}

export function TableActionMenu({ items }: TableActionMenuProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleOpen = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setCoords({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX,
    })
    setOpen(true)
  }

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    document.addEventListener('mousedown', (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    })
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open])

  return (
    <>
      <div className="flex justify-end">
        <button
          ref={buttonRef}
          onClick={handleOpen}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            transform: 'translateX(-100%)',
            zIndex: 9999,
          }}
          className="w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {items.map((item, i) => (
            <div key={i}>
              {item.separator && <hr className="my-1 border-gray-100" />}
              <button
                onClick={() => { setOpen(false); item.onClick() }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                  item.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-700'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
