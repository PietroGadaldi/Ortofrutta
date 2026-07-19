import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock'
import { IconAlertTriangle, IconCheckCircle } from './icons'

const VARIANTS = {
  warn: { headerClass: 'bg-amber-500', Icon: IconAlertTriangle },
  error: { headerClass: 'bg-red-600', Icon: IconAlertTriangle },
  success: { headerClass: 'bg-verde-orto-600', Icon: IconCheckCircle },
}

/**
 * NoticeModal component
 * Popup generico per avvisi dinamici (warning, errori, conferme) della dashboard.
 * Sostituisce i banner in cima alla pagina, poco visibili soprattutto da mobile.
 * @param {boolean} isOpen - Se il popup è visibile
 * @param {Function} onClose - Callback di chiusura (tasto secondario, click fuori)
 * @param {string} variant - 'warn' | 'error' | 'success'
 * @param {string} title - Titolo nell'header colorato
 * @param {string} message - Testo dell'avviso
 * @param {string} primaryLabel - Etichetta del tasto principale (opzionale)
 * @param {Function} onPrimary - Azione del tasto principale (opzionale)
 * @param {string} closeLabel - Etichetta del tasto di chiusura
 */
export function NoticeModal({
  isOpen,
  onClose,
  variant = 'warn',
  title,
  message,
  primaryLabel,
  onPrimary,
  closeLabel = 'Chiudi',
}) {
  // Blocca scroll del body quando il modal è aperto (iOS fix)
  useEffect(() => {
    if (isOpen) {
      lockBodyScroll()
      return () => unlockBodyScroll()
    }
  }, [isOpen])

  if (!isOpen) return null

  const { headerClass, Icon } = VARIANTS[variant] || VARIANTS.warn

  // Portal su document.body: il modale deve uscire da qualsiasi contenitore
  // scrollabile/overflow, altrimenti su iOS Safari position:fixed viene
  // agganciato al contenitore
  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${headerClass} px-5 py-4 flex items-center gap-3`}>
          <Icon className="w-6 h-6 text-white flex-shrink-0" />
          <h2 className="text-base font-bold text-white">{title}</h2>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-sm text-slate-700 leading-relaxed">{message}</p>

          <div className="flex gap-2.5 mt-5">
            {primaryLabel && onPrimary ? (
              <>
                <button onClick={onClose} className="btn-secondary flex-1 py-3">
                  {closeLabel}
                </button>
                <button onClick={onPrimary} className="btn-primary flex-[1.4] py-3">
                  {primaryLabel}
                </button>
              </>
            ) : (
              <button onClick={onClose} className="btn-primary w-full py-3">
                {closeLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
