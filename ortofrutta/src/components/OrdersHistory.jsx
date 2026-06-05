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
    <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
          <span className="text-2xl">📜</span> Cronologia Ordini
        </h3>
        <div className="flex items-center gap-3">
          <label className="hidden md:block text-sm font-bold text-blue-900">Filtra per data:</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black font-semibold"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="hidden md:block px-3 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-bold"
            >
              ✕ Azzera
            </button>
          )}
        </div>
      </div>

      {filteredOrdini.length === 0 && filterDate && (
        <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg mb-4">
          <p className="text-sm text-yellow-900 font-semibold">❌ Nessun ordine trovato per la data {formatDateShort(filterDate)}</p>
        </div>
      )}

      <div className="space-y-3">
        {filteredOrdini.map((ordine) => (
          <div
            key={ordine.id}
            className="bg-gradient-to-r from-blue-50 to-white border-2 border-blue-300 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-400 transition-all"
          >
            {/* Order header (always visible) */}
            <button
              onClick={() => toggleExpanded(ordine.id)}
              className="w-full flex items-center justify-between p-5 hover:bg-blue-100 transition-all active:scale-95"
            >
              <div className="text-left flex-1">
                <div className="font-bold text-blue-900 text-lg">
                  📅 {formatDate(ordine.data_ordine)}
                </div>
                <div className="text-xs text-blue-700 mt-2 font-semibold">
                  Creato il {formatDate(ordine.data_creazione)}
                </div>
              </div>
              <span className="text-blue-600 text-2xl ml-4">
                {expandedOrderId === ordine.id ? '▲' : '▼'}
              </span>
            </button>

            {/* Order details (expandable) */}
            {expandedOrderId === ordine.id && (
              <div className="border-t-2 border-blue-300 p-5 bg-gradient-to-br from-blue-50 to-white">
                {/* Products list */}
                <div className="mb-5">
                  <h4 className="font-bold text-blue-900 text-sm mb-4 flex items-center gap-2">
                    <span>📦</span> Prodotti ordinati:
                  </h4>
                  <ul className="space-y-3 ml-2">
                    {ordine.dettagli_ordine && ordine.dettagli_ordine.length > 0 ? (
                      ordine.dettagli_ordine.map((dettaglio) => (
                        <li key={dettaglio.id} className="text-sm text-blue-900 bg-white px-4 py-3 rounded-lg border-l-4 border-blue-500 shadow-sm font-semibold text-left">
                          <span className="font-bold block">{dettaglio.prodotti?.nome}</span>
                          <span className="text-blue-700 text-xs mt-1 block">
                            {dettaglio.quantita} {dettaglio.tipologia}
                          </span>
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
                      <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg mb-4">
                        <p className="text-xs text-yellow-900 font-semibold">
                          ⏱️ La data di questo ordine è passata. Non puoi più modificarlo o eliminarlo, ma puoi visualizzarne i dettagli.
                        </p>
                      </div>
                    )}
                    <div className="flex gap-3 border-t-2 border-blue-300 pt-5 mt-5">
                      <button
                        onClick={() => onEditOrder(ordine)}
                        disabled={isLoading || !isOrderEditable(ordine.data_ordine)}
                        title={!isOrderEditable(ordine.data_ordine) ? 'Non puoi modificare ordini con data passata' : 'Modifica questo ordine'}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
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
                        className="flex-1 py-3 px-4 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
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
