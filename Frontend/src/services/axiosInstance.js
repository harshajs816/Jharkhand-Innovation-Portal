import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL:      BASE_URL,
  withCredentials: true,          // send refresh-token cookie
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach access token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (err) => Promise.reject(err)
)

// ── Response interceptor: auto-refresh on 401 ────────────────────────────
let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

// Auth-related paths that must NEVER trigger a token refresh attempt
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    // Skip refresh for:
    //  • non-401 errors
    //  • already retried requests
    //  • any auth endpoint (login, register, refresh, logout)
    //  • rate-limit errors
    const url = original?.url || ''
    const isAuthEndpoint = AUTH_PATHS.some(p => url.includes(p))

    if (
      err.response?.status !== 401 ||
      original?._retry           ||
      isAuthEndpoint             ||
      err.response?.status === 429
    ) {
      return Promise.reject(err)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }).catch(e => Promise.reject(e))
    }

    original._retry = true
    isRefreshing    = true

    try {
      const { data } = await api.post('/auth/refresh')
      const newToken  = data?.data?.accessToken || data?.accessToken
      if (!newToken) throw new Error('No token in refresh response')
      localStorage.setItem('accessToken', newToken)
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`
      processQueue(null, newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch (refreshErr) {
      processQueue(refreshErr, null)
      localStorage.removeItem('accessToken')
      window.dispatchEvent(new Event('auth:logout'))
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
