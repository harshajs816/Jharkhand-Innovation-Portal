import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react'

import { authAPI } from '../services/api'

const AuthContext = createContext(null)


// ─────────────────────────────────────────────────────────────────────────────
// Helper: Extract API data
// Supports:
// { data: { user, accessToken } }
// and:
// { user, accessToken }
// ─────────────────────────────────────────────────────────────────────────────

const getResponseData = (response) => {
  return response?.data?.data || response?.data || {}
}


export function AuthProvider({ children }) {

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)


  // ───────────────────────────────────────────────────────────────────────────
  // Restore session when application loads
  // ───────────────────────────────────────────────────────────────────────────

  const restoreSession = useCallback(async () => {

    try {

      let token = localStorage.getItem('accessToken')


      // If access token is missing, try refresh-token cookie
      // Only attempt refresh if we're likely authenticated (has refresh cookie)
      if (!token) {

        try {

          const refreshResponse = await authAPI.refresh()

          const refreshData = getResponseData(refreshResponse)

          if (refreshData.accessToken) {

            localStorage.setItem(
              'accessToken',
              refreshData.accessToken
            )

            token = refreshData.accessToken

          }

        } catch (refreshError) {
          // Silent fail - user not authenticated
          setLoading(false)
          return

        }

      }


      // Only call getMe if we have a token
      if (token) {
        const response = await authAPI.getMe()
        const data = getResponseData(response)
        const user = data.user || data
        const profile = data.profile || null
        setUser({...user, profile})
      }

    } catch (err) {

      console.error('Session restore failed:', err)

      localStorage.removeItem('accessToken')
      setUser(null)

    } finally {

      setLoading(false)

    }

  }, [])


  useEffect(() => {
    restoreSession()
  }, [])


  // ───────────────────────────────────────────────────────────────────────────
  // Listen for forced logout from Axios interceptor
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {

    const handleForcedLogout = () => {

      localStorage.removeItem('accessToken')
      setUser(null)

    }


    window.addEventListener(
      'auth:logout',
      handleForcedLogout
    )


    return () => {

      window.removeEventListener(
        'auth:logout',
        handleForcedLogout
      )

    }

  }, [])


  // ───────────────────────────────────────────────────────────────────────────
  // Login
  // ───────────────────────────────────────────────────────────────────────────

  const login = useCallback(async ({ email, password }) => {

    const response = await authAPI.login({ email, password })

    const data = getResponseData(response)

    if (!data.accessToken) {
      throw new Error('Access token was not received from server.')
    }

    localStorage.setItem('accessToken', data.accessToken)
    setUser(data.user || null)

    // Return a normalised shape so Login.jsx can read the role
    return { user: data.user, accessToken: data.accessToken }

  }, [])


  // ───────────────────────────────────────────────────────────────────────────
  // Register
  // ───────────────────────────────────────────────────────────────────────────

  const register = useCallback(async (payload) => {

    const response = await authAPI.register(payload)

    const data = getResponseData(response)

    if (!data.accessToken) {
      throw new Error('Access token was not received from server.')
    }

    localStorage.setItem('accessToken', data.accessToken)
    setUser(data.user || null)

    return { user: data.user, accessToken: data.accessToken }

  }, [])


  // ───────────────────────────────────────────────────────────────────────────
  // Logout
  // ───────────────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {

    try {

      await authAPI.logout()

    } catch (err) {

      console.error('Logout request failed:', err)

    } finally {

      localStorage.removeItem('accessToken')
      setUser(null)

    }

  }, [])


  // ───────────────────────────────────────────────────────────────────────────
  // Update user in context
  // ───────────────────────────────────────────────────────────────────────────

  const updateUser = useCallback((updates) => {

    setUser((previousUser) => {

      if (!previousUser) return previousUser

      return {
        ...previousUser,
        ...updates
      }

    })

  }, [])


  // ───────────────────────────────────────────────────────────────────────────
  // Role helper
  // ───────────────────────────────────────────────────────────────────────────

  const hasRole = useCallback((...roles) => {

    if (!user?.role) return false

    return roles.includes(user.role)

  }, [user])


  const isAuthenticated = Boolean(user)


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        hasRole,
        restoreSession
      }}
    >
      {children}
    </AuthContext.Provider>
  )

}


export const useAuth = () => {

  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context

}