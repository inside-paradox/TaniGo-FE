import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@tanigo/types', '@tanigo/utils'],
  images: {
    // Allow product photos served from the API / object storage. Add hosts as
    // needed when the kiosk points at a real backend.
    remotePatterns: [
      { protocol: 'https', hostname: 'staging-api.tanigo.id' },
      { protocol: 'https', hostname: '**.tanigo.id' },
    ],
  },
}

export default nextConfig
