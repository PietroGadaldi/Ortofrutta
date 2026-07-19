import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { CalendarPicker } from '../components/CalendarPicker'
import { AddProductForm } from '../components/AddProductForm'
import { OrderSummary } from '../components/OrderSummary'
import { OrdersHistory } from '../components/OrdersHistory'
import { ReorderWarningModal } from '../components/ReorderWarningModal'
import { createOrdine, updateOrdineDettagli, updateOrdineStatus, deleteOrdine, getAllOrdini } from '../services/ordiniService'
import { generateOrderPDF } from '../utils/pdfGenerator'
import { uploadOrderPDF } from '../services/pdfStorageService'
import { capitalize, WHATSAPP_NUMBER } from '../utils/constants'
import { format, addDays, startOfDay, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { IconWhatsApp, IconPencil } from '../components/icons'

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
  const [reorderWarning, setReorderWarning] = useState(null)

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
                profili (nome, provenienza),
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
    setReorderWarning(null)
    setLastCreatedOrderId(null)
    setEditingOrderId(null) // Fondamentale: non stiamo modificando il vecchio ordine, ma creandone uno nuovo

    // Un prodotto di catalogo è riordinabile solo se esiste ancora ED è attivo;
    // i prodotti fuori catalogo (prodotto_id null) restano sempre riordinabili
    const isDisponibile = (dettaglio) =>
      dettaglio.prodotto_id
        ? prodotti.some((p) => p.id === dettaglio.prodotto_id && p.attivo !== false)
        : !!dettaglio.nome_custom

    const dettagli = ordine.dettagli_ordine || []

    // Manteniamo i prodotti disponibili; formattiamo i nomi (iniziale maiuscola)
    const validItems = dettagli
      .filter(isDisponibile)
      .map((dettaglio) => {
        if (!dettaglio.prodotto_id) {
          // Prodotto fuori catalogo: riportiamo il nome custom così com'è
          return {
            prodotto_id: null,
            prodotto_nome: dettaglio.nome_custom,
            quantita: dettaglio.quantita,
            tipologia: dettaglio.tipologia,
          }
        }
        // Recuperiamo il nome aggiornato dal catalogo per consistenza
        const prodottoCatalogo = prodotti.find((p) => p.id === dettaglio.prodotto_id)
        return {
          prodotto_id: dettaglio.prodotto_id,
          prodotto_nome: capitalize(prodottoCatalogo?.nome || dettaglio.prodotti?.nome || ''),
          quantita: dettaglio.quantita,
          tipologia: dettaglio.tipologia,
        }
      })

    const prodottiEsclusi = dettagli
      .filter((dettaglio) => !isDisponibile(dettaglio))
      .map((dettaglio) => (dettaglio.prodotti?.nome || dettaglio.nome_custom || 'prodotto rimosso').toUpperCase())

    if (validItems.length === 0) {
      // Nessun prodotto disponibile: il riordino viene annullato, avvisiamo col popup
      setReorderWarning({ prodottiEsclusi, riordinoEseguito: false })
      return
    }

    setProductsInOrder(validItems)
    setEditingItemIndex(null)

    if (prodottiEsclusi.length > 0) {
      // Il popup avvisa dei prodotti esclusi; lo scroll al riepilogo
      // avviene alla sua chiusura (vedi handleCloseReorderWarning)
      setReorderWarning({ prodottiEsclusi, riordinoEseguito: true })
    } else {
      // Scorre fino alla sezione del riepilogo/form
      summaryRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Chiusura del popup riordino: dopo "Ho capito" scorre al riepilogo del nuovo ordine
  const handleCloseReorderWarning = () => {
    const riordinoEseguito = reorderWarning?.riordinoEseguito
    setReorderWarning(null)
    if (riordinoEseguito) {
      // Attende che unlockBodyScroll ripristini la posizione salvata
      // prima di scorrere, altrimenti lo scroll verrebbe annullato
      setTimeout(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
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
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Caricamento dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">I miei ordini</h1>
        <p className="page-subtitle">Crea, modifica e consulta i tuoi ordini</p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {/* Success alert */}
      {success && (
        <div className="alert-success flex justify-between items-center gap-3">
          <span>{success}</span>
          {success === 'Ordine inviato con successo!' && lastCreatedOrderId && (
            <button
              onClick={handleViewLastOrder}
              className="flex-shrink-0 font-semibold text-verde-orto-700 underline hover:text-verde-orto-900 transition-colors"
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
        <div className="alert-warn">
          <p className="font-semibold text-sm">
            Hai già un ordine per {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: it })}.
          </p>
          <p className="text-sm mt-1">
            Per aggiungere o modificare i prodotti, usa il tasto <strong>"Modifica ordine"</strong> presente nella cronologia qui sotto.
          </p>
          <button
            onClick={() => {
              handleEditOrder(existingOrderForDate)
            }}
            className="mt-3 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors active:scale-[0.98]"
          >
            <IconPencil className="w-4 h-4" />
            Vai all'ordine esistente
          </button>
        </div>
      )}

      {/* Banner: oggi ma oltre le 02:00 */}
      {!editingOrderId && isTodayAfter2AM && !existingOrderForDate && (
        <div className="alert-warn">
          <p className="font-semibold text-sm">
            Non è più possibile ordinare per oggi.
          </p>
          <p className="text-sm mt-1 leading-relaxed">
            Il termine per creare ordini per il giorno stesso è <strong>le ore 02:00 di mattina</strong>. Se hai bisogno di un ordine urgente, contatta direttamente il titolare su WhatsApp.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Salve, vorrei fare un ordine urgente per oggi.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1eb958] text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors active:scale-[0.98]"
          >
            <IconWhatsApp className="w-4 h-4 flex-shrink-0" />
            Contatta il titolare su WhatsApp
          </a>
        </div>
      )}

      {/* Form + Summary Section (Grid layout) */}
      <div ref={summaryRef} className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
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
                ? 'Hai già un ordine per questa giornata. Per aggiungere o modificare i prodotti, usa il tasto "Vai all\'ordine esistente" qui sopra oppure "Modifica ordine" nella cronologia.'
                : !editingOrderId && isTodayAfter2AM
                ? 'Il termine per ordinare per oggi è scaduto alle 02:00. Puoi usare i tasti qui sotto per riordinare o selezionare un altro giorno.'
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
        <div className="alert-info">
          <p className="font-semibold">
            Stai modificando un ordine. Clicca "Conferma e ordina" per salvare le modifiche.
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

      {/* Popup prodotti non disponibili dopo "Ripeti ordine" */}
      <ReorderWarningModal
        isOpen={!!reorderWarning}
        onClose={handleCloseReorderWarning}
        prodottiEsclusi={reorderWarning?.prodottiEsclusi || []}
        riordinoEseguito={reorderWarning?.riordinoEseguito ?? true}
      />
    </div>
  )
}

export default Dashboard
