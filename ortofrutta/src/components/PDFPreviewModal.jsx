import { useState, useEffect } from 'react'
import { downloadOrderPDF } from '../services/pdfStorageService'
import { downloadPDFBlob } from '../utils/pdfGenerator'

/**
 * Modal component to preview and print/download order PDF
 * Uses iframe fallback for maximum compatibility
 * @param {Blob|string} pdfData - PDF blob or URL to display
 * @param {string} fileName - Name for the downloaded file (without extension)
 * @param {Function} onClose - Callback to close modal
 * @param {boolean} isOpen - Whether modal is open
 * @param {string} ordineId - Order ID for status update
 * @param {Function} onStatusChange - Callback to update order status
 * @param {boolean} isCompletato - Whether order is already completed
 */
export function PDFPreviewModal({ pdfData, fileName = 'ricevuta', onClose, isOpen = false, ordineId, onStatusChange, isCompletato = false }) {
  const [iframeUrl, setIframeUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
        // Create object URL for blob
        url = URL.createObjectURL(pdfData)
      } else if (typeof pdfData === 'string') {
        // URL string
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
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Modal content */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-2">
        <div className="modal-safe-height bg-white rounded-t-2xl sm:rounded-lg shadow-2xl w-full sm:w-[95vw] flex flex-col">
          {/* Modal header */}
          <div className="flex-shrink-0 flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Anteprima Ricevuta</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition p-1"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* PDF viewer */}
          <div className="flex-1 overflow-hidden bg-gray-100 flex flex-col">
            {error ? (
              <div className="flex items-center justify-center h-full m-4">
                <div className="bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-lg text-center max-w-md">
                  <p className="font-semibold mb-2">⚠️ Errore</p>
                  <p>{error}</p>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin mb-4">
                    <div className="h-12 w-12 border-4 border-blue-300 border-t-blue-600 rounded-full mx-auto"></div>
                  </div>
                  <p className="text-gray-600 font-semibold">Caricamento PDF...</p>
                </div>
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

          {/* Modal footer with action buttons */}
          <div
            className="flex-shrink-0 flex flex-wrap gap-2 sm:gap-3 justify-end p-3 sm:p-6 border-t border-gray-200 bg-gray-50"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition text-sm sm:text-base"
            >
              Chiudi
            </button>
            {iframeUrl && (
              <a
                href={iframeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
              >
                🔗 Apri
              </a>
            )}
            <button
              onClick={handleDownload}
              disabled={loading || !!error}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 transition flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
            >
              💾 Scarica
            </button>
            <button
              onClick={handlePrint}
              disabled={loading || !!error}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 transition flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
            >
              🖨️ Stampa
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
