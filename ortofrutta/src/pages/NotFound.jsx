import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="card p-10 text-center max-w-md w-full">
        <h1 className="text-5xl font-bold text-verde-orto-600 mb-3 tabular-nums">404</h1>
        <p className="text-lg font-semibold text-slate-900 mb-1.5">Pagina non trovata</p>
        <p className="text-sm text-slate-500 mb-7">Scusa, la pagina che stai cercando non esiste.</p>
        <Link
          to="/"
          className="btn-primary px-6 py-3"
        >
          Torna alla home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
