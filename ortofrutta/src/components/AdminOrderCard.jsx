import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { PDFPreviewModal } from './PDFPreviewModal'
import { EditOrderModal } from './EditOrderModal'
import { getOrderPDFUrl } from '../services/pdfStorageService'
import { generateOrderPDF } from '../utils/pdfGenerator'

/**
 * AdminOrderCard component
 * Expandable order card for admin/titolare view OR receipt card view
 * @param {Object} ordine - Order object with details
 * @param {Function} onStatusChange - Callback when status is toggled
 * @param {Function} onDeleteOrder - Callback when delete is clicked
 * @param {Function} onOrderModified - Callback when order is modified
 * @param {Function} onDateChanged - Callback when order date is changed (receives newDate)
 * @param {Array} prodotti - Available products for autocomplete when editing
 * @param {boolean} isLoading - Loading state for button
 * @param {boolean} showAsReceiptCards - If true, show as non-expandable receipt card
 */
export function AdminOrderCard({ 
  ordine, 
  onStatusChange, 
  onDeleteOrder, 
  onOrderModified,
  onDateChanged,
  prodotti = [],
  isLoading = false,
  showAsReceiptCards = false 
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Dettaglio "fuori catalogo": nessun prodotto del catalogo collegato
  const isCustomDettaglio = (d) => !d.prodotti?.nome && !!d.nome_custom
  const hasCustomProducts = (ordine.dettagli_ordine || []).some(isCustomDettaglio)
  const [isProductsExpanded, setIsProductsExpanded] = useState(false)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [pdfData, setPdfData] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy', { locale: it })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString) => {
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy HH:mm', { locale: it })
    } catch {
      return dateString
    }
  }

  const handleStatusToggle = async () => {
    await onStatusChange(ordine.id, !ordine.completato)
  }

  const handleViewPDF = async () => {
    setPdfLoading(true)
    setPdfError(null)
    
    try {
      // Try to get PDF from storage first
      const { exists, url } = await getOrderPDFUrl(
        ordine.cliente_id || ordine.profili?.id,
        ordine.id
      )

      if (exists && url) {
        // PDF exists in storage, use URL
        setPdfData(url)
      } else {
        // Generate PDF on the fly
        const pdfBlob = generateOrderPDF(ordine)
        setPdfData(pdfBlob)
      }

      setShowPDFModal(true)
    } catch (error) {
      console.error('Error loading PDF:', error)
      setPdfError('Errore nel caricamento del PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleDeleteOrder = () => {
    if (window.confirm('Sei sicuro di voler eliminare questo ordine?')) {
      onDeleteOrder(ordine.id)
    }
  }

  // Receipt Card Layout (showAsReceiptCards = true)
  if (showAsReceiptCards) {
    return (
      <>
        <div className="bg-white border-2 border-gray-300 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          {/* Receipt Header - All left aligned */}
          <div className="mb-4 sm:mb-6 text-left">
            <div className="flex items-start justify-between mb-3 gap-2">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 min-w-0 break-words uppercase">
                👤 {ordine.profili?.nome || 'Cliente Sconosciuto'}
              </h3>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <div className={`
                  px-2 sm:px-3 py-1 rounded-full font-bold text-xs sm:text-sm
                  ${ordine.completato
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                  }
                `}>
                  {ordine.completato ? '✅ Completato' : '🖨️ Da stampare'}
                </div>
                {hasCustomProducts && (
                  <div className="px-2 sm:px-3 py-1 rounded-full font-bold text-xs bg-yellow-200 text-yellow-900 border border-yellow-400 whitespace-nowrap">
                    ⭐ Fuori catalogo
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-700 mb-1">
              <span className="font-semibold">Data ordine:</span> {formatDate(ordine.data_ordine)}
            </p>
            <p className="text-xs sm:text-sm text-gray-700">
              <span className="font-semibold">Creato il:</span> {formatDateTime(ordine.data_creazione)}
            </p>
            {ordine.updated_at && (
              <p className="text-xs sm:text-sm text-orange-600 font-semibold mt-0.5">
                ✏️ <span className="font-bold">Modificato il:</span> {formatDateTime(ordine.updated_at)}
              </p>
            )}
          </div>

          {/* Products - Expandable */}
          <div className="mb-4 bg-gray-50 rounded-lg border border-gray-200">
            <button
              onClick={() => setIsProductsExpanded(!isProductsExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
            >
              <h4 className="font-bold text-gray-800 text-sm">
                📦 Prodotti ({ordine.dettagli_ordine?.length || 0})
              </h4>
              <span className="text-gray-600 text-lg">
                {isProductsExpanded ? '▲' : '▼'}
              </span>
            </button>

            {isProductsExpanded && (
              <div className="border-t border-gray-200 overflow-x-auto">
                {ordine.dettagli_ordine && ordine.dettagli_ordine.length > 0 ? (
                  <table className="min-w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left px-3 py-2 font-bold text-gray-700 border border-gray-200">Prodotto</th>
                        <th className="text-right px-3 py-2 font-bold text-gray-700 border border-gray-200">Qtà</th>
                        <th className="text-left px-3 py-2 font-bold text-gray-700 border border-gray-200">Unità</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordine.dettagli_ordine.map((dettaglio, i) => {
                        const isCustom = isCustomDettaglio(dettaglio)
                        return (
                          <tr key={dettaglio.id} className={isCustom ? 'bg-yellow-100' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 border border-gray-200 font-semibold uppercase text-gray-800">
                              {dettaglio.prodotti?.nome || dettaglio.nome_custom}
                              {isCustom && (
                                <span className="block text-[10px] normal-case font-bold text-yellow-800 mt-0.5">⭐ Fuori catalogo</span>
                              )}
                            </td>
                            <td className="px-3 py-2 border border-gray-200 text-right font-bold text-gray-700 whitespace-nowrap">{dettaglio.quantita}</td>
                            <td className="px-3 py-2 border border-gray-200 text-gray-600 whitespace-nowrap">{dettaglio.tipologia}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-gray-500 italic p-3">Nessun prodotto disponibile</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleViewPDF}
              disabled={pdfLoading}
              className="flex-1 min-w-[100px] py-2 px-2 sm:px-3 bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-all"
            >
              {pdfLoading ? '⏳ Caricamento...' : '👁️ PDF'}
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              disabled={isLoading}
              className="py-2 px-3 bg-orange-500 text-white text-xs sm:text-sm font-bold rounded-lg hover:bg-orange-600 disabled:bg-gray-400 transition-all"
            >
              ✏️ Modifica
            </button>
            <button
              onClick={handleDeleteOrder}
              disabled={isLoading}
              className="py-2 px-3 bg-red-500 text-white text-xs sm:text-sm font-bold rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-all"
            >
              🗑️ Elimina
            </button>
          </div>

          {pdfError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {pdfError}
            </div>
          )}
        </div>

        {/* PDF Preview Modal */}
        <PDFPreviewModal
          pdfData={pdfData}
          fileName={`Ricevuta_${ordine.id}`}
          isOpen={showPDFModal}
          onClose={() => setShowPDFModal(false)}
          ordineId={ordine.id}
          onStatusChange={onStatusChange}
          isCompletato={ordine.completato}
        />

        {/* Edit Order Modal */}
        <EditOrderModal
          ordine={ordine}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={onOrderModified}
          onDateChanged={onDateChanged}
          prodotti={prodotti}
        />
      </>
    )
  }

  // Original Expandable Layout (showAsReceiptCards = false)
  return (
    <>
      <div className="bg-gradient-to-r from-white to-blue-50 border-2 border-blue-300 rounded-lg overflow-hidden hover:shadow-lg hover:border-blue-400 transition-all">
        {/* Header - Always Visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-blue-50 transition-all active:scale-95"
        >
          <div className="text-left flex-1">
            <div className="font-bold text-black text-lg uppercase">
              👤 {ordine.profili?.nome || 'Cliente Sconosciuto'}
            </div>
            <div className="text-sm text-blue-900 mt-2 font-semibold">
              Ordine per: {formatDate(ordine.data_ordine)}
            </div>
            <div className="text-xs text-blue-700 mt-1">
              🕒 Creato: {formatDateTime(ordine.data_creazione)}
            </div>
            {ordine.updated_at && (
              <div className="text-xs text-orange-600 font-semibold mt-0.5">
                ✏️ Modificato: {formatDateTime(ordine.updated_at)}
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-end gap-1 mr-2 sm:mr-4">
            <div className={`
              px-2 sm:px-3 py-1 rounded-full font-bold text-xs sm:text-sm
              ${ordine.completato
                ? 'bg-green-100 text-green-800'
                : 'bg-orange-100 text-orange-800'
              }
            `}>
              {ordine.completato ? '✅ Completato' : '⏳ In Corso'}
            </div>
            {hasCustomProducts && (
              <div className="px-2 sm:px-3 py-1 rounded-full font-bold text-xs bg-yellow-200 text-yellow-900 border border-yellow-400 whitespace-nowrap">
                ⭐ Fuori catalogo
              </div>
            )}
          </div>

          {/* Expand Arrow */}
          <span className="text-blue-600 text-2xl">
            {isExpanded ? '▲' : '▼'}
          </span>
        </button>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="border-t-2 border-blue-300 p-5 bg-gradient-to-br from-blue-50 to-white">
            {/* Products List */}
            <div className="mb-5">
              <h4 className="font-bold text-black text-sm mb-4 flex items-center gap-2">
                <span>📦</span> Prodotti ordinati ({ordine.dettagli_ordine?.length || 0}):
              </h4>
              <ul className="space-y-3 ml-2">
                {ordine.dettagli_ordine && ordine.dettagli_ordine.length > 0 ? (
                  ordine.dettagli_ordine.map((dettaglio) => {
                    const isCustom = isCustomDettaglio(dettaglio)
                    return (
                      <li
                        key={dettaglio.id}
                        className={`text-sm text-black px-4 py-3 rounded-lg border-l-4 shadow-sm font-semibold text-left ${
                          isCustom ? 'bg-yellow-100 border-yellow-500' : 'bg-white border-blue-500'
                        }`}
                      >
                        <span className="font-bold block text-left uppercase">{dettaglio.prodotti?.nome || dettaglio.nome_custom}</span>
                        {isCustom && (
                          <span className="text-yellow-800 text-xs font-bold mt-1 block">⭐ Prodotto fuori catalogo</span>
                        )}
                        <span className={`text-xs mt-1 block ${isCustom ? 'text-yellow-900' : 'text-blue-700'}`}>
                          Quantità: {dettaglio.quantita} {dettaglio.tipologia}
                        </span>
                      </li>
                    )
                  })
                ) : (
                  <li className="text-sm text-gray-500 italic">Nessun prodotto disponibile</li>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="border-t-2 border-blue-300 pt-5 mt-5 flex gap-3">
              <button
                onClick={handleStatusToggle}
                disabled={isLoading}
                className={`
                  flex-1 py-3 px-4 text-white text-sm font-bold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100
                  ${ordine.completato
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isLoading ? '⏳ Elaborando...' : (ordine.completato ? '↩️ Annulla' : '✅ Completa')}
              </button>

              <button
                onClick={handleDeleteOrder}
                disabled={isLoading}
                className="py-3 px-4 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
              >
                🗑️ Elimina
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
