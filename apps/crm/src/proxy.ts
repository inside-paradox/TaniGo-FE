import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { UserRole } from '@/types'

const publicRoutes = ['/login']

const roleRoutes: Record<string, UserRole[]> = {
  '/pengguna': ['admin'],
  '/audit-log': ['admin'],
  '/pengaturan': ['admin', 'manajer'],
  '/laporan': ['admin', 'manajer', 'kasir'],
  '/produk': ['admin', 'manajer', 'staf_gudang'],
  '/inventori': ['admin', 'manajer', 'staf_gudang'],
  '/purchase-order': ['admin', 'manajer', 'staf_gudang'],
  '/pesanan': ['admin', 'manajer', 'kasir'],
  '/pelanggan-vip': ['admin', 'manajer'],
  '/pengiriman': ['admin', 'manajer', 'staf_gudang'],
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('accessToken')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Demo token — skip role check, allow all routes
  if (token === 'demo-access-token') {
    return NextResponse.next()
  }

  try {
    const payloadBase64 = token.split('.')[1]
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString())
    const userRole: UserRole = payload.role

    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  } catch {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
