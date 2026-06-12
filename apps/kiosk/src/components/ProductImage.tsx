'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getCategoryDef } from '@/lib/categories'
import { cn } from '@/lib/cn'
import type { KioskKategori } from '@/types'

/**
 * Product photo with a graceful category-icon placeholder when there's no photo
 * or the image fails to load. Uses next/image when a real URL is present.
 */
export function ProductImage({
  src,
  alt,
  kategori,
  className,
  sizes,
}: {
  src: string | null
  alt: string
  kategori: KioskKategori
  className?: string
  sizes?: string
}) {
  const [errored, setErrored] = useState(false)
  const def = getCategoryDef(kategori)
  const Icon = def.icon

  if (!src || errored) {
    return (
      <div className={cn('flex items-center justify-center', def.accent, className)}>
        <Icon className="h-1/3 w-1/3 opacity-70" />
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-gray-100', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? '(max-width: 768px) 50vw, 25vw'}
        className="object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  )
}
