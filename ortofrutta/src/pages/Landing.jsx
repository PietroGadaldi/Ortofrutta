import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { RUOLI } from '../utils/constants'
import { IconLeaf, IconTruck, IconShield } from '../components/icons'

export function Landing() {
  const navigate = useNavigate()
  const { user, role, loading } = useAuth()

  // Redirect if already logged in - use useEffect to avoid render issues
  useEffect(() => {
    if (!loading && user) {
      if (role === RUOLI.TITOLARE) {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    }
  }, [user, role, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Caricamento...</p>
        </div>
      </div>
    )
  }

  const features = [
    {
      Icon: IconLeaf,
      title: 'Prodotti freschi',
      text: 'I migliori prodotti selezionati ogni giorno con cura e passione.',
    },
    {
      Icon: IconTruck,
      title: 'Consegne rapide',
      text: 'Ordina oggi e ricevi domani, con affidabilità garantita.',
    },
    {
      Icon: IconShield,
      title: 'Servizio garantito',
      text: 'Siamo sempre operativi e in stagione anche la domenica.',
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center px-1 py-6 sm:py-12">
      <div className="max-w-4xl w-full">
        {/* Hero */}
        <div className="card card-pad sm:p-12 text-center mb-6 sm:mb-8">
          <img
            src="/Ortofrutta.png"
            alt="Ortofrutta Logo"
            className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-5"
          />
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
            Benvenuto a Ortofrutta Brescia
          </h1>
          <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto">
            La piattaforma per gestire in modo semplice e veloce i tuoi ordini di frutta e verdura fresca.
          </p>

          <div className="mt-7">
            <Link
              to="/login"
              className="btn-primary px-8 py-3 text-base"
            >
              Accedi e ordina
            </Link>
          </div>
        </div>

        {/* Punti di forza */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {features.map(({ Icon, title, text }) => (
            <div key={title} className="card p-5 text-left">
              <div className="w-10 h-10 rounded-lg bg-verde-orto-50 text-verde-orto-700 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900 mb-1">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Landing
