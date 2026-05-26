import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * useAuth hook - Access authentication state
 * Usage: const { user, role, loading } = useAuth()
 *
 * @returns {object} { user, role, profile, loading, error }
 */
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

export default useAuth
