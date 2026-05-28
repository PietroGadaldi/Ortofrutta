import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

/**
 * OrdersHistory component
 * Displays client's previous orders with ability to modify/delete non-completed ones
 * @param {Array<Object>} ordini - List of orders
 * @param {Function} onEditOrder - Callback to edit an order
 * @param {Function} onDeleteOrder - Callback to delete an order
 * @param {boolean} isLoading - Loading state
 */
export function OrdersHistory({ ordini = [], onEditOrder, onDeleteOrder, isLoading = false }) {
  const [expandedOrderId, setExpandedOrderId] = useState(null)

  const toggleExpanded = (ordineId) => {
    setExpandedOrderId(expandedOrderId === ordineId ? null : ordineId)
  }

  const getStatusBadge = (completato) => {
    if (completato) {
      return <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">✅ Completato</span>
    }
    return <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">⏳ In sospeso</span>
  }

  const formatDate = (dateString) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
      return format(date, 'dd MMMM yyyy', { locale: it })
    } catch {
      return dateString
    }
  }

  if (ordini.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-300 rounded-lg p-6 text-center">
        <p className="text-blue-700">📭 Non hai ancora creato nessun ordine</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-bold text-blue-800 mb-4">📜 Cronologia Ordini</h3>

      <div className="space-y-2">
        {ordini.map((ordine) => (
          <div
            key={ordine.id}
            className="border border-blue-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Order header (always visible) */}
            <button
              onClick={() => toggleExpanded(ordine.id)}
              className="w-full flex items-center justify-between p-3 hover:bg-blue-50 transition-colors"
            >
              <div className="flex-1 text-left">
                <div className="font-semibold text-blue-800">
                  Ordine del {formatDate(ordine.data_creazione)}
                </div>
                <div className="text-sm text-blue-600">
                  Prenotazione: {formatDate(ordine.data_ordine)}
                  <span className="ml-2">{getStatusBadge(ordine.completato)}</span>
                </div>
              </div>
              <span className="text-blue-600 ml-2">
                {expandedOrderId === ordine.id ? '▼' : '▶'}
              </span>
            </button>

            {/* Order details (expandable) */}
            {expandedOrderId === ordine.id && (
              <div className="border-t border-blue-100 p-3 bg-blue-50">
                {/* Products list */}
                <div className="mb-3">
                  <h4 className="font-semibold text-blue-800 text-sm mb-2">Prodotti:</h4>
                  <ul className="space-y-1 ml-2">
                    {ordine.dettagli_ordine && ordine.dettagli_ordine.length > 0 ? (
                      ordine.dettagli_ordine.map((dettaglio) => (
                        <li key={dettaglio.id} className="text-sm text-blue-700">
                          • <span className="font-semibold">{dettaglio.prodotti?.nome}</span> —{' '}
                          {dettaglio.quantita} {dettaglio.tipologia}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">Nessun dettaglio disponibile</li>
                    )}
                  </ul>
                </div>

                {/* Action buttons (only if not completed) */}
                {!ordine.completato && (
                  <div className="flex gap-2 border-t border-blue-100 pt-3">
                    <button
                      onClick={() => onEditOrder(ordine)}
                      disabled={isLoading}
                      className="flex-1 py-1 px-3 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                      ✏️ Modifica
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            'Sei sicuro di voler cancellare questo ordine?'
                          )
                        ) {
                          onDeleteOrder(ordine.id)
                        }
                      }}
                      disabled={isLoading}
                      className="flex-1 py-1 px-3 bg-red-100 text-red-700 text-sm font-semibold rounded hover:bg-red-200 disabled:bg-gray-300 transition-colors"
                    >
                      🗑️ Cancella
                    </button>
                  </div>
                )}

                {ordine.completato && (
                  <div className="border-t border-blue-100 pt-3 text-center">
                    <p className="text-xs text-green-700">
                      ✅ Questo ordine è completato e non può essere modificato
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
