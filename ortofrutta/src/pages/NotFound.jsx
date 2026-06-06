import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-verde-orto-600 mb-4">404</h1>
        <p className="text-2xl font-semibold text-gray-900 mb-2">Pagina non trovata</p>
        <p className="text-gray-600 mb-8">Scusa, la pagina che stai cercando non esiste.</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-verde-orto-600 text-white rounded-lg font-semibold hover:bg-verde-orto-700 transition"
        >
          Torna alla home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
