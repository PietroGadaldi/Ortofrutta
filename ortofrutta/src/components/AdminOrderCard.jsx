import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { PDFPreviewModal } from './PDFPreviewModal'
import { EditOrderModal } from './EditOrderModal'
import { getOrderPDFUrl } from '../services/pdfStorageService'
import { generateOrderPDF } from '../utils/pdfGenerator'
import { IconChevronDown, IconEye, IconPencil, IconTrash, IconStar, IconCheck } from './icons'

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
        <div className="card p-4 sm:p-5 hover:shadow-md transition-shadow">
          {/* Receipt Header - All left aligned */}
          <div className="mb-4 text-left">
            <div className="flex items-start justify-between mb-2.5 gap-2">
              <h3 className="text-[15px] sm:text-base font-bold text-slate-900 min-w-0 break-words uppercase">
                {ordine.profili?.nome || 'Cliente Sconosciuto'}
              </h3>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                {ordine.completato ? (
                  <span className="badge-green">Completato</span>
                ) : (
                  <span className="badge-amber">Da stampare</span>
                )}
                {hasCustomProducts && (
                  <span className="badge bg-yellow-100 text-yellow-900 ring-1 ring-inset ring-yellow-500/40">
                    <IconStar className="w-3 h-3" /> Fuori catalogo
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-[13px] text-slate-600 mb-0.5">
              <span className="font-semibold text-slate-700">Data ordine:</span> {formatDate(ordine.data_ordine)}
            </p>
            <p className="text-xs sm:text-[13px] text-slate-500">
              <span className="font-semibold text-slate-600">Creato il:</span> {formatDateTime(ordine.data_creazione)}
            </p>
            {ordine.updated_at && (
              <p className="text-xs sm:text-[13px] text-amber-700 font-medium mt-0.5">
                <span className="font-semibold">Modificato il:</span> {formatDateTime(ordine.updated_at)}
              </p>
            )}
          </div>

          {/* Products - Expandable */}
          <div className="mb-4 rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setIsProductsExpanded(!isProductsExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <h4 className="font-semibold text-slate-800 text-sm">
                Prodotti ({ordine.dettagli_ordine?.length || 0})
              </h4>
              <IconChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isProductsExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isProductsExpanded && (
              <div className="border-t border-slate-200 overflow-x-auto">
                {ordine.dettagli_ordine && ordine.dettagli_ordine.length > 0 ? (
                  <table className="min-w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Prodotto</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Qtà</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Unità</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ordine.dettagli_ordine.map((dettaglio) => {
                        const isCustom = isCustomDettaglio(dettaglio)
                        return (
                          <tr key={dettaglio.id} className={isCustom ? 'bg-yellow-50' : 'bg-white'}>
                            <td className="px-3 py-2 font-semibold uppercase text-slate-800 text-left">
                              {dettaglio.prodotti?.nome || dettaglio.nome_custom}
                              {isCustom && (
                                <span className="flex items-center gap-1 text-[10px] normal-case font-bold text-yellow-800 mt-0.5">
                                  <IconStar className="w-3 h-3" /> Fuori catalogo
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-800 whitespace-nowrap tabular-nums">{dettaglio.quantita}</td>
                            <td className="px-3 py-2 text-slate-500 whitespace-nowrap text-left">{dettaglio.tipologia}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-slate-400 italic p-3">Nessun prodotto disponibile</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-3.5 border-t border-slate-200">
            <button
              onClick={handleViewPDF}
              disabled={pdfLoading}
              className="btn-primary flex-1 min-w-[100px] py-2 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <IconEye className="w-4 h-4" />
              {pdfLoading ? 'Caricamento...' : 'PDF'}
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              disabled={isLoading}
              className="btn-secondary py-2 px-3 text-xs sm:text-sm"
            >
              <IconPencil className="w-4 h-4" />
              Modifica
            </button>
            <button
              onClick={handleDeleteOrder}
              disabled={isLoading}
              className="btn-danger-soft py-2 px-3 text-xs sm:text-sm"
            >
              <IconTrash className="w-4 h-4" />
              Elimina
            </button>
          </div>

          {pdfError && (
            <div className="alert-error mt-4">
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
      <div className="card overflow-hidden hover:shadow-md transition-shadow">
        {/* Header - Always Visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors"
        >
          <div className="text-left flex-1 min-w-0">
            <div className="font-bold text-slate-900 text-[15px] sm:text-base uppercase">
              {ordine.profili?.nome || 'Cliente Sconosciuto'}
            </div>
            <div className="text-sm text-slate-600 mt-1.5 font-medium">
              Ordine per: {formatDate(ordine.data_ordine)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Creato: {formatDateTime(ordine.data_creazione)}
            </div>
            {ordine.updated_at && (
              <div className="text-xs text-amber-700 font-medium mt-0.5">
                Modificato: {formatDateTime(ordine.updated_at)}
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-end gap-1 mr-2 sm:mr-3">
            {ordine.completato ? (
              <span className="badge-green">Completato</span>
            ) : (
              <span className="badge-amber">In corso</span>
            )}
            {hasCustomProducts && (
              <span className="badge bg-yellow-100 text-yellow-900 ring-1 ring-inset ring-yellow-500/40">
                <IconStar className="w-3 h-3" /> Fuori catalogo
              </span>
            )}
          </div>

          {/* Expand Arrow */}
          <IconChevronDown className={`w-5 h-5 flex-shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="border-t border-slate-200 p-4 sm:p-5 bg-slate-50/60">
            {/* Products List */}
            <div className="mb-4">
              <h4 className="text-[13px] font-semibold text-slate-600 uppercase tracking-wide mb-3 text-left">
                Prodotti ordinati ({ordine.dettagli_ordine?.length || 0})
              </h4>
              <ul className="space-y-2">
                {ordine.dettagli_ordine && ordine.dettagli_ordine.length > 0 ? (
                  ordine.dettagli_ordine.map((dettaglio) => {
                    const isCustom = isCustomDettaglio(dettaglio)
                    return (
                      <li
                        key={dettaglio.id}
                        className={`text-sm px-3.5 py-2.5 rounded-lg border text-left ${
                          isCustom ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-slate-200'
                        }`}
                      >
                        <span className="font-semibold block text-left uppercase text-slate-900">{dettaglio.prodotti?.nome || dettaglio.nome_custom}</span>
                        {isCustom && (
                          <span className="flex items-center gap-1 text-yellow-800 text-xs font-bold mt-0.5">
                            <IconStar className="w-3 h-3" /> Prodotto fuori catalogo
                          </span>
                        )}
                        <span className={`text-xs mt-0.5 block tabular-nums ${isCustom ? 'text-yellow-900' : 'text-slate-500'}`}>
                          Quantità: {dettaglio.quantita} {dettaglio.tipologia}
                        </span>
                      </li>
                    )
                  })
                ) : (
                  <li className="text-sm text-slate-400 italic">Nessun prodotto disponibile</li>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-slate-200 pt-4 mt-4 flex gap-2.5">
              <button
                onClick={handleStatusToggle}
                disabled={isLoading}
                className={ordine.completato ? 'btn-secondary flex-1 py-2.5' : 'btn-primary flex-1 py-2.5'}
              >
                {!isLoading && !ordine.completato && <IconCheck className="w-4 h-4" />}
                {isLoading ? 'Elaborando...' : (ordine.completato ? 'Annulla completamento' : 'Completa')}
              </button>

              <button
                onClick={handleDeleteOrder}
                disabled={isLoading}
                className="btn-danger-soft py-2.5 px-4"
              >
                <IconTrash className="w-4 h-4" />
                Elimina
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
