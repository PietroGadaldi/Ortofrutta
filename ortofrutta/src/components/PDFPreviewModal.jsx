import { useState, useEffect } from 'react'
import { downloadOrderPDF } from '../services/pdfStorageService'
import { downloadPDFBlob } from '../utils/pdfGenerator'
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock'
import { IconX, IconPrinter, IconDownload, IconExternalLink, IconDocument } from './icons'

const isIOS = typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)

export function PDFPreviewModal({ pdfData, fileName = 'ricevuta', onClose, isOpen = false, ordineId, onStatusChange, isCompletato = false, showDownload = true }) {
  const [iframeUrl, setIframeUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Blocca lo scroll del body quando il modal è aperto (iOS fix:
  // position:fixed sul body, altrimenti su iPhone la pagina dietro scorre)
  useEffect(() => {
    if (isOpen) {
      lockBodyScroll()
      return () => unlockBodyScroll()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !pdfData) {
      setIframeUrl(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      let url
      if (pdfData instanceof Blob) {
        url = URL.createObjectURL(pdfData)
      } else if (typeof pdfData === 'string') {
        url = pdfData
      } else {
        throw new Error('Invalid PDF data format')
      }

      setIframeUrl(url)
      setLoading(false)
    } catch (err) {
      console.error('Error preparing PDF:', err)
      setError('Errore nel caricamento del PDF: ' + err.message)
      setLoading(false)
    }
  }, [pdfData, isOpen])

  if (!isOpen || !pdfData) return null

  const handlePrint = async () => {
    if (iframeUrl) {
      const iframe = document.getElementById('pdf-iframe')
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.print()
      } else {
        window.print()
      }
    }
    
    // Auto-complete order when printing
    if (ordineId && onStatusChange && !isCompletato) {
      try {
        await onStatusChange(ordineId, true)
      } catch (err) {
        console.error('Error updating order status:', err)
      }
    }
  }

  const handleDownload = async () => {
    try {
      if (pdfData instanceof Blob) {
        // If it's a blob, download directly
        downloadPDFBlob(pdfData, `${fileName}.pdf`)
      } else if (typeof pdfData === 'string') {
        // If it's a URL string, download from URL
        await downloadOrderPDF(pdfData, `${fileName}.pdf`)
      }
    } catch (err) {
      console.error('Error downloading PDF:', err)
      setError('Errore nel download del PDF: ' + err.message)
    }
  }

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        style={{ touchAction: 'none' }}
      />

      {/* Modal content: schermo intero su mobile, dialog centrato su sm+ */}
      <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-3 pointer-events-none">
        <div className="modal-mobile-full pointer-events-auto bg-white shadow-2xl w-full sm:w-[95vw] sm:h-[90vh] sm:max-h-[900px] sm:rounded-xl flex flex-col overflow-hidden">
          {/* Modal header */}
          <div
            className="flex-shrink-0 flex justify-between items-center px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Anteprima ricevuta</h2>
            <button
              onClick={onClose}
              className="btn-icon w-11 h-11 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Close modal"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>

          {/* PDF viewer */}
          <div className="flex-1 overflow-hidden bg-slate-100 flex flex-col">
            {error ? (
              <div className="flex items-center justify-center h-full m-4">
                <div className="alert-error text-center max-w-md">
                  <p className="font-semibold mb-2">Errore</p>
                  <p>{error}</p>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="spinner mx-auto mb-4"></div>
                  <p className="text-slate-500 font-medium">Caricamento PDF...</p>
                </div>
              </div>
            ) : isIOS && iframeUrl ? (
              /* iOS Safari non supporta PDF inline in iframe — mostra link diretto */
              <div
                className="flex flex-col items-center justify-center h-full p-8 gap-5 text-center bg-slate-50 overflow-y-auto overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <div className="w-16 h-16 rounded-2xl bg-verde-orto-50 text-verde-orto-600 flex items-center justify-center">
                  <IconDocument className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-slate-900 font-bold text-lg mb-1">PDF pronto</p>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Su iPhone/iPad il PDF non può essere mostrato qui.<br />
                    Usa il pulsante <strong>Apri</strong> per vederlo nel browser.
                  </p>
                </div>
                <a
                  href={iframeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary py-3 px-8 text-base"
                >
                  <IconExternalLink className="w-5 h-5" />
                  Apri PDF
                </a>
              </div>
            ) : iframeUrl ? (
              <iframe
                id="pdf-iframe"
                src={iframeUrl}
                className="w-full h-full border-none"
                title="PDF Preview"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setError('Errore nel caricamento del PDF nel viewer')
                  setLoading(false)
                }}
              />
            ) : null}
          </div>

          {/* Modal footer with action buttons.
              Su mobile: flex-wrap con basis 40% → max 2 pulsanti per riga,
              l'eventuale pulsante spaiato occupa l'intera riga. */}
          <div
            className="flex-shrink-0 flex flex-wrap gap-2 sm:gap-3 sm:justify-end p-3 sm:p-5 border-t border-slate-200 bg-slate-50"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={onClose}
              className="btn-secondary flex-[1_1_40%] sm:flex-none min-h-[48px] px-4 sm:px-6 text-sm"
            >
              Chiudi
            </button>
            {iframeUrl && (
              <a
                href={iframeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-[1_1_40%] sm:flex-none min-h-[48px] px-4 sm:px-6 text-sm"
              >
                <IconExternalLink className="w-4 h-4" />
                Apri
              </a>
            )}
            {showDownload && (
              <button
                onClick={handleDownload}
                disabled={loading || !!error}
                className="btn-secondary flex-[1_1_40%] sm:flex-none min-h-[48px] px-4 sm:px-6 text-sm"
              >
                <IconDownload className="w-4 h-4" />
                Scarica
              </button>
            )}
            <button
              onClick={handlePrint}
              disabled={loading || !!error}
              className="btn-primary flex-[1_1_40%] sm:flex-none min-h-[48px] px-4 sm:px-6 text-sm"
            >
              <IconPrinter className="w-4 h-4" />
              Stampa
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
