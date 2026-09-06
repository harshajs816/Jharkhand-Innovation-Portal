import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)   // true while restoring session

  // ── Restore session on mount ────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }

    authAPI.getMe()
      .then(res => setUser(res.data.user))
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setLoading(false))
  }, [])

  // ── Listen for forced logout (from axios interceptor) ───────────────────
  useEffect(() => {
    const handler = () => { setUser(null); localStorage.removeItem('accessToken') }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  // ── Actions ──────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const res = await authAPI.login({ email, password })
    localStorage.setItem('accessToken', res.data.accessToken)
    setUser(res.data.user)
    return res
  }, [])

  const register = useCallback(async (payload) => {
    const res = await authAPI.register(payload)
    localStorage.setItem('accessToken', res.data.accessToken)
    setUser(res.data.user)
    return res
  }, [])

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch (_) {}
    localStorage.removeItem('accessToken')
    setUser(null)
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
