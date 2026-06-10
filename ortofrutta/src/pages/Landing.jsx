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
        <div className="mb-8 sm:mb-12 bg-gradient-to-r from-verde-orto-600 to-verde-orto-700 text-white rounded-2xl p-6 sm:p-12 shadow-2xl">
          {/* Logo */}
          <img src="/Ortofrutta.png" alt="Ortofrutta Logo" className="h-16 w-16 sm:h-24 sm:w-24 mx-auto mb-4 sm:mb-6 drop-shadow-xl" />

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 sm:mb-6 leading-tight">
            Benvenuto a Ortofrutta Brescia!
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-verde-orto-100 font-semibold">
            Il modo più semplice per ordinare i tuoi prodotti.
          </p>
        </div>

        {/* Features Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-gradient-to-br from-white to-green-50 border-2 border-verde-orto-200 rounded-xl shadow-lg p-5 sm:p-8 hover:shadow-xl hover:border-verde-orto-400 transition-all transform hover:scale-105">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🌱</div>
            <h3 className="text-lg sm:text-xl font-bold text-verde-orto-900 mb-2 sm:mb-3">Prodotti Freschi</h3>
            <p className="text-sm sm:text-base text-verde-orto-700">I migliori prodotti selezionati ogni giorno con cura e passione.</p>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-xl shadow-lg p-5 sm:p-8 hover:shadow-xl hover:border-blue-400 transition-all transform hover:scale-105">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📦</div>
            <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-2 sm:mb-3">Consegne Rapide</h3>
            <p className="text-sm sm:text-base text-blue-700">Ordina oggi e ricevi domani, direttamente a casa tua con affidabilità garantita.</p>
          </div>
          <div className="bg-gradient-to-br from-white to-red-50 border-2 border-red-200 rounded-xl shadow-lg p-5 sm:p-8 hover:shadow-xl hover:border-red-400 transition-all transform hover:scale-105">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">💚</div>
            <h3 className="text-lg sm:text-xl font-bold text-red-900 mb-2 sm:mb-3">Servizio Garantito</h3>
            <p className="text-sm sm:text-base text-red-700">Siamo sempre operativi e in stagione anche la domenica</p>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          to="/login"
          className="inline-block px-10 py-4 bg-gradient-to-r from-verde-orto-600 to-verde-orto-700 text-white rounded-xl font-bold text-lg hover:from-verde-orto-700 hover:to-verde-orto-800 transition-all shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95"
        >
          🛒 Ordina Ora!
        </Link>

        {/* Contacts */}
        <div className="mt-10 sm:mt-12">
          <p className="text-verde-orto-700 text-sm font-semibold mb-5">
            ✨ Effettua il login per continuare oppure contattaci per informazioni
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/ortofrutta.brescia"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 bg-gradient-to-br from-purple-50 to-pink-50 border border-pink-200 rounded-xl p-3 sm:p-4 hover:shadow-md hover:scale-105 transition-all active:scale-95"
            >
              <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="ig-grad" x1="0" y1="24" x2="24" y2="0">
                    <stop offset="0%" stopColor="#f09433"/>
                    <stop offset="25%" stopColor="#e6683c"/>
                    <stop offset="50%" stopColor="#dc2743"/>
                    <stop offset="75%" stopColor="#cc2366"/>
                    <stop offset="100%" stopColor="#bc1888"/>
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#ig-grad)"/>
                <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="1.8"/>
                <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
              </svg>
              <span className="text-xs font-bold text-pink-700 leading-tight text-center">@ortofrutta<br/>.brescia</span>
            </a>

            {/* Email */}
            <a
              href="mailto:domenico72portesi@gmail.com"
              className="flex flex-col items-center gap-1.5 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-3 sm:p-4 hover:shadow-md hover:scale-105 transition-all active:scale-95"
            >
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <span className="text-xs font-bold text-blue-700 leading-tight text-center">Email</span>
            </a>

            {/* Telefono */}
            <a
              href="tel:+393888005812"
              className="flex flex-col items-center gap-1.5 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-3 sm:p-4 hover:shadow-md hover:scale-105 transition-all active:scale-95"
            >
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              <span className="text-xs font-bold text-green-800 leading-tight text-center">+39 388<br/>800 5812</span>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/393888005812"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-300 rounded-xl p-3 sm:p-4 hover:shadow-md hover:scale-105 transition-all active:scale-95"
            >
              <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-xs font-bold text-emerald-800 leading-tight text-center">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing
