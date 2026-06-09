import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { RUOLI } from '../utils/constants'
import { signOut } from '../services/authService'

export default function Navigation() {
  const navigate = useNavigate()
  const { user, role, loading } = useAuth()

  const handleLogout = async () => {
    const { error } = await signOut()
    if (!error) {
      navigate('/login')
    }
  }

  // Se l'autenticazione è in caricamento, non mostriamo nulla
  if (loading) {
    return (
      <div className="flex justify-center items-center py-4 bg-verde-orto-600">
        <div className="animate-spin">
          <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <nav className="bg-gradient-to-r from-verde-orto-600 to-verde-orto-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Porta sempre alla Home */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/Ortofrutta.png" alt="Logo" className="h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0" />
            <span className="text-sm sm:text-2xl font-bold text-white leading-tight">Ortofrutta Brescia</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            {user ? (
              <>
                <div className="flex gap-4">
                  {/* Link Admin visibile solo al Titolare */}
                  {role === RUOLI.TITOLARE && (
                    <Link
                      to="/admin"
                      className="text-white hover:text-green-100 transition"
                    >
                      Home
                    </Link>
                  )}
                  
                  {/* 2. RIMOZIONE TASTO DASHBOARD PER CLIENTE:
                      Abbiamo rimosso il blocco che mostrava il link '/dashboard' 
                      se il ruolo era 'cliente'. */}
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-verde-orto-600 rounded-lg font-semibold hover:bg-gray-100 transition text-sm sm:text-base"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-verde-orto-600 rounded-lg font-semibold hover:bg-gray-100 transition text-sm sm:text-base"
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
