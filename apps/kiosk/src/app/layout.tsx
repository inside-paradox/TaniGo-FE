import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { IdleManager } from '@/components/IdleManager'

export const metadata: Metadata = {
  title: 'TaniGo Kiosk',
  description: 'Layar informasi produk pertanian — TaniGo',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>
          {children}
          <IdleManager />
        </Providers>
      </body>
    </html>
  )
}
