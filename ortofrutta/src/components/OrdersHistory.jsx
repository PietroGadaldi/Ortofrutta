import { useState, useMemo } from 'react'
import { format, parseISO, isSameDay, isAfter, startOfDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { capitalize } from '../utils/constants'

/**
 * OrdersHistory component
 * Displays client's previous orders with ability to modify/delete non-completed ones
 * @param {Array<Object>} ordini - List of orders
 * @param {Function} onEditOrder - Callback to edit an order
 * @param {Function} onDeleteOrder - Callback to delete an order
 * @param {boolean} isLoading - Loading state
 * @param {string} expandedOrderId - ID of the order to expand (controlled from parent)
 * @param {Function} onToggleExpanded - Callback to toggle expansion (controlled from parent)
 */
export function OrdersHistory({ 
  ordini = [], 
  onEditOrder, 
  onReorder, 
  onDeleteOrder, 
  isLoading = false,
  expandedOrderId: expandedOrderIdProp,
  onToggleExpanded
}) {
  const [internalExpandedId, setInternalExpandedId] = useState(null)
  const [filterDate, setFilterDate] = useState('')

  // Usa l'ID passato dal parent se presente, altrimenti usa lo stato interno
  const expandedOrderId = expandedOrderIdProp !== undefined ? expandedOrderIdProp : internalExpandedId

  const toggleExpanded = (ordineId) => {
    if (onToggleExpanded) {
      onToggleExpanded(expandedOrderId === ordineId ? null : ordineId)
    } else {
      setInternalExpandedId(internalExpandedId === ordineId ? null : ordineId)
    }
  }

  // Check if order can be edited (today or future, but today only until 06:00)
  const isOrderEditable = (data_ordine) => {
    try {
      const ordineDate = startOfDay(parseISO(data_ordine))
      const now = new Date()
      const today = startOfDay(now)
      
      // Se l'ordine è per un giorno futuro, è sempre modificabile
      if (isAfter(ordineDate, today)) return true
      
      // Se l'ordine è per oggi, è modificabile solo se sono prima delle 6:00 del mattino
      if (isSameDay(ordineDate, today)) {
        return now.getHours() < 6
      }
      
      return false
    } catch {
      return false
    }
  }

  // Filter orders by data_ordine
  const filteredOrdini = useMemo(() => {
    // Creiamo una copia per non mutare l'array originale durante il sort
    let result = [...ordini]

    // 1. Filtro per data (se applicato)
    if (filterDate) {
      result = result.filter((ordine) => {
        try {
          const ordineDate = parseISO(ordine.data_ordine)
          const filteringDate = parseISO(filterDate)
          return isSameDay(ordineDate, filteringDate)
        } catch {
          return true
        }
      })
    }

    // 2. Ordinamento combinato
    return result.sort((a, b) => {
      const isPastA = !isOrderEditable(a.data_ordine)
      const isPastB = !isOrderEditable(b.data_ordine)

      // Definiamo i pesi della priorità: In corso = 1, Completato = 2, Archiviato = 3
      const priorityA = isPastA ? 3 : (a.completato ? 2 : 1)
      const priorityB = isPastB ? 3 : (b.completato ? 2 : 1)

      if (priorityA !== priorityB) {
        return priorityA - priorityB // Ordine crescente di priorità (1 -> 2 -> 3)
      }

      // Se hanno la stessa priorità, ordina per data ordine decrescente (più recente in alto)
      return parseISO(b.data_ordine).getTime() - parseISO(a.data_ordine).getTime()
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

      {/* Avviso vincolo orario modifiche */}
      <div className="mb-6 p-4 bg-blue-100 border-l-4 border-blue-500 rounded-lg shadow-sm text-left">
        <p className="text-sm text-blue-900 font-bold flex items-center gap-2">
          <span>ℹ️</span> Informazione importante:
        </p>
        <p className="text-xs text-blue-800 mt-1 font-semibold">
          Puoi modificare o annullare i tuoi ordini in autonomia fino alle <strong>06:00</strong> del giorno di consegna.
        </p>
      </div>

      {filteredOrdini.length === 0 && filterDate && (
        <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg mb-4">
          <p className="text-sm text-yellow-900 font-semibold">❌ Nessun ordine trovato per la data {formatDateShort(filterDate)}</p>
        </div>
      )}

      <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2">
        {filteredOrdini.map((ordine) => {
          const isPast = !isOrderEditable(ordine.data_ordine);
          return (
          <div
            key={ordine.id}
            className={`border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg ${
              isPast
                ? 'bg-gradient-to-r from-blue-50 to-white border-blue-300 hover:border-blue-400'
                : ordine.completato
                ? 'bg-gradient-to-r from-green-50 to-white border-green-300 hover:border-green-400'
                : 'bg-gradient-to-r from-amber-50 to-white border-amber-300 hover:border-amber-400'
            }`}
          >
            {/* Order header (always visible) */}
            <button
              onClick={() => toggleExpanded(ordine.id)}
              className={`w-full flex items-center justify-between p-5 transition-all active:scale-95 ${
                isPast ? 'hover:bg-blue-100' : ordine.completato ? 'hover:bg-green-100' : 'hover:bg-amber-100'
              }`}
            >
              <div className="text-left flex-1">
                <div className={`font-bold text-lg ${isPast ? 'text-blue-900' : ordine.completato ? 'text-green-900' : 'text-amber-900'}`}>
                  📅 {formatDate(ordine.data_ordine)}
                </div>
                <div className={`text-xs mt-2 font-bold ${isPast ? 'text-blue-700' : ordine.completato ? 'text-green-700' : 'text-amber-700'}`}>
                  {isPast ? '📁 Archiviato' : ordine.completato ? '✅ Completato!' : '⏳ Ordine in corso...'}
                </div>
              </div>
              <span className={`text-2xl ml-4 ${isPast ? 'text-blue-600' : ordine.completato ? 'text-green-600' : 'text-amber-600'}`}>
                {expandedOrderId === ordine.id ? '▲' : '▼'}
              </span>
            </button>

            {/* Order details (expandable) */}
            {expandedOrderId === ordine.id && (
              <div className={`border-t-2 p-5 ${
                isPast 
                  ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-white' 
                  : ordine.completato 
                    ? 'border-green-300 bg-gradient-to-br from-green-50 to-white' 
                    : 'border-amber-300 bg-gradient-to-br from-amber-50 to-white'
              }`}>
                <div className={`text-left text-xs mb-4 font-bold ${isPast ? 'text-blue-700' : ordine.completato ? 'text-green-700' : 'text-amber-700'}`}>
                  🕒 Creato il {formatDate(ordine.data_creazione)}
                </div>
                {/* Products list */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`font-bold text-sm flex items-center gap-2 ${isPast ? 'text-blue-900' : ordine.completato ? 'text-green-900' : 'text-amber-900'}`}>
                      <span>📦</span> Prodotti ordinati:
                    </h4>
                    <button
                      onClick={() => onReorder(ordine)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 flex items-center gap-1 ${
                        isPast 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : ordine.completato 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-amber-600 text-white hover:bg-amber-700'
                      }`}
                      title="Copia questi prodotti nel riepilogo per un nuovo ordine"
                    >
                      <span></span> Ripeti Ordine
                    </button>
                  </div>
                  <ul className="space-y-3 ml-2">
                    {ordine.dettagli_ordine && ordine.dettagli_ordine.length > 0 ? (
                      ordine.dettagli_ordine.map((dettaglio) => (
                        <li key={dettaglio.id} className={`text-sm bg-white px-4 py-3 rounded-lg border-l-4 shadow-sm font-semibold text-left ${
                          isPast 
                            ? 'text-blue-900 border-blue-500' 
                            : ordine.completato 
                              ? 'text-green-900 border-green-500' 
                              : 'text-amber-900 border-amber-500'
                        }`}>
                          <span className="font-bold block">{capitalize(dettaglio.prodotti?.nome || dettaglio.nome_custom)}</span>
                          <span className={`text-xs mt-1 block ${isPast ? 'text-blue-700' : ordine.completato ? 'text-green-700' : 'text-amber-700'}`}>
                            {dettaglio.quantita} {dettaglio.tipologia}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">Nessun dettaglio disponibile</li>
                    )}
                  </ul>
                </div>

                {/* Action buttons (only if NOT archived and NOT completed) */}
                {!isPast && !ordine.completato && (
                  <div className="flex gap-3 border-t-2 border-amber-300 pt-5 mt-5">
                    <button
                      onClick={() => onEditOrder(ordine)}
                      disabled={isLoading}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
                    >
                      Modifica Ordine
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Sei sicuro di voler cancellare questo ordine?')) {
                          onDeleteOrder(ordine.id)
                        }
                      }}
                      disabled={isLoading}
                      className="flex-1 py-3 px-4 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
                    >
                      Annulla Ordine
                    </button>
                  </div>
                )}

                {/* Messaggio quando il tempo per modificare è scaduto ma l'ordine non è ancora completato */}
                {isPast && !ordine.completato && (
                  <div className="mt-5 p-4 bg-orange-100 border-l-4 border-orange-500 rounded-lg text-left">
                    <p className="text-sm text-orange-900 font-bold">⚠️ Modifica non più disponibile</p>
                    <p className="text-xs text-orange-800 mt-1 font-semibold leading-relaxed">
                      Il tempo massimo per la modifica automatica (ore 06:00 del giorno di consegna) è scaduto.<br/>
                      Se hai bisogno di variazioni urgenti, prova a <strong>contattare direttamente il titolare</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  )
}
