import { useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'ofb-cookie-notice-v1'

function isAccepted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'accepted'
  } catch {
    // localStorage non disponibile (es. modalità privata): mostra comunque l'avviso
    return false
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(() => !isAccepted())

  if (!visible) return null

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted')
    } catch {
      // ignora: il banner resterà nascosto solo per questa sessione
    }
    setVisible(false)
  }

  return (
    <div
      role="region"
      aria-label="Informativa cookie"
      className="fixed bottom-0 inset-x-0 z-50 px-3 sm:px-6"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl shadow-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-slate-600 leading-relaxed flex-1">
          Questa applicazione utilizza solo cookie e tecnologie strettamente necessari al
          funzionamento (es. accesso e sessione). Nessun cookie di profilazione o pubblicitario.{' '}
          <Link
            to="/privacy"
            className="text-verde-orto-700 underline underline-offset-2 hover:text-verde-orto-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verde-orto-500 rounded-sm"
          >
            Maggiori informazioni
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          className="btn-primary px-6 py-3 shrink-0"
        >
          Ho capito
        </button>
      </div>
    </div>
  )
}

export default CookieBanner
