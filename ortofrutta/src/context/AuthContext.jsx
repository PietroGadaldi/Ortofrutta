import { createContext, useEffect, useState } from 'react'
import * as authService from '../services/authService'

/**
 * AuthContext - Global authentication state
 * @type {React.Context}
 */
export const AuthContext = createContext({
  user: null,
  role: null,
  profile: null,
  loading: true,
  error: null,
})

/**
 * AuthProvider - Provides authentication state to child components
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Monitor auth state changes on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { session, error: sessionError } = await authService.getSession()
        
        if (sessionError) {
          setError(sessionError.message)
          setLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          const { profile: prof, role: r } = await authService.getCurrentUserProfile(
            session.user
          )
          setProfile(prof)
          setRole(r)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange(async ({ user: u }) => {
      if (u) {
        setUser(u)
        const { profile: prof, role: r } = await authService.getCurrentUserProfile(u)
        setProfile(prof)
        setRole(r)
        setError(null)
      } else {
        setUser(null)
        setRole(null)
        setProfile(null)
      }
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const value = {
    user,
    role,
    profile,
    loading,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
