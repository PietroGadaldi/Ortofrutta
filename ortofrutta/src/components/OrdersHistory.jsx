import { useState, useMemo } from 'react'
import { format, parseISO, isSameDay, isAfter, startOfDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { WHATSAPP_NUMBER } from '../utils/constants'

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

  // Check if order can be edited (today or future, but today only until 02:00)
  const isOrderEditable = (data_ordine) => {
    try {
      const ordineDate = startOfDay(parseISO(data_ordine))
      const now = new Date()
      const today = startOfDay(now)

      // Se l'ordine è per un giorno futuro, è sempre modificabile
      if (isAfter(ordineDate, today)) return true

      // Se l'ordine è per oggi, è modificabile solo se sono prima delle 02:00 del mattino
      if (isSameDay(ordineDate, today)) {
        return now.getHours() < 2
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

  const formatDateTime = (dateString) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
      return format(date, "dd MMMM yyyy 'alle' HH:mm", { locale: it })
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
      <div className="mb-6">
        <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2 mb-3">
          <span className="text-2xl">📜</span> Cronologia Ordini
        </h3>
        <div className="flex items-center gap-2">
          <label className="hidden sm:block text-sm font-bold text-blue-900 whitespace-nowrap">Filtra:</label>
          <div className="relative flex-1 min-w-0">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-black font-semibold bg-white"
            />
          </div>
          {filterDate ? (
            <button
              onClick={() => setFilterDate('')}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-bold text-lg active:scale-95"
              title="Azzera filtro"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {/* Avviso vincolo orario modifiche */}
      <div className="mb-6 p-4 bg-blue-100 border-l-4 border-blue-500 rounded-lg shadow-sm text-left">
        <p className="text-sm text-blue-900 font-bold flex items-center gap-2">
          <span>ℹ️</span> Informazione importante:
        </p>
        <p className="text-xs text-blue-800 mt-1 font-semibold">
          Puoi modificare o annullare i tuoi ordini in autonomia fino alle <strong>02:00</strong> del giorno di consegna.
        </p>
      </div>

      {filteredOrdini.length === 0 && filterDate && (
        <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg mb-4">
          <p className="text-sm text-yellow-900 font-semibold">❌ Nessun ordine trovato per la data {formatDateShort(filterDate)}</p>
        </div>
      )}

      <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
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
              <svg
                className={`w-5 h-5 ml-4 flex-shrink-0 transition-transform duration-300 ease-in-out ${
                  expandedOrderId === ordine.id ? 'rotate-180' : 'rotate-0'
                } ${isPast ? 'text-blue-600' : ordine.completato ? 'text-green-600' : 'text-amber-600'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Order details (expandable) */}
            <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
              expandedOrderId === ordine.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}>
              <div className="overflow-hidden">
              <div className={`border-t-2 p-5 transition-opacity duration-200 ${
                expandedOrderId === ordine.id ? 'opacity-100 delay-100' : 'opacity-0'
              } ${
                isPast
                  ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-white'
                  : ordine.completato
                    ? 'border-green-300 bg-gradient-to-br from-green-50 to-white'
                    : 'border-amber-300 bg-gradient-to-br from-amber-50 to-white'
              }`}>
                <div className={`text-left text-xs mb-4 font-bold ${isPast ? 'text-blue-700' : ordine.completato ? 'text-green-700' : 'text-amber-700'}`}>
                  {ordine.updated_at
                    ? <>🕒 Creato il {formatDateTime(ordine.data_creazione)}<br /><span className="text-orange-600">✏️ Modificato il {formatDateTime(ordine.updated_at)}</span></>
                    : <>🕒 Creato il {formatDateTime(ordine.data_creazione)}</>
                  }
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
                          <span className="font-bold block uppercase">{dettaglio.prodotti?.nome || dettaglio.nome_custom}</span>
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

                {/* Messaggio quando il tempo per modificare è scaduto */}
                {isPast && (
                  <div className="mt-5 p-4 bg-orange-100 border-l-4 border-orange-500 rounded-lg text-left">
                    <p className="text-sm text-orange-900 font-bold">⚠️ Modifica non più disponibile</p>
                    <p className="text-xs text-orange-800 mt-2 font-semibold leading-relaxed">
                      Il tempo massimo per la modifica autonoma (ore 02:00 del giorno di consegna) è scaduto.
                    </p>
                    <p className="text-xs text-orange-800 mt-1 leading-relaxed">
                      Se hai bisogno di variazioni urgenti, contatta direttamente il titolare su WhatsApp:
                    </p>
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Salve, avrei bisogno di una modifica urgente al mio ordine.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.554 4.1 1.523 5.823L.057 23.486a.5.5 0 0 0 .612.612l5.663-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.502-5.176-1.381l-.372-.217-3.863 1 1-3.863-.217-.372A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      Contatta il titolare su WhatsApp
                    </a>
                  </div>
                )}
              </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  )
}
