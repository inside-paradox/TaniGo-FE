'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Check } from 'lucide-react'

interface MultiSelectProps<T> {
  options: T[]
  /** Daftar value terpilih. */
  value: string[]
  onChange: (value: string[]) => void
  getOptionValue: (item: T) => string
  getOptionLabel: (item: T) => string
  label?: string
  required?: boolean
  error?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Teks saat tidak ada opsi (mis. data masih dimuat). */
  emptyText?: string
}

export function MultiSelect<T>({
  options,
  value,
  onChange,
  getOptionValue,
  getOptionLabel,
  label,
  required,
  error,
  placeholder = 'Pilih...',
  className,
  disabled,
  emptyText = 'Tidak ada opsi',
}: MultiSelectProps<T>) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOptions = options.filter((o) => value.includes(getOptionValue(o)))
  const filtered = query.trim()
    ? options.filter((o) => getOptionLabel(o).toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggle(item: T) {
    const val = getOptionValue(item)
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val))
    } else {
      onChange([...value, val])
    }
  }

  function removeChip(e: React.MouseEvent, val: string) {
    e.stopPropagation()
    onChange(value.filter((v) => v !== val))
  }

  function handleOpen() {
    if (disabled) return
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <div ref={containerRef} className="relative">
        <div
          onClick={handleOpen}
          className={`flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            disabled
              ? 'cursor-not-allowed border-gray-200 bg-gray-50'
              : open
              ? 'cursor-pointer border-green-500 bg-white ring-1 ring-green-500'
              : error
              ? 'cursor-pointer border-red-400 bg-white hover:border-gray-400'
              : 'cursor-pointer border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          {selectedOptions.map((o) => {
            const val = getOptionValue(o)
            return (
              <span
                key={val}
                className="flex items-center gap-1 rounded-md bg-green-50 py-0.5 pl-2 pr-1 text-xs font-medium text-green-700"
              >
                {getOptionLabel(o)}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => removeChip(e, val)}
                    className="rounded p-0.5 text-green-600 hover:bg-green-100 hover:text-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            )
          })}

          {open ? (
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={selectedOptions.length === 0 ? placeholder : ''}
              className="min-w-[80px] flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            selectedOptions.length === 0 && (
              <span className={`flex-1 truncate ${disabled ? 'text-gray-300' : 'text-gray-400'}`}>
                {placeholder}
              </span>
            )
          )}

          <ChevronDown
            className={`ml-auto h-4 w-4 shrink-0 transition-transform ${disabled ? 'text-gray-300' : 'text-gray-400'} ${open ? 'rotate-180' : ''}`}
          />
        </div>

        {open && (
          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">{emptyText}</li>
            ) : (
              filtered.map((item) => {
                const val = getOptionValue(item)
                const isSelected = value.includes(val)
                return (
                  <li
                    key={val}
                    onMouseDown={() => toggle(item)}
                    className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-green-50 ${
                      isSelected ? 'bg-green-50 font-medium text-green-700' : 'text-gray-900'
                    }`}
                  >
                    {getOptionLabel(item)}
                    {isSelected && <Check className="h-4 w-4 text-green-600" />}
                  </li>
                )
              })
            )}
          </ul>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
