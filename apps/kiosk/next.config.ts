import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@tanigo/types', '@tanigo/utils'],
}

export default nextConfig
