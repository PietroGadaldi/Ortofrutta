import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { RUOLI } from '../utils/constants'

/**
 * ProtectedRoute - Wrapper for protected routes
 * Checks if user is authenticated and has required role
 *
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {string|string[]} requiredRole - Required role(s) (optional)
 * @returns {React.ReactNode}
 */
export function ProtectedRoute({ children, requiredRole = null }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-verde-orto-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check role if specified
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(role)) {
      return (
        <Navigate
          to={role === RUOLI.TITOLARE ? '/admin' : '/dashboard'}
          replace
        />
      )
    }
  }

  return children
}

export default ProtectedRoute
