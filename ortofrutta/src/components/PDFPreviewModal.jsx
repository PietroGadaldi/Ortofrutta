import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { downloadOrderPDF } from '../services/pdfStorageService'
import { downloadPDFBlob } from '../utils/pdfGenerator'

// Set up PDF worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

/**
 * Modal component to preview and print/download order PDF
 * @param {Blob|string} pdfData - PDF blob or URL to display
 * @param {string} fileName - Name for the downloaded file (without extension)
 * @param {Function} onClose - Callback to close modal
 * @param {boolean} isOpen - Whether modal is open
 */
export function PDFPreviewModal({ pdfData, fileName = 'ricevuta', onClose, isOpen = false }) {
  const [numPages, setNumPages] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  if (!isOpen || !pdfData) return null

  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  const handleDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error)
    setError('Errore nel caricamento del PDF')
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
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
      setError('Errore nel download del PDF')
    }
  }

  // Create object URL if pdfData is a Blob
  const pdfUrl = pdfData instanceof Blob ? URL.createObjectURL(pdfData) : pdfData

  return (
    <>
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Modal content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Modal header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Anteprima Ricevuta</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* PDF viewer */}
          <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center">
            {error ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-lg text-center">
                  <p className="font-semibold">{error}</p>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 text-lg">Caricamento PDF...</div>
              </div>
            ) : (
              <div className="bg-white shadow-lg">
                <Document file={pdfUrl} onLoadSuccess={handleDocumentLoadSuccess} onLoadError={handleDocumentLoadError}>
                  <Page pageNumber={currentPage} renderAnnotationLayer={false} renderTextLayer={false} />
                </Document>
              </div>
            )}
          </div>

          {/* Page navigation (if multi-page) */}
          {numPages && numPages > 1 && (
            <div className="flex justify-center items-center gap-4 py-4 border-b border-gray-200">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Precedente
              </button>
              <span className="text-gray-600 font-semibold">
                Pagina {currentPage} di {numPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                disabled={currentPage >= numPages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Successiva →
              </button>
            </div>
          )}

          {/* Modal footer with action buttons */}
          <div className="flex gap-4 justify-end p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition"
            >
              Chiudi
            </button>
            <button
              onClick={handleDownload}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition flex items-center gap-2"
            >
              💾 Scarica
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition flex items-center gap-2"
            >
              🖨️ Stampa
            </button>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .react-pdf__Document,
          .react-pdf__Page,
          .react-pdf__Page canvas {
            visibility: visible;
            position: static;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </>
  )
}
