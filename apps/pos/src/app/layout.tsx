import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { ServiceWorkerRegistrar } from './sw-registrar'

export const metadata: Metadata = {
  title: 'TaniGo POS',
  description: 'Point of Sale — TaniGo',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'TaniGo POS' },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
