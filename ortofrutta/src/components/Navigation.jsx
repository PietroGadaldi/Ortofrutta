import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { RUOLI } from '../utils/constants'
import { signOut } from '../services/authService'
import { IconHome, IconClipboard, IconPackage, IconUsers, IconLogout } from './icons'

const NAV_ITEMS_TITOLARE = [
  { to: '/admin', label: 'Dashboard', Icon: IconHome },
  { to: '/ordini', label: 'Ordini', Icon: IconClipboard },
  { to: '/prodotti', label: 'Prodotti', Icon: IconPackage },
  { to: '/utenti', label: 'Utenti', Icon: IconUsers },
]

export default function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, profile, loading } = useAuth()

  const handleLogout = async () => {
    const { error } = await signOut()
    if (!error) {
      navigate('/login')
    }
  }

  // Se l'autenticazione è in caricamento, non mostriamo nulla
  if (loading) {
    return (
      <div
        className="flex justify-center items-center py-4 bg-verde-orto-900"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="h-7 w-7 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  const isTitolare = role === RUOLI.TITOLARE

  return (
    <nav
      className="sticky top-0 z-40 bg-verde-orto-900 shadow-md"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo - Porta sempre alla Home */}
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <img src="/Ortofrutta.png" alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" />
            <span className="min-w-0 text-left leading-tight">
              <span className="block text-sm sm:text-base font-bold text-white truncate">
                Ortofrutta Brescia
              </span>
              <span className="hidden sm:block text-[11px] font-medium text-verde-orto-200 tracking-wide uppercase">
                Gestione ordini
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Ruolo utente (solo desktop) */}
                <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-verde-orto-100 text-xs font-semibold uppercase tracking-wide">
                  {isTitolare ? 'Titolare' : 'Cliente'}
                  {profile?.nome ? ` · ${profile.nome}` : ''}
                </span>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 rounded-lg border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-colors active:scale-[0.98]"
                >
                  <IconLogout className="w-4 h-4" />
                  <span>Esci</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-verde-orto-800 text-sm font-semibold hover:bg-verde-orto-50 transition-colors active:scale-[0.98]"
              >
                Accedi
              </Link>
            )}
          </div>
        </div>

        {/* Barra di navigazione sezioni (solo titolare) */}
        {user && isTitolare && (
          <div className="-mx-1 flex items-center gap-1 overflow-x-auto pb-2 pt-0.5" style={{ WebkitOverflowScrolling: 'touch' }}>
            {NAV_ITEMS_TITOLARE.map(({ to, label, Icon }) => {
              const isActive = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-white text-verde-orto-900 shadow-sm'
                      : 'text-verde-orto-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
