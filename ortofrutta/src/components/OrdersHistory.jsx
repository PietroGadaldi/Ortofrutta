import { useState, useMemo } from 'react'
import { format, parseISO, isSameDay, isAfter, startOfDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { WHATSAPP_NUMBER } from '../utils/constants'
import { IconChevronDown, IconClock, IconRefresh, IconWhatsApp, IconInfo, IconDocument } from './icons'

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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Usa l'ID passato dal parent se presente, altrimenti usa lo stato interno
  const expandedOrderId = expandedOrderIdProp !== undefined ? expandedOrderIdProp : internalExpandedId

  // La sezione è chiusa di default. Resta aperta anche quando il parent chiede di
  // mostrare un ordine specifico (es. "Visualizza ordine" dopo l'invio)
  const isOpen = isHistoryOpen || !!expandedOrderId

  const toggleExpanded = (ordineId) => {
    if (onToggleExpanded) {
      onToggleExpanded(expandedOrderId === ordineId ? null : ordineId)
    } else {
      setInternalExpandedId(internalExpandedId === ordineId ? null : ordineId)
    }
  }

  const toggleHistory = () => {
    if (isOpen) {
      setIsHistoryOpen(false)
      // Chiude anche l'ordine eventualmente espanso, altrimenti terrebbe aperta la sezione
      if (expandedOrderId) toggleExpanded(expandedOrderId)
    } else {
      setIsHistoryOpen(true)
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
      <div className="card p-8 text-center">
        <p className="text-slate-500 font-medium">Non hai ancora creato nessun ordine.</p>
      </div>
    )
  }

  return (
    <div className="card card-pad">
      {/* Intestazione: apre/chiude l'intera cronologia (chiusa di default) */}
      <button
        onClick={toggleHistory}
        aria-expanded={isOpen}
        aria-controls="orders-history-content"
        className="group w-full min-h-[44px] flex items-center justify-between gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verde-orto-500/40"
      >
        <h3 className="section-title flex items-center gap-2">
          <IconDocument className="w-5 h-5 text-verde-orto-600 flex-shrink-0" />
          Cronologia ordini
          <span className="badge-slate">{ordini.length}</span>
        </h3>
        <IconChevronDown
          className={`w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-slate-600 transition-transform duration-300 ease-in-out ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {/* Contenuto espandibile */}
      <div
        id="orders-history-content"
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-5">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-600 whitespace-nowrap flex-shrink-0">Filtra per data:</span>
              <input
                type="date"
                value={filterDate || format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input w-auto flex-shrink-0 px-2.5 py-1.5 text-sm"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="btn-danger-soft flex-shrink-0 px-2.5 py-1.5 text-xs"
                  title="Azzera filtro"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Avviso vincolo orario modifiche */}
          <div className="alert-info mb-5 flex gap-2.5">
            <IconInfo className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Informazione importante</p>
              <p className="text-xs mt-0.5">
                Puoi modificare o annullare i tuoi ordini in autonomia fino alle <strong>02:00</strong> del giorno di consegna.
              </p>
            </div>
          </div>

          {filteredOrdini.length === 0 && filterDate && (
            <div className="alert-warn mb-4">
              <p className="text-sm">Nessun ordine trovato per la data {formatDateShort(filterDate)}</p>
            </div>
          )}

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            {filteredOrdini.map((ordine) => {
              const isPast = !isOrderEditable(ordine.data_ordine);
              const statusBadge = isPast
                ? <span className="badge-slate">Archiviato</span>
                : ordine.completato
                  ? <span className="badge-green">Completato</span>
                  : <span className="badge-amber">In corso</span>
              return (
              <div
                key={ordine.id}
                className="border border-slate-200 rounded-xl overflow-hidden bg-white transition-shadow hover:shadow-sm"
              >
                {/* Order header (always visible) */}
                <button
                  onClick={() => {
                    // Tiene aperta la sezione anche quando l'ordine viene richiuso
                    setIsHistoryOpen(true)
                    toggleExpanded(ordine.id)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-slate-50"
                >
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-[15px]">
                      {formatDate(ordine.data_ordine)}
                    </div>
                    <div className="mt-1.5">
                      {statusBadge}
                    </div>
                  </div>
                  <IconChevronDown
                    className={`w-5 h-5 ml-4 flex-shrink-0 text-slate-400 transition-transform duration-300 ease-in-out ${
                      expandedOrderId === ordine.id ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>

                {/* Order details (expandable) */}
                <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                  expandedOrderId === ordine.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}>
                  <div className="overflow-hidden">
                  <div className={`border-t border-slate-200 bg-slate-50/60 p-4 transition-opacity duration-200 ${
                    expandedOrderId === ordine.id ? 'opacity-100 delay-100' : 'opacity-0'
                  }`}>
                    <div className="text-left text-xs mb-4 text-slate-500 font-medium flex items-start gap-1.5">
                      <IconClock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>
                        Creato il {formatDateTime(ordine.data_creazione)}
                        {ordine.updated_at && (
                          <>
                            <br />
                            <span className="text-amber-700">Modificato il {formatDateTime(ordine.updated_at)}</span>
                          </>
                        )}
                      </span>
                    </div>
                    {/* Products list */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[13px] font-semibold text-slate-600 uppercase tracking-wide">
                          Prodotti ordinati
                        </h4>
                        <button
                          onClick={() => onReorder(ordine)}
                          className="btn-secondary px-3 py-1.5 text-xs"
                          title="Copia questi prodotti nel riepilogo per un nuovo ordine"
                        >
                          <IconRefresh className="w-3.5 h-3.5" />
                          Ripeti ordine
                        </button>
                      </div>
                      <ul className="space-y-2">
                        {ordine.dettagli_ordine && ordine.dettagli_ordine.length > 0 ? (
                          ordine.dettagli_ordine.map((dettaglio) => (
                            <li key={dettaglio.id} className="text-sm bg-white px-3.5 py-2.5 rounded-lg border border-slate-200 text-left">
                              <span className="font-semibold block uppercase text-slate-900">{dettaglio.prodotti?.nome || dettaglio.nome_custom}</span>
                              <span className="text-xs mt-0.5 block text-slate-500 tabular-nums">
                                {dettaglio.quantita} {dettaglio.tipologia}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-slate-400">Nessun dettaglio disponibile</li>
                        )}
                      </ul>
                    </div>

                    {/* Action buttons (only if NOT archived — completato non blocca il cliente) */}
                    {!isPast && (
                      <div className="flex gap-2.5 border-t border-slate-200 pt-4 mt-4">
                        <button
                          onClick={() => onEditOrder(ordine)}
                          disabled={isLoading}
                          className="btn-secondary flex-1 py-2.5"
                        >
                          Modifica ordine
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Sei sicuro di voler cancellare questo ordine?')) {
                              onDeleteOrder(ordine.id)
                            }
                          }}
                          disabled={isLoading}
                          className="btn-danger-soft flex-1 py-2.5"
                        >
                          Annulla ordine
                        </button>
                      </div>
                    )}

                    {/* Messaggio quando il tempo per modificare è scaduto */}
                    {isPast && (
                      <div className="alert-warn mt-4">
                        <p className="text-sm font-semibold">Modifica non più disponibile</p>
                        <p className="text-xs mt-1.5 leading-relaxed">
                          Il tempo massimo per la modifica autonoma (ore 02:00 del giorno di consegna) è scaduto.
                        </p>
                        <p className="text-xs mt-1 leading-relaxed">
                          Se hai bisogno di variazioni urgenti, contatta direttamente il titolare su WhatsApp:
                        </p>
                        <a
                          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Salve, avrei bisogno di una modifica urgente al mio ordine.')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1eb958] text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors active:scale-[0.98]"
                        >
                          <IconWhatsApp className="w-4 h-4 flex-shrink-0" />
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
        </div>
      </div>
    </div>
  )
}
