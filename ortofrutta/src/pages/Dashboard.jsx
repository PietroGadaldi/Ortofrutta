import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { CalendarPicker } from '../components/CalendarPicker'
import { AddProductForm } from '../components/AddProductForm'
import { OrderSummary } from '../components/OrderSummary'
import { OrdersHistory } from '../components/OrdersHistory'
import { createOrdine, updateOrdineDettagli, updateOrdineStatus, deleteOrdine, getAllOrdini } from '../services/ordiniService'
import { generateOrderPDF } from '../utils/pdfGenerator'
import { uploadOrderPDF } from '../services/pdfStorageService'
import { capitalize, WHATSAPP_NUMBER } from '../utils/constants'
import { format, addDays, startOfDay, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'

export function Dashboard() {
  const { user } = useAuth()
  
  // State for orders and products
  const [ordini, setOrdini] = useState([])
  const [prodotti, setProdotti] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [lastCreatedOrderId, setLastCreatedOrderId] = useState(null)
  const [expandedOrderId, setExpandedOrderId] = useState(null)

  const historyRef = useRef(null)
  const summaryRef = useRef(null)
  
  // State for new/editing order
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [productsInOrder, setProductsInOrder] = useState([])
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [editingItemIndex, setEditingItemIndex] = useState(null)

  // Ordine già esistente per la data selezionata (solo in fase di creazione, non modifica)
  const existingOrderForDate = useMemo(() => {
    if (!selectedDate || editingOrderId) return null
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return ordini.find((o) => o.data_ordine === dateStr) || null
  }, [ordini, selectedDate, editingOrderId])

  // Oggi selezionato ma sono già passate le 02:00 → ordine non consentito
  const isTodayAfter2AM = useMemo(() => {
    if (!selectedDate || editingOrderId) return false
    const now = new Date()
    if (!isSameDay(startOfDay(now), startOfDay(selectedDate))) return false
    return now.getHours() >= 2
  }, [selectedDate, editingOrderId])

  // Intercetta l'errore del Service Worker relativo alle estensioni Chrome,
  // svuota la cache e ricarica la pagina per risolvere il blocco.
  useEffect(() => {
    const handleCacheError = (event) => {
      const errorMsg = event.reason?.message || "";
      if (errorMsg.includes("Request scheme 'chrome-extension' is unsupported")) {
        if ('caches' in window) {
          caches.keys().then((names) => {
            return Promise.all(names.map((name) => caches.delete(name)));
          }).then(() => {
            window.location.reload();
          });
        }
      }
    };

    window.addEventListener('unhandledrejection', handleCacheError);
    return () => window.removeEventListener('unhandledrejection', handleCacheError);
  }, []);

  // Fetch user ordini and prodotti on mount
  useEffect(() => {
    fetchData()
  }, [user])

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(null), 3500)
    return () => clearTimeout(t)
  }, [success])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch prodotti
      const { data: prodData, error: prodError } = await supabase
        .from('prodotti')
        .select('*')
        .order('nome', { ascending: true })

      if (prodError) throw prodError
      setProdotti(prodData || [])

      // Fetch ordini dell'utente
      const { data: ordData, error: ordError } = await supabase
        .from('ordini')
        .select(
          `
          id,
          data_creazione,
          updated_at,
          data_ordine,
          completato,
          dettagli_ordine (
            id,
            quantita,
            tipologia,
            prodotto_id,
            nome_custom,
            prodotti (nome)
          )
        `
        )
        .eq('cliente_id', user.id)
        .order('data_creazione', { ascending: false })

      if (ordError) throw ordError
      setOrdini(ordData || [])
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Add product to order summary
  const handleAddProduct = (product) => {
    if (editingItemIndex !== null) {
      // Edit existing item
      const updated = [...productsInOrder]
      updated[editingItemIndex] = product
      setProductsInOrder(updated)
      setEditingItemIndex(null)
    } else {
      // Add new item
      setProductsInOrder([...productsInOrder, product])
    }
    setError(null)
    setSuccess(null)
    setLastCreatedOrderId(null)
  }

  // Edit product in order summary
  const handleEditItem = (index) => {
    setEditingItemIndex(index)
  }

  // Delete product from order summary
  const handleDeleteItem = (index) => {
    setProductsInOrder(productsInOrder.filter((_, i) => i !== index))
  }

  // Clear all products from order
  const handleClearOrder = () => {
    setProductsInOrder([])
    setEditingOrderId(null)
    setEditingItemIndex(null)
    setSelectedDate(new Date())
  }

  // Create or update order
  const handleConfirmOrder = async () => {
    if (productsInOrder.length === 0) {
      setError('Aggiungi almeno un prodotto prima di confermare')
      return
    }

    if (!editingOrderId && existingOrderForDate) {
      setError('Hai già un ordine per questa data. Modifica quello esistente nella cronologia per aggiungere o cambiare prodotti.')
      return
    }

    if (!editingOrderId && isTodayAfter2AM) {
      setError('Non è più possibile creare ordini per oggi: il termine delle 02:00 è scaduto. Contatta il titolare su WhatsApp.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Format date as YYYY-MM-DD string for database
      const dateString = format(selectedDate, 'yyyy-MM-dd')
      
      if (editingOrderId) {
        // Update existing order
        const { error: updateError } = await updateOrdineDettagli(
          editingOrderId,
          productsInOrder
        )
        if (updateError) throw updateError
        
        setSuccess('Ordine aggiornato con successo!')
        setEditingOrderId(null)
      } else {
        // Create new order
        const { data: newOrdine, error: createError } = await createOrdine(
          user.id,
          dateString,
          productsInOrder
        )
        if (createError) throw createError

        setSuccess('Ordine inviato con successo!')
        setLastCreatedOrderId(newOrdine.id)

        // Generate and upload PDF (non-blocking, error doesn't interrupt flow)
        if (newOrdine && user) {
          try {
            // Fetch fresh order data with client info
            const { data: orderWithClient } = await supabase
              .from('ordini')
              .select(
                `
                id,
                data_creazione,
                data_ordine,
                completato,
                profili (nome),
                dettagli_ordine (
                  id,
                  quantita,
                  tipologia,
                  prodotto_id,
                  nome_custom,
                  prodotti (nome)
                )
              `
              )
              .eq('id', newOrdine.id)
              .single()

            if (orderWithClient) {
              const pdfBlob = generateOrderPDF(orderWithClient)
              const uploadResult = await uploadOrderPDF(user.id, newOrdine.id, pdfBlob)
              if (!uploadResult.success) {
                console.warn('PDF upload warning:', uploadResult.error)
              }
            }
          } catch (pdfError) {
            console.warn('PDF generation warning (non-blocking):', pdfError.message)
            // Don't throw - order already created successfully
          }
        }
      }

      // Reset and refresh
      handleClearOrder()
      await fetchData()
      setSubmitting(false)
    } catch (err) {
      setError('Errore durante il salvataggio: ' + err.message)
      console.error(err)
      setSubmitting(false)
    }
  }

  // View last order: scroll to bottom and open details
  const handleViewLastOrder = () => {
    if (lastCreatedOrderId) {
      setExpandedOrderId(lastCreatedOrderId)
      setTimeout(() => {
        historyRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  // Load order for editing
  const handleEditOrder = (ordine) => {
    setSuccess(null)
    setLastCreatedOrderId(null)
    setEditingOrderId(ordine.id)
    
    // Parse date from ordine
    try {
      const date = new Date(ordine.data_ordine)
      setSelectedDate(date)
    } catch {
      setSelectedDate(new Date())
    }

    // Load products from dettagli_ordine
    const items = ordine.dettagli_ordine.map((dettaglio) => ({
      prodotto_id: dettaglio.prodotto_id,
      prodotto_nome: dettaglio.prodotti?.nome || dettaglio.nome_custom || '',
      quantita: dettaglio.quantita,
      tipologia: dettaglio.tipologia,
    }))
    
    setProductsInOrder(items)
    setEditingItemIndex(null)

    // Scorre fino alla sezione del riepilogo/form
    summaryRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Imposta la data dell'ordine a domani
  const handleSetTomorrow = () => {
    setSelectedDate(addDays(startOfDay(new Date()), 1))
  }

  // Carica i prodotti di un ordine passato nel riepilogo per creare un nuovo ordine
  const handleReorder = (ordine) => {
    setSuccess(null)
    setError(null)
    setLastCreatedOrderId(null)
    setEditingOrderId(null) // Fondamentale: non stiamo modificando il vecchio ordine, ma creandone uno nuovo
    
    // Filtriamo i prodotti per assicurarci che esistano ancora nel catalogo corrente
    // e formattiamo i nomi correttamente (iniziale maiuscola e resto minuscolo)
    const validItems = (ordine.dettagli_ordine || [])
      .filter((dettaglio) => prodotti.some((p) => p.id === dettaglio.prodotto_id))
      .map((dettaglio) => {
        // Recuperiamo il nome aggiornato dal catalogo per consistenza
        const prodottoCatalogo = prodotti.find((p) => p.id === dettaglio.prodotto_id)
        return {
          prodotto_id: dettaglio.prodotto_id,
          prodotto_nome: capitalize(prodottoCatalogo?.nome || dettaglio.prodotti?.nome || ''),
          quantita: dettaglio.quantita,
          tipologia: dettaglio.tipologia,
        }
      })

    if (validItems.length === 0) {
      setError("Nessuno dei prodotti di questo ordine è attualmente disponibile nel catalogo.")
      return
    }

    if (validItems.length < (ordine.dettagli_ordine?.length || 0)) {
      setError("Nota: alcuni prodotti non più disponibili nel catalogo sono stati esclusi dal riordino.")
    }
    
    setProductsInOrder(validItems)
    setEditingItemIndex(null)

    // Scorre fino alla sezione del riepilogo/form
    summaryRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Delete order
  const handleDeleteOrder = async (ordineId) => {
    setSubmitting(true)
    try {
      const { error: deleteError } = await deleteOrdine(ordineId)
      if (deleteError) throw deleteError
      
      await fetchData()
      setSubmitting(false)
    } catch (err) {
      setError('Errore durante la cancellazione: ' + err.message)
      console.error(err)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="text-center">
          <div className="inline-block mb-6">
            <div className="animate-spin">
              <div className="h-16 w-16 border-4 border-green-300 border-t-green-600 rounded-full"></div>
            </div>
          </div>
          <p className="text-green-700 font-bold text-lg">Caricamento dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-4 sm:p-8 shadow-xl">
        <h1 className="text-2xl sm:text-4xl font-black mb-2">📦 Gestione Ordini</h1>
        <p className="text-green-100 text-sm sm:text-lg font-semibold">Crea, modifica e visualizza i tuoi ordini in modo semplice e intuitivo</p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-5 bg-red-100 border-l-4 border-red-500 rounded-lg shadow-md">
          <p className="text-red-900 font-bold">⚠️ {error}</p>
        </div>
      )}

      {/* Success alert */}
      {success && (
        <div className="p-5 bg-green-100 border-l-4 border-green-500 rounded-lg shadow-md flex justify-between items-center">
          <p className="text-green-900 font-bold">✅ {success}</p>
          {success === 'Ordine inviato con successo!' && lastCreatedOrderId && (
            <button
              onClick={handleViewLastOrder}
              className="text-green-700 underline font-bold hover:text-green-900 transition-colors"
            >
              Visualizza
            </button>
          )}
        </div>
      )}

      {/* Calendar Picker Section */}
      <div>
        <CalendarPicker
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* Banner: ordine già presente per la data selezionata */}
      {!editingOrderId && existingOrderForDate && (
        <div className="p-5 bg-amber-50 border-l-4 border-amber-500 rounded-lg shadow-md">
          <p className="text-amber-900 font-bold text-sm">
            📋 Hai già un ordine per {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: it })}.
          </p>
          <p className="text-amber-800 text-sm mt-1 font-semibold">
            Per aggiungere o modificare i prodotti, usa il tasto <strong>"Modifica Ordine"</strong> presente nella cronologia qui sotto.
          </p>
          <button
            onClick={() => {
              handleEditOrder(existingOrderForDate)
            }}
            className="mt-3 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all"
          >
            ✏️ Vai all'ordine esistente
          </button>
        </div>
      )}

      {/* Banner: oggi ma oltre le 02:00 */}
      {!editingOrderId && isTodayAfter2AM && !existingOrderForDate && (
        <div className="p-5 bg-orange-50 border-l-4 border-orange-500 rounded-lg shadow-md">
          <p className="text-orange-900 font-bold text-sm">
            ⏰ Non è più possibile ordinare per oggi.
          </p>
          <p className="text-orange-800 text-sm mt-1 font-semibold leading-relaxed">
            Il termine per creare ordini per il giorno stesso è <strong>le ore 02:00 di mattina</strong>. Se hai bisogno di un ordine urgente, contatta direttamente il titolare su WhatsApp.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Salve, vorrei fare un ordine urgente per oggi.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.554 4.1 1.523 5.823L.057 23.486a.5.5 0 0 0 .612.612l5.663-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.502-.502-5.176-1.381l-.372-.217-3.863 1 1-3.863-.217-.372A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Contatta il titolare su WhatsApp
          </a>
        </div>
      )}

      {/* Form + Summary Section (Grid layout) */}
      <div ref={summaryRef} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* AddProductForm (left) */}
        <div>
          <AddProductForm
            prodotti={prodotti}
            onAddProduct={handleAddProduct}
            editingItem={
              editingItemIndex !== null
                ? productsInOrder[editingItemIndex]
                : null
            }
            onReorderLast={ordini.length > 0 ? () => handleReorder(ordini[0]) : null}
            onSetTomorrow={handleSetTomorrow}
            disabledMessage={
              !editingOrderId && existingOrderForDate
                ? '📋 Hai già un ordine per questa giornata. Per aggiungere o modificare i prodotti, usa il tasto "✏️ Vai all\'ordine esistente" qui sopra oppure "Modifica Ordine" nella cronologia.'
                : !editingOrderId && isTodayAfter2AM
                ? '⏰ Il termine per ordinare per oggi è scaduto alle 02:00. Puoi usare i tasti qui sotto per riordinare o selezionare un altro giorno.'
                : null
            }
          />
        </div>

        {/* OrderSummary (right) */}
        <div className="h-full">
          <OrderSummary
            items={productsInOrder}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onConfirmOrder={handleConfirmOrder}
            onClearOrder={handleClearOrder}
            isLoading={submitting}
            selectedDate={selectedDate}
          />
        </div>
      </div>

      {editingOrderId && (
        <div className="p-5 bg-blue-100 border-l-4 border-blue-500 rounded-lg shadow-md text-left">
          <p className="text-blue-900 font-bold">
            ℹ️ Stai modificando un ordine. Clicca "Conferma e Ordina" per salvare le modifiche.
          </p>
        </div>
      )}

      {/* Orders History Section */}
      <div ref={historyRef}>
        <OrdersHistory
          ordini={ordini}
          onEditOrder={handleEditOrder}
          onReorder={handleReorder}
          onDeleteOrder={handleDeleteOrder}
          isLoading={submitting}
          expandedOrderId={expandedOrderId}
          onToggleExpanded={setExpandedOrderId}
        />
      </div>
    </div>
  )
}

export default Dashboard
