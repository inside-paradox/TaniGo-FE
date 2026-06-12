import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

/**
 * Public, unauthenticated HTTP client for the kiosk. No tokens are ever sent —
 * the kiosk only reads public catalog/inventory data.
 */
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})
