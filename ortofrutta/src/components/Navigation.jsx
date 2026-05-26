import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as authService from '../services/authService'
import { RUOLI } from '../utils/constants'

export function Navigation() {
  const navigate = useNavigate()
  const { user, role, loading } = useAuth()

  const handleLogout = async () => {
    await authService.signOut()
    navigate('/login')
  }

  if (loading) return null

  return (
    <nav className="bg-gradient-to-r from-verde-orto-600 to-verde-orto-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">🥬 Ortofrutta Brescia</span>
          </Link>

          {/* Menu */}
          <div className="flex items-center gap-6">
            {user ? (
              <>
                <div className="text-white text-sm">
                  {user.email} <span className="text-xs opacity-75">({role})</span>
                </div>

                {role === RUOLI.TITOLARE && (
                  <div className="flex gap-4">
                    <Link to="/admin" className="text-white hover:text-green-100 transition">
                      Admin
                    </Link>
                  </div>
                )}

                {role === RUOLI.CLIENTE && (
                  <div className="flex gap-4">
                    <Link to="/dashboard" className="text-white hover:text-green-100 transition">
                      Dashboard
                    </Link>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-white text-verde-orto-600 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-white text-verde-orto-600 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
