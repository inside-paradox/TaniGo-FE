import axios from 'axios'
import { getMockResponse } from '@/lib/mock/handler'

const DEMO_TOKEN = 'demo-access-token'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      if (token === DEMO_TOKEN) {
        config.adapter = async () => {
          await new Promise((r) => setTimeout(r, 120))
          const mock = getMockResponse(config)
          if (mock) {
            return { ...mock, config }
          }
          return { data: { data: null }, status: 200, statusText: 'OK', headers: {}, config }
        }
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const isAuthEndpoint = originalRequest.url?.includes('/auth/')
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          redirectToLogin()
          return Promise.reject(error)
        }

        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken }
        )

        localStorage.setItem('accessToken', data.data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(originalRequest)
      } catch {
        redirectToLogin()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
}

export default api
