import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { RUOLI } from '../utils/constants'

export function Landing() {
  const navigate = useNavigate()
  const { user, role, loading } = useAuth()

  // Redirect if already logged in
  if (!loading && user) {
    if (role === RUOLI.TITOLARE) {
      navigate('/admin')
    } else {
      navigate('/dashboard')
    }
    return null
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-verde-orto-50 to-white px-4">
      <div className="text-center max-w-2xl">
        {/* Logo */}
        <div className="mb-8">
          <span className="text-6xl">🥬</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          Benvenuto a <span className="text-verde-orto-600">Ortofrutta Brescia!</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-gray-600 mb-12">
          Il modo più semplice per ordinare i tuoi prodotti a km 0, direttamente dal nostro orto.
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl mb-3">🌱</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Prodotti Freschi</h3>
            <p className="text-gray-600">I migliori prodotti dell'orto, selezionati ogni giorno.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Consegne Rapide</h3>
            <p className="text-gray-600">Ordina oggi e ricevi domani, direttamente a casa tua.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl mb-3">💚</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">100% Sostenibile</h3>
            <p className="text-gray-600">Prodotti biologici e rispetto dell'ambiente.</p>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          to="/login"
          className="inline-block px-8 py-4 bg-verde-orto-600 text-white rounded-lg font-semibold text-lg hover:bg-verde-orto-700 transition shadow-lg hover:shadow-xl"
        >
          🛒 Ordina Ora!
        </Link>

        {/* Extra info */}
        <p className="mt-8 text-gray-500 text-sm">
          Effettua il login per continuare oppure contattaci per informazioni.
        </p>
      </div>
    </div>
  )
}

export default Landing
