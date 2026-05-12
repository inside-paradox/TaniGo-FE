'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

function formatNominal(v: number): string {
  if (v === 0) return ''
  return new Intl.NumberFormat('id-ID').format(v)
}

function parseNominal(s: string): number {
  return parseInt(s.replace(/\./g, '').replace(/[^0-9]/g, ''), 10) || 0
}

interface InputNominalProps {
  value: number
  onChange: (value: number) => void
  label?: string
  error?: string
  placeholder?: string
  prefix?: string
  disabled?: boolean
  className?: string
  required?: boolean
}

export function InputNominal({
  value,
  onChange,
  label,
  error,
  placeholder = '0',
  prefix = 'Rp',
  disabled,
  className,
  required,
}: InputNominalProps) {
  const [display, setDisplay] = useState(() => formatNominal(value))
  const prevValue = useRef(value)

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value
      setDisplay(formatNominal(value))
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '')
    const num = parseInt(digits, 10) || 0
    prevValue.current = num
    setDisplay(digits === '' ? '' : formatNominal(num))
    onChange(num)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (value === 0) setDisplay('')
    e.target.select()
  }

  const handleBlur = () => {
    setDisplay(formatNominal(value))
  }

  const inputId = label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute inset-y-0 left-3 flex items-center text-sm text-gray-400 pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 text-right',
            'placeholder:text-gray-400',
            'focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            prefix && 'pl-9',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
