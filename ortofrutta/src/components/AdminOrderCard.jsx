import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

/**
 * AdminOrderCard component
 * Expandable order card for admin/titolare view
 * @param {Object} ordine - Order object with details
 * @param {Function} onStatusChange - Callback when status is toggled
 * @param {Function} onDelete - Callback when delete is clicked
 * @param {boolean} isLoading - Loading state for button
 */
export function AdminOrderCard({ ordine, onStatusChange, onDelete, isLoading = false }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy', { locale: it })
    } catch {
      return dateString
    }
  }

  const handleStatusToggle = async () => {
    await onStatusChange(ordine.id, !ordine.completato)
  }

  return (
    <div className="bg-gradient-to-r from-white to-blue-50 border-2 border-blue-300 rounded-lg overflow-hidden hover:shadow-lg hover:border-blue-400 transition-all">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-blue-50 transition-all active:scale-95"
      >
        <div className="text-left flex-1">
          <div className="font-bold text-black text-lg">
            👤 {ordine.profili?.nome || 'Cliente Sconosciuto'}
          </div>
          <div className="text-sm text-blue-900 mt-2 font-semibold">
            Ordine per: {formatDate(ordine.data_ordine)}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            Creato: {formatDate(ordine.data_creazione)}
          </div>
        </div>

        {/* Status Badge */}
        <div className={`
          px-3 py-1 rounded-full font-bold text-sm mr-4
          ${ordine.completato 
            ? 'bg-green-100 text-green-800' 
            : 'bg-orange-100 text-orange-800'
          }
        `}>
          {ordine.completato ? '✅ Completato' : '⏳ In Corso'}
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
                ordine.dettagli_ordine.map((dettaglio) => (
                  <li key={dettaglio.id} className="text-sm text-black bg-white px-4 py-3 rounded-lg border-l-4 border-blue-500 shadow-sm font-semibold text-left">
                    <span className="font-bold block">{dettaglio.prodotti?.nome}</span>
                    <span className="text-blue-700 text-xs mt-1 block">
                      Quantità: {dettaglio.quantita} {dettaglio.tipologia}
                    </span>
                  </li>
                ))
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
              onClick={() => {
                if (window.confirm('Sei sicuro di voler eliminare questo ordine?')) {
                  onDelete(ordine.id)
                }
              }}
              disabled={isLoading}
              className="py-3 px-4 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
            >
              🗑️ Elimina
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
