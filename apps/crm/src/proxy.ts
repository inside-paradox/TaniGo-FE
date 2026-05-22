import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/login']

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

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
