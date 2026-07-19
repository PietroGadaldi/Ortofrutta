import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { CalendarPicker } from '../components/CalendarPicker'
import { AddProductForm } from '../components/AddProductForm'
import { OrderSummary } from '../components/OrderSummary'
import { OrdersHistory } from '../components/OrdersHistory'
import { ReorderWarningModal } from '../components/ReorderWarningModal'
import { NoticeModal } from '../components/NoticeModal'
import { createOrdine, updateOrdineDettagli, updateOrdineStatus, deleteOrdine, getAllOrdini } from '../services/ordiniService'
import { generateOrderPDF } from '../utils/pdfGenerator'
import { uploadOrderPDF } from '../services/pdfStorageService'
import { capitalize, WHATSAPP_NUMBER } from '../utils/constants'
import { format, addDays, startOfDay, isSameDay, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { IconWhatsApp } from '../components/icons'

export function Dashboard() {
  const { user } = useAuth()
  
  // State for orders and products
  const [ordini, setOrdini] = useState([])
  const [prodotti, setProdotti] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [reorderWarning, setReorderWarning] = useState(null)
  // Popup avvisi dinamici: { variant, title, message, primaryLabel?, onPrimary?, closeLabel?, afterClose? }
  const [notice, setNotice] = useState(null)

  const historyRef = useRef(null)
  const summaryRef = useRef(null)
  const calendarRef = useRef(null)
  
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

  // Chiude il popup avvisi; l'eventuale azione post-chiusura (es. scroll) parte
  // dopo che unlockBodyScroll ha ripristinato la posizione, altrimenti verrebbe annullata
  const closeNotice = () => {
    const afterClose = notice?.afterClose
    setNotice(null)
    if (afterClose) setTimeout(afterClose, 100)
  }

  // Esegue l'azione principale del popup avvisi (stesso differimento di closeNotice)
  const runNoticePrimary = () => {
    const onPrimary = notice?.onPrimary
    setNotice(null)
    if (onPrimary) setTimeout(onPrimary, 100)
  }

  // Popup "hai già un ordine per questa data": propone di modificarlo o cambiare data
  const openExistingOrderNotice = (ordineEsistente) => {
    const dataConsegna = format(parseISO(ordineEsistente.data_ordine), 'EEEE dd MMMM yyyy', { locale: it })
    setNotice({
      variant: 'warn',
      title: 'Hai già un ordine per questa data',
      message: `Hai già un ordine per ${dataConsegna}. Per aggiungere o cambiare prodotti modifica l'ordine esistente, oppure scegli un'altra data dal calendario.`,
      primaryLabel: 'Modifica ordine esistente',
      onPrimary: () => handleEditOrder(ordineEsistente),
      closeLabel: 'Cambia data',
      afterClose: () => calendarRef.current?.scrollIntoView({ behavior: 'smooth' }),
    })
  }

  // Selezione della data (dal calendario o da "Ordina per domani"):
  // avvisa subito col popup se per quel giorno esiste già un ordine
  const handleSelectDate = (date) => {
    setSelectedDate(date)
    if (editingOrderId) return
    const dateStr = format(date, 'yyyy-MM-dd')
    const esistente = ordini.find((o) => o.data_ordine === dateStr)
    if (esistente) openExistingOrderNotice(esistente)
  }

  // Create or update order
  const handleConfirmOrder = async () => {
    if (productsInOrder.length === 0) {
      setNotice({
        variant: 'warn',
        title: 'Nessun prodotto nell\'ordine',
        message: 'Aggiungi almeno un prodotto prima di confermare l\'ordine.',
        closeLabel: 'Ho capito',
      })
      return
    }

    if (!editingOrderId && existingOrderForDate) {
      openExistingOrderNotice(existingOrderForDate)
      return
    }

    if (!editingOrderId && isTodayAfter2AM) {
      setNotice({
        variant: 'warn',
        title: 'Cambia la data di consegna',
        message: 'Non è più possibile ordinare per oggi: il termine delle 02:00 è scaduto. Scegli un altro giorno dal calendario per inviare l\'ordine, oppure contatta il titolare su WhatsApp per le urgenze.',
        closeLabel: 'Scegli un\'altra data',
        afterClose: () => calendarRef.current?.scrollIntoView({ behavior: 'smooth' }),
      })
      return
    }

    setSubmitting(true)

    try {
      // Format date as YYYY-MM-DD string for database
      const dateString = format(selectedDate, 'yyyy-MM-dd')
      const dataConsegna = format(selectedDate, 'EEEE dd MMMM yyyy', { locale: it })

      // Popup di conferma con scorciatoia per visualizzare l'ordine in cronologia
      const openSuccessNotice = (title, message, ordineId) => {
        setNotice({
          variant: 'success',
          title,
          message,
          primaryLabel: 'Visualizza ordine',
          onPrimary: () => {
            setExpandedOrderId(ordineId)
            historyRef.current?.scrollIntoView({ behavior: 'smooth' })
          },
          closeLabel: 'Chiudi',
        })
      }

      if (editingOrderId) {
        // Update existing order
        const updatedOrderId = editingOrderId
        const { error: updateError } = await updateOrdineDettagli(
          editingOrderId,
          productsInOrder
        )
        if (updateError) throw updateError

        setEditingOrderId(null)
        openSuccessNotice(
          'Ordine aggiornato!',
          `Le modifiche al tuo ordine per ${dataConsegna} sono state salvate con successo.`,
          updatedOrderId
        )
      } else {
        // Create new order
        const { data: newOrdine, error: createError } = await createOrdine(
          user.id,
          dateString,
          productsInOrder
        )
        if (createError) throw createError

        openSuccessNotice(
          'Ordine inviato!',
          `Il tuo ordine per ${dataConsegna} è stato inviato con successo.`,
          newOrdine.id
        )

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
      setNotice({
        variant: 'error',
        title: 'Errore durante il salvataggio',
        message: 'Non è stato possibile salvare l\'ordine: ' + err.message,
        closeLabel: 'Chiudi',
      })
      console.error(err)
      setSubmitting(false)
    }
  }

  // Load order for editing
  const handleEditOrder = (ordine) => {
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

  // Imposta la data dell'ordine a domani; se domani ha già un ordine, avvisa col popup
  const handleSetTomorrow = () => {
    handleSelectDate(addDays(startOfDay(new Date()), 1))
  }

  // Carica i prodotti di un ordine passato nel riepilogo per creare un nuovo ordine
  const handleReorder = (ordine) => {
    setReorderWarning(null)
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
      setNotice({
        variant: 'error',
        title: 'Errore durante la cancellazione',
        message: 'Non è stato possibile annullare l\'ordine: ' + err.message,
        closeLabel: 'Chiudi',
      })
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

      {/* Calendar Picker Section */}
      <div ref={calendarRef}>
        <CalendarPicker
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      </div>

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
                ? 'Hai già un ordine per questa giornata. Per aggiungere o modificare i prodotti usa il tasto "Modifica ordine" nella cronologia qui sotto, oppure scegli un\'altra data dal calendario.'
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

      {/* Popup avvisi dinamici (ordine esistente, termine 02:00, esiti, errori) */}
      <NoticeModal
        isOpen={!!notice}
        onClose={closeNotice}
        variant={notice?.variant}
        title={notice?.title}
        message={notice?.message}
        primaryLabel={notice?.primaryLabel}
        onPrimary={notice?.onPrimary ? runNoticePrimary : undefined}
        closeLabel={notice?.closeLabel}
      />
    </div>
  )
}

export default Dashboard
