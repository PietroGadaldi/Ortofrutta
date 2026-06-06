import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { RUOLI } from '../utils/constants'

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-8">
      <div className="text-center max-w-3xl w-full">
        {/* Header Card */}
        <div className="mb-12 bg-gradient-to-r from-verde-orto-600 to-verde-orto-700 text-white rounded-2xl p-12 shadow-2xl">
          {/* Logo */}
          <img src="/Ortofrutta.png" alt="Ortofrutta Logo" className="h-24 w-24 mx-auto mb-6 drop-shadow-xl" />

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            Benvenuto a Ortofrutta Brescia!
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-verde-orto-100 font-semibold">
            Il modo più semplice per ordinare i tuoi prodotti.
          </p>
        </div>

        {/* Features Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-white to-green-50 border-2 border-verde-orto-200 rounded-xl shadow-lg p-8 hover:shadow-xl hover:border-verde-orto-400 transition-all transform hover:scale-105">
            <div className="text-5xl mb-4">🌱</div>
            <h3 className="text-xl font-bold text-verde-orto-900 mb-3">Prodotti Freschi</h3>
            <p className="text-verde-orto-700">I migliori prodotti selezionati ogni giorno con cura e passione.</p>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-xl shadow-lg p-8 hover:shadow-xl hover:border-blue-400 transition-all transform hover:scale-105">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-blue-900 mb-3">Consegne Rapide</h3>
            <p className="text-blue-700">Ordina oggi e ricevi domani, direttamente a casa tua con affidabilità garantita.</p>
          </div>
          <div className="bg-gradient-to-br from-white to-red-50 border-2 border-red-200 rounded-xl shadow-lg p-8 hover:shadow-xl hover:border-red-400 transition-all transform hover:scale-105">
            <div className="text-5xl mb-4">💚</div>
            <h3 className="text-xl font-bold text-red-900 mb-3">Servizio Garantito</h3>
            <p className="text-red-700">Siamo sempre operativi e in stagione anche la domenica</p>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          to="/login"
          className="inline-block px-10 py-4 bg-gradient-to-r from-verde-orto-600 to-verde-orto-700 text-white rounded-xl font-bold text-lg hover:from-verde-orto-700 hover:to-verde-orto-800 transition-all shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95"
        >
          🛒 Ordina Ora!
        </Link>

        {/* Extra info */}
        <p className="mt-12 text-verde-orto-700 text-sm font-semibold px-4">
          ✨ Effettua il login per continuare oppure contattaci per informazioni
        </p>
      </div>
    </div>
  )
}

export default Landing
