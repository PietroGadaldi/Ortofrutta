import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { AdminOrderCard } from './AdminOrderCard'
import { PDFPreviewModal } from './PDFPreviewModal'
import { generateDayOrdersPDF, generateDaySummaryPDF } from '../utils/pdfGenerator'

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
    <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-4 sm:p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6">

        {/* Filter Input + Stampa Tutti */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="🔍 Filtra cliente..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-800 placeholder-gray-500 text-sm font-semibold"
          />
          {filteredOrdini.length > 0 && (
            ordiniDaStampare.length > 0 ? (
              <button
                onClick={handleStampaTutti}
                disabled={isPrintingAll}
                className="flex-shrink-0 px-3 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition text-sm whitespace-nowrap"
              >
                {isPrintingAll ? '⏳ Generando...' : `🖨️ Stampa (${ordiniDaStampare.length})`}
              </button>
            ) : (
              <button
                onClick={() => setShowReprintConfirm(true)}
                className="flex-shrink-0 px-3 py-2 bg-green-100 text-green-700 font-bold rounded-lg text-sm whitespace-nowrap border-2 border-green-300 hover:bg-green-200 transition"
              >
                ✅ Tutti stampati
              </button>
            )
          )}
        </div>

        {/* Conferma ristampa */}
        {showReprintConfirm && (
          <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
            <p className="text-yellow-900 font-bold text-sm mb-2">
              ⚠️ Tutti gli ordini di questa giornata sono già stati stampati. Vuoi ristamparli tutti?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRistampaTutti}
                disabled={isPrintingAll}
                className="px-3 py-1.5 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 transition text-sm"
              >
                {isPrintingAll ? '⏳ Generando...' : '🖨️ Ristampa tutti'}
              </button>
              <button
                onClick={() => setShowReprintConfirm(false)}
                className="px-3 py-1.5 bg-white text-yellow-800 font-bold rounded-lg border-2 border-yellow-400 hover:bg-yellow-100 transition text-sm"
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {/* Toggle: solo da stampare */}
        {filteredOrdini.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setShowOnlyDaStampare((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${
                showOnlyDaStampare
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-white border-orange-300 text-orange-700 hover:bg-orange-50'
              }`}
            >
              <span>{showOnlyDaStampare ? '✓' : '○'}</span>
              Solo da stampare ({ordiniDaStampare.length})
            </button>
            {showOnlyDaStampare && (
              <span className="text-xs text-gray-500 font-semibold">
                — {filteredOrdini.length - ordiniDaStampare.length} già stampati nascosti
              </span>
            )}
          </div>
        )}
      </div>

      {/* Riepilogo Prodotti */}
      {filteredOrdini.length > 0 && (
        <div className="mb-4 border-2 border-amber-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsRiepilogoOpen(!isRiepilogoOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <span className="font-bold text-amber-900 text-sm">
              📊 Riepilogo Prodotti ({riepilogoProdotti.length} voci)
            </span>
            <span className="text-amber-700 text-lg">{isRiepilogoOpen ? '▲' : '▼'}</span>
          </button>

          {isRiepilogoOpen && (
            <div className="p-4 bg-white">
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-amber-100">
                      <th className="text-left px-3 py-2 font-bold text-amber-900 border border-amber-200">Prodotto</th>
                      <th className="text-right px-3 py-2 font-bold text-amber-900 border border-amber-200">Totale</th>
                      <th className="text-left px-3 py-2 font-bold text-amber-900 border border-amber-200">Unità</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riepilogoProdotti.map((item, i) => (
                      <tr key={i} className={item.custom ? 'bg-yellow-100' : i % 2 === 0 ? 'bg-white' : 'bg-amber-50'}>
                        <td className="px-3 py-1.5 border border-amber-200 text-gray-800 font-medium">
                          {item.nome}
                          {item.custom && (
                            <span className="block text-[10px] font-bold text-yellow-800">⭐ Fuori catalogo</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 border border-amber-200 text-gray-800 text-right font-bold">{item.totale}</td>
                        <td className="px-3 py-1.5 border border-amber-200 text-gray-600">{item.tipologia}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handleGeneraRiepilogoPDF}
                disabled={isGeneratingRiepilogo}
                className="w-full py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 disabled:bg-gray-400 transition text-sm"
              >
                {isGeneratingRiepilogo ? '⏳ Generando...' : '📄 Genera PDF Riepilogo'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {isEmpty || totalOrders === 0 ? (
        <div className="p-8 text-center bg-blue-100 border-l-4 border-blue-500 rounded-lg">
          <p className="text-black font-semibold">
            ❌ Nessun ordine per il {dayName.toLowerCase()} {formatDate(selectedDate.toISOString())}
          </p>
        </div>
      ) : displayOrdini.length === 0 ? (
        <div className="p-8 text-center bg-yellow-100 border-l-4 border-yellow-500 rounded-lg">
          <p className="text-black font-semibold">
            {showOnlyDaStampare
              ? '✅ Tutti gli ordini sono già stati stampati'
              : `⚠️ Nessun ordine corrisponde al filtro "${filterName}"`}
          </p>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
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
