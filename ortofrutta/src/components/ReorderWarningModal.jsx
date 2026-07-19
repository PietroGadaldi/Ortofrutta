import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock'
import { IconAlertTriangle } from './icons'

/**
 * ReorderWarningModal component
 * Popup mostrato dopo "Ripeti ordine" / "Ripeti ultimo ordine" quando alcuni
 * prodotti dell'ordine originale non sono più disponibili nel catalogo
 * @param {boolean} isOpen - Se il popup è visibile
 * @param {Function} onClose - Callback per chiudere il popup
 * @param {Array<string>} prodottiEsclusi - Nomi dei prodotti esclusi dal riordino
 * @param {boolean} riordinoEseguito - false se nessun prodotto era disponibile e il riordino è stato annullato
 */
export function ReorderWarningModal({ isOpen, onClose, prodottiEsclusi = [], riordinoEseguito = true }) {
  // Blocca scroll del body quando il modal è aperto (iOS fix)
  useEffect(() => {
    if (isOpen) {
      lockBodyScroll()
      return () => unlockBodyScroll()
    }
  }, [isOpen])

  if (!isOpen) return null

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
        <div className="bg-amber-500 px-5 py-4 flex items-center gap-3">
          <IconAlertTriangle className="w-6 h-6 text-white flex-shrink-0" />
          <h2 className="text-base font-bold text-white">Prodotti non disponibili</h2>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-sm text-slate-700 leading-relaxed">
            {riordinoEseguito
              ? 'I seguenti prodotti non sono più disponibili nel catalogo e non sono stati aggiunti al nuovo ordine:'
              : 'Non è stato possibile ripetere questo ordine perché nessuno dei suoi prodotti è attualmente disponibile nel catalogo:'}
          </p>

          <ul className="mt-3 space-y-1.5 max-h-48 overflow-y-auto overscroll-contain pr-1">
            {prodottiEsclusi.map((nome) => (
              <li
                key={nome}
                className="bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold uppercase px-3 py-2 rounded-lg"
              >
                {nome}
              </li>
            ))}
          </ul>

          {riordinoEseguito && (
            <p className="text-sm text-slate-700 mt-3 leading-relaxed">
              Gli altri prodotti sono stati copiati nel riepilogo del nuovo ordine.
            </p>
          )}

          <button onClick={onClose} className="btn-primary w-full mt-5 py-3">
            Ho capito
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
