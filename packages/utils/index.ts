import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatTanggal(dateString: string): string {
  try {
    return format(parseISO(dateString), 'dd MMMM yyyy', { locale: id })
  } catch {
    return dateString
  }
}

export function formatTanggalWaktu(dateString: string): string {
  try {
    return format(parseISO(dateString), 'dd MMMM yyyy, HH:mm', { locale: id })
  } catch {
    return dateString
  }
}

export function formatTanggalInput(dateString: string): string {
  try {
    return format(parseISO(dateString), 'yyyy-MM-dd')
  } catch {
    return dateString
  }
}

export function generateNomor(prefix: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}/${year}/${month}/${random}`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getInitials(nama: string): string {
  return nama
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
