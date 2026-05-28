import { useState, useMemo } from 'react'
import { format, parseISO, isSameDay, isAfter, startOfDay } from 'date-fns'
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
  const [filterDate, setFilterDate] = useState('')

  const toggleExpanded = (ordineId) => {
    setExpandedOrderId(expandedOrderId === ordineId ? null : ordineId)
  }

  // Check if order can be edited (only if data_ordine is today or in the future)
  const isOrderEditable = (data_ordine) => {
    try {
      const ordineDate = startOfDay(parseISO(data_ordine))
      const today = startOfDay(new Date())
      // Can edit only if ordine date is today or in the future
      return isAfter(ordineDate, today) || isSameDay(ordineDate, today)
    } catch {
      return false
    }
  }

  // Filter orders by data_ordine
  const filteredOrdini = useMemo(() => {
    if (!filterDate) return ordini

    return ordini.filter((ordine) => {
      try {
        const ordineDate = parseISO(ordine.data_ordine)
        const filteringDate = parseISO(filterDate)
        return isSameDay(ordineDate, filteringDate)
      } catch {
        return true
      }
    })
  }, [ordini, filterDate])

  const formatDate = (dateString) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
      return format(date, 'dd MMMM yyyy', { locale: it })
    } catch {
      return dateString
    }
  }

  const formatDateShort = (dateString) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
      return format(date, 'dd/MM/yyyy', { locale: it })
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-blue-800">📜 Cronologia Ordini</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-blue-700">Filtra per data:</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              ✕ Azzera
            </button>
          )}
        </div>
      </div>

      {filteredOrdini.length === 0 && filterDate && (
        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-center">
          <p className="text-sm text-yellow-700">❌ Nessun ordine trovato per la data {formatDateShort(filterDate)}</p>
        </div>
      )}

      <div className="space-y-3">
        {filteredOrdini.map((ordine) => (
          <div
            key={ordine.id}
            className="bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Order header (always visible) */}
            <button
              onClick={() => toggleExpanded(ordine.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-blue-100 transition-colors"
            >
              <div className="text-left">
                <div className="font-bold text-blue-900 text-sm">
                  📅 {formatDate(ordine.data_ordine)}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Creato il {formatDate(ordine.data_creazione)}
                </div>
              </div>
              <span className="text-blue-600 text-lg ml-2">
                {expandedOrderId === ordine.id ? '▲' : '▼'}
              </span>
            </button>

            {/* Order details (expandable) */}
            {expandedOrderId === ordine.id && (
              <div className="border-t border-blue-200 p-4 bg-blue-50">
                {/* Products list */}
                <div className="mb-4">
                  <h4 className="font-bold text-blue-900 text-sm mb-3">📦 Prodotti ordinati:</h4>
                  <ul className="space-y-2 ml-3">
                    {ordine.dettagli_ordine && ordine.dettagli_ordine.length > 0 ? (
                      ordine.dettagli_ordine.map((dettaglio) => (
                        <li key={dettaglio.id} className="text-sm text-blue-800 bg-white px-2 py-1 rounded border-l-4 border-blue-400">
                          <span className="font-semibold">{dettaglio.prodotti?.nome}</span>
                          <span className="text-blue-600 ml-2">({dettaglio.quantita} {dettaglio.tipologia})</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">Nessun dettaglio disponibile</li>
                    )}
                  </ul>
                </div>

                {/* Action buttons (only if not completed and still editable) */}
                {!ordine.completato && (
                  <>
                    {!isOrderEditable(ordine.data_ordine) && (
                      <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg mb-3">
                        <p className="text-xs text-yellow-800">
                          ⏱️ La data di questo ordine è passata. Non puoi più modificarlo o eliminarlo, ma puoi visualizzarne i dettagli.
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2 border-t border-blue-200 pt-4 mt-4">
                      <button
                        onClick={() => onEditOrder(ordine)}
                        disabled={isLoading || !isOrderEditable(ordine.data_ordine)}
                        title={!isOrderEditable(ordine.data_ordine) ? 'Non puoi modificare ordini con data passata' : 'Modifica questo ordine'}
                        className="flex-1 py-2 px-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
                        disabled={isLoading || !isOrderEditable(ordine.data_ordine)}
                        title={!isOrderEditable(ordine.data_ordine) ? 'Non puoi eliminare ordini con data passata' : 'Elimina questo ordine'}
                        className="flex-1 py-2 px-3 bg-red-100 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        🗑️ Cancella
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
