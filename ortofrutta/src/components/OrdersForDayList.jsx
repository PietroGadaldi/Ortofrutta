import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { AdminOrderCard } from './AdminOrderCard'
import { PDFPreviewModal } from './PDFPreviewModal'
import { generateDayOrdersPDF, generateDaySummaryPDF } from '../utils/pdfGenerator'
import { IconSearch, IconPrinter, IconChevronDown, IconCheckCircle, IconDocument, IconStar } from './icons'

/**
 * OrdersForDayList component
 * Displays all orders for a selected date
 * @param {Date} selectedDate - Selected date
 * @param {Array} ordini - Array of orders for the date
 * @param {Function} onStatusChange - Callback when order status changes
 * @param {Function} onDeleteOrder - Callback when order is deleted
 * @param {Function} onOrderModified - Callback when order is modified
 * @param {Function} onDateChanged - Callback when order date is changed
 * @param {Array} prodotti - Available products for editing orders
 * @param {boolean} isLoading - Loading state
 * @param {boolean} isEmpty - Whether there are no orders
 * @param {boolean} showAsReceiptCards - If true, show orders as receipt cards (non-expandable)
 */
export function OrdersForDayList({
  selectedDate,
  ordini = [],
  onStatusChange,
  onMarkAllCompleted,
  onDeleteOrder,
  onOrderModified,
  onDateChanged,
  prodotti = [],
  isLoading = false,
  isEmpty = false,
  showAsReceiptCards = false,
}) {
  const [filterName, setFilterName] = useState('')
  const [showOnlyDaStampare, setShowOnlyDaStampare] = useState(false)
  const [isPrintingAll, setIsPrintingAll] = useState(false)
  const [printAllPdfData, setPrintAllPdfData] = useState(null)
  const [showPrintAllModal, setShowPrintAllModal] = useState(false)
  const [isRiepilogoOpen, setIsRiepilogoOpen] = useState(false)
  const [riepilogoPdfData, setRiepilogoPdfData] = useState(null)
  const [showRiepilogoModal, setShowRiepilogoModal] = useState(false)
  const [isGeneratingRiepilogo, setIsGeneratingRiepilogo] = useState(false)
  const [showReprintConfirm, setShowReprintConfirm] = useState(false)

  const formatDate = (date) => {
    try {
      return format(parseISO(date), 'dd MMMM yyyy', { locale: it })
    } catch {
      return date
    }
  }

  const dayName = format(selectedDate, 'EEEE', { locale: it }).toUpperCase()
  const totalOrders = ordini.length

  // Filter orders by client name
  const filteredOrdini = ordini.filter((o) => {
    const clientName = o.profili?.nome || ''
    return clientName.toLowerCase().includes(filterName.toLowerCase())
  })

  // Ordini non ancora stampati (completato = false)
  const ordiniDaStampare = filteredOrdini.filter((o) => !o.completato)

  // Lista effettivamente mostrata (con eventuale filtro "solo da stampare")
  const displayOrdini = showOnlyDaStampare ? ordiniDaStampare : filteredOrdini

  // Riepilogo prodotti: raggruppa per (nome + tipologia), somma le quantità
  const riepilogoProdotti = useMemo(() => {
    const map = new Map()
    filteredOrdini.forEach((ordine) => {
      ;(ordine.dettagli_ordine || []).forEach((item) => {
        const nome = (item.prodotti?.nome || item.nome_custom || 'Prodotto sconosciuto').toUpperCase()
        const tipologia = item.tipologia || 'N/A'
        const isCustom = !item.prodotti?.nome && !!item.nome_custom
        const key = `${nome}||${tipologia}`
        if (map.has(key)) {
          map.get(key).totale += Number(item.quantita)
          if (isCustom) map.get(key).custom = true
        } else {
          map.set(key, { nome, tipologia, totale: Number(item.quantita), custom: isCustom })
        }
      })
    })
    return Array.from(map.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome) || a.tipologia.localeCompare(b.tipologia)
    )
  }, [filteredOrdini])

  const handleStampaTutti = async () => {
    if (ordiniDaStampare.length === 0) return
    setIsPrintingAll(true)
    try {
      const blob = generateDayOrdersPDF(ordiniDaStampare, selectedDate)
      setPrintAllPdfData(blob)
      setShowPrintAllModal(true)
      // Segna tutti gli ordini stampati come completato
      if (onMarkAllCompleted) {
        await onMarkAllCompleted(ordiniDaStampare.map((o) => o.id))
      }
    } catch (err) {
      console.error('Errore nella generazione del PDF combinato:', err)
    } finally {
      setIsPrintingAll(false)
    }
  }

  const handleRistampaTutti = async () => {
    setShowReprintConfirm(false)
    setIsPrintingAll(true)
    try {
      const blob = generateDayOrdersPDF(filteredOrdini, selectedDate)
      setPrintAllPdfData(blob)
      setShowPrintAllModal(true)
    } catch (err) {
      console.error('Errore nella generazione del PDF per ristampa:', err)
    } finally {
      setIsPrintingAll(false)
    }
  }

  const handleGeneraRiepilogoPDF = async () => {
    setIsGeneratingRiepilogo(true)
    try {
      const blob = generateDaySummaryPDF(selectedDate, riepilogoProdotti)
      setRiepilogoPdfData(blob)
      setShowRiepilogoModal(true)
    } catch (err) {
      console.error('Errore nella generazione del PDF riepilogo:', err)
    } finally {
      setIsGeneratingRiepilogo(false)
    }
  }

  return (
    <>
    <div className="card p-4 sm:p-6">
      {/* Header */}
      <div className="mb-5">

        {/* Filter Input + Stampa Tutti */}
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filtra cliente..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="input pl-9 py-2 text-sm"
            />
          </div>
          {filteredOrdini.length > 0 && (
            ordiniDaStampare.length > 0 ? (
              <button
                onClick={handleStampaTutti}
                disabled={isPrintingAll}
                className="btn-primary flex-shrink-0 px-3 py-2 text-sm whitespace-nowrap"
              >
                <IconPrinter className="w-4 h-4" />
                {isPrintingAll ? 'Generando...' : `Stampa (${ordiniDaStampare.length})`}
              </button>
            ) : (
              <button
                onClick={() => setShowReprintConfirm(true)}
                className="btn flex-shrink-0 px-3 py-2 text-sm whitespace-nowrap bg-verde-orto-50 text-verde-orto-700 border border-verde-orto-200 hover:bg-verde-orto-100"
              >
                <IconCheckCircle className="w-4 h-4" />
                Tutti stampati
              </button>
            )
          )}
        </div>

        {/* Conferma ristampa */}
        {showReprintConfirm && (
          <div className="alert-warn mt-3">
            <p className="font-semibold text-sm mb-2.5">
              Tutti gli ordini di questa giornata sono già stati stampati. Vuoi ristamparli tutti?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRistampaTutti}
                disabled={isPrintingAll}
                className="btn bg-amber-600 text-white hover:bg-amber-700 px-3 py-1.5 text-sm"
              >
                <IconPrinter className="w-4 h-4" />
                {isPrintingAll ? 'Generando...' : 'Ristampa tutti'}
              </button>
              <button
                onClick={() => setShowReprintConfirm(false)}
                className="btn-secondary px-3 py-1.5 text-sm"
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {/* Toggle: solo da stampare */}
        {filteredOrdini.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowOnlyDaStampare((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                showOnlyDaStampare
                  ? 'bg-verde-orto-600 border-verde-orto-600 text-white'
                  : 'bg-white border-slate-300 text-slate-600 hover:border-verde-orto-400 hover:text-verde-orto-700'
              }`}
            >
              <span>{showOnlyDaStampare ? '✓' : '○'}</span>
              Solo da stampare ({ordiniDaStampare.length})
            </button>
            {showOnlyDaStampare && (
              <span className="text-xs text-slate-400 font-medium">
                — {filteredOrdini.length - ordiniDaStampare.length} già stampati nascosti
              </span>
            )}
          </div>
        )}
      </div>

      {/* Riepilogo Prodotti */}
      {filteredOrdini.length > 0 && (
        <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsRiepilogoOpen(!isRiepilogoOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <span className="font-semibold text-slate-800 text-sm">
              Riepilogo prodotti ({riepilogoProdotti.length} voci)
            </span>
            <IconChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isRiepilogoOpen ? 'rotate-180' : ''}`} />
          </button>

          {isRiepilogoOpen && (
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="overflow-x-auto mb-3 rounded-lg border border-slate-200">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Prodotto</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Totale</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Unità</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {riepilogoProdotti.map((item, i) => (
                      <tr key={i} className={item.custom ? 'bg-yellow-50' : 'bg-white'}>
                        <td className="px-3 py-2 text-slate-800 font-medium text-left">
                          {item.nome}
                          {item.custom && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-800">
                              <IconStar className="w-3 h-3" /> Fuori catalogo
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-900 text-right font-semibold tabular-nums">{item.totale}</td>
                        <td className="px-3 py-2 text-slate-500 text-left">{item.tipologia}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handleGeneraRiepilogoPDF}
                disabled={isGeneratingRiepilogo}
                className="btn-secondary w-full py-2 text-sm"
              >
                <IconDocument className="w-4 h-4" />
                {isGeneratingRiepilogo ? 'Generando...' : 'Genera PDF riepilogo'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {isEmpty || totalOrders === 0 ? (
        <div className="p-8 text-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
          <p className="text-slate-500 font-medium">
            Nessun ordine per il {dayName.toLowerCase()} {formatDate(selectedDate.toISOString())}
          </p>
        </div>
      ) : displayOrdini.length === 0 ? (
        <div className="p-8 text-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
          <p className="text-slate-500 font-medium">
            {showOnlyDaStampare
              ? 'Tutti gli ordini sono già stati stampati'
              : `Nessun ordine corrisponde al filtro "${filterName}"`}
          </p>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-3 max-h-[600px] overflow-y-auto overscroll-contain pr-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          {displayOrdini.map((ordine) => (
            <AdminOrderCard
              key={ordine.id}
              ordine={ordine}
              onStatusChange={onStatusChange}
              onDeleteOrder={onDeleteOrder}
              onOrderModified={onOrderModified}
              onDateChanged={onDateChanged}
              prodotti={prodotti}
              isLoading={isLoading}
              showAsReceiptCards={showAsReceiptCards}
            />
          ))}
        </div>
      )}
    </div>

      {/* Modale stampa tutti (senza tasto Scarica) */}
      <PDFPreviewModal
        pdfData={printAllPdfData}
        fileName={`Ordini_${format(selectedDate, 'yyyy-MM-dd')}`}
        isOpen={showPrintAllModal}
        onClose={() => { setShowPrintAllModal(false); setPrintAllPdfData(null) }}
        showDownload={false}
      />

      {/* Modale riepilogo prodotti (con Stampa e Scarica) */}
      <PDFPreviewModal
        pdfData={riepilogoPdfData}
        fileName={`Riepilogo_${format(selectedDate, 'yyyy-MM-dd')}`}
        isOpen={showRiepilogoModal}
        onClose={() => { setShowRiepilogoModal(false); setRiepilogoPdfData(null) }}
      />
    </>
  )
}
