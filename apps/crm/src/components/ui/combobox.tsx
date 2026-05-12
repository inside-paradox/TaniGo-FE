'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface ComboboxProps<T> {
  options: T[]
  value: string
  onChange: (value: string) => void
  getOptionValue: (item: T) => string
  getOptionLabel: (item: T) => string
  filterFn?: (item: T, query: string) => boolean
  renderOption?: (item: T, isSelected: boolean) => React.ReactNode
  label?: string
  required?: boolean
  error?: string
  placeholder?: string
  className?: string
}

export function Combobox<T>({
  options,
  value,
  onChange,
  getOptionValue,
  getOptionLabel,
  filterFn,
  renderOption,
  label,
  required,
  error,
  placeholder = 'Cari...',
  className,
}: ComboboxProps<T>) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => getOptionValue(o) === value) ?? null

  const filtered = query.trim()
    ? options.filter((o) =>
        filterFn
          ? filterFn(o, query)
          : getOptionLabel(o).toLowerCase().includes(query.toLowerCase())
      )
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

  function handleSelect(item: T) {
    onChange(getOptionValue(item))
    setOpen(false)
    setQuery('')
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setQuery('')
    setOpen(false)
  }

  function handleOpen() {
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
          className={`flex h-10 w-full cursor-pointer items-center rounded-lg border bg-white px-3 text-sm transition-colors ${
            open
              ? 'border-green-500 ring-1 ring-green-500'
              : error
              ? 'border-red-400'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {open ? (
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : selected ? (
            <span className="flex-1 truncate text-gray-900">{getOptionLabel(selected)}</span>
          ) : (
            <span className="flex-1 text-gray-400">{placeholder}</span>
          )}

          <div className="ml-2 flex shrink-0 items-center gap-1">
            {selected && !open && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded p-0.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {open && (
          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">Tidak ada hasil ditemukan</li>
            ) : (
              filtered.map((item) => {
                const val = getOptionValue(item)
                const isSelected = val === value
                return (
                  <li
                    key={val}
                    onMouseDown={() => handleSelect(item)}
                    className={`cursor-pointer px-3 py-2 text-sm hover:bg-green-50 ${
                      isSelected ? 'bg-green-50 font-medium text-green-700' : 'text-gray-900'
                    }`}
                  >
                    {renderOption ? renderOption(item, isSelected) : getOptionLabel(item)}
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
