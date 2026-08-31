import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { format, addDays, startOfDay } from 'date-fns'
import { AddProductForm } from './AddProductForm'
import { OrderItemCard } from './OrderItemCard'
import { CalendarPicker } from './CalendarPicker'
import { ClientSelect } from './ClientSelect'
import { createOrdine, updateOrdineDettagli } from '../services/ordiniService'
import { generateOrderPDF } from '../utils/pdfGenerator'
import { uploadOrderPDF } from '../services/pdfStorageService'
import { supabase } from '../services/supabaseClient'
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock'
import { hasPointerFine } from '../utils/device'
import { IconX, IconPencil, IconPlus } from './icons'

// Campi necessari alla generazione del PDF dell'ordine
const ORDER_PDF_SELECT = `
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

/**
 * OrderFormModal component
 * Modale del titolare per creare un nuovo ordine o modificarne uno esistente.
 * In modalità "create" aggiunge la scelta del cliente, per il resto le due
 * modalità condividono form prodotti, calendario e salvataggio.
 * @param {'edit'|'create'} mode - Modalità del modale
 * @param {Object} ordine - Ordine da modificare (solo in mode="edit")
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {Function} onClose - Callback di chiusura
 * @param {Function} onSave - Callback dopo il salvataggio andato a buon fine
 * @param {Function} onDateChanged - Callback quando la data dell'ordine cambia
 * @param {Array} prodotti - Prodotti disponibili per l'autocomplete
 * @param {Array} clienti - Clienti selezionabili (solo in mode="create")
 * @param {boolean} clientiLoading - Caricamento della lista clienti in corso
 * @param {string} clientiError - Errore nel caricamento della lista clienti
 * @param {Date} defaultDate - Data preselezionata (solo in mode="create")
 */
export function OrderFormModal({
  mode = 'edit',
  ordine = null,
  isOpen,
  onClose,
  onSave,
  onDateChanged,
  prodotti = [],
  clienti = [],
  clientiLoading = false,
  clientiError = '',
  defaultDate = null,
}) {
  const isCreate = mode === 'create'

  const [productsInOrder, setProductsInOrder] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [clienteId, setClienteId] = useState(null)
  const [hasExistingOrder, setHasExistingOrder] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const formRef = useRef(null)
  const scrollContainerRef = useRef(null)

  const selectedCliente = useMemo(
    () => clienti.find((c) => c.id === clienteId) || null,
    [clienti, clienteId]
  )

  const scrollTo = (targetRef) => {
    setTimeout(() => {
      const container = scrollContainerRef.current
      const target = targetRef.current
      if (!container || !target) return
      const containerRect = container.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      container.scrollTo({
        top: container.scrollTop + targetRect.top - containerRect.top - 12,
        behavior: 'smooth',
      })
    }, 60)
  }

  // Blocca scroll del body quando il modal è aperto (iOS fix:
  // position:fixed sul body, altrimenti su iPhone la pagina dietro scorre)
  useEffect(() => {
    if (isOpen) {
      lockBodyScroll()
      return () => unlockBodyScroll()
    }
  }, [isOpen])

  // Chiusura con Esc (il focus resta nel modale, che copre l'intera viewport)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  // Inizializza prodotti, data e cliente all'apertura del modale
  useEffect(() => {
    if (!isOpen) return

    if (isCreate) {
      setProductsInOrder([])
      setSelectedDate(defaultDate ? new Date(defaultDate) : new Date())
      setClienteId(null)
    } else if (ordine) {
      const items = (ordine.dettagli_ordine || []).map((dettaglio) => ({
        prodotto_id: dettaglio.prodotto_id,
        prodotto_nome: dettaglio.prodotti?.nome || dettaglio.nome_custom || '',
        quantita: dettaglio.quantita,
        tipologia: dettaglio.tipologia,
      }))
      setProductsInOrder(items)
      setSelectedDate(new Date(ordine.data_ordine))
      setClienteId(ordine.cliente_id || null)
    }

    setHasExistingOrder(false)
    setEditingItemIndex(null)
    setError('')
    setSuccess('')
  }, [isOpen, isCreate, ordine, defaultDate])

  // In creazione: avvisa (senza bloccare) se il cliente ha già un ordine per la data scelta.
  // Il valore viene aggiornato solo con l'esito della query; il reset iniziale
  // avviene all'apertura del modale.
  useEffect(() => {
    if (!isOpen || !isCreate || !clienteId || !selectedDate) return

    let cancelled = false

    const checkExisting = async () => {
      const { data, error: checkError } = await supabase
        .from('ordini')
        .select('id')
        .eq('cliente_id', clienteId)
        .eq('data_ordine', format(selectedDate, 'yyyy-MM-dd'))
        .limit(1)

      if (cancelled) return
      if (checkError) {
        console.warn('Controllo ordine esistente non riuscito:', checkError.message)
        setHasExistingOrder(false)
        return
      }
      setHasExistingOrder((data || []).length > 0)
    }

    checkExisting()
    return () => {
      cancelled = true
    }
  }, [isOpen, isCreate, clienteId, selectedDate])

  // Add product to order summary
  const handleAddProduct = (product) => {
    if (editingItemIndex !== null) {
      const updated = [...productsInOrder]
      updated[editingItemIndex] = product
      setProductsInOrder(updated)
      setEditingItemIndex(null)
    } else {
      setProductsInOrder([...productsInOrder, product])
    }
    setError('')
    setSuccess('')
  }

  // Edit product in order summary
  const handleEditItem = (index) => {
    setEditingItemIndex(index)
    scrollTo(formRef)
  }

  // Delete product from order summary
  const handleDeleteItem = (index) => {
    if (window.confirm('Sei sicuro di voler eliminare questo prodotto dall\'ordine?')) {
      setProductsInOrder(productsInOrder.filter((_, i) => i !== index))
    }
  }

  // Clear all products
  const handleClearOrder = () => {
    if (window.confirm('Sei sicuro di voler svuotare completamente l\'ordine? Tutti i prodotti verranno rimossi.')) {
      setProductsInOrder([])
      setEditingItemIndex(null)
    }
  }

  /**
   * Rigenera il PDF dell'ordine e lo carica sullo Storage (non bloccante).
   * La RLS su "profili" consente di leggere solo il proprio profilo: come
   * titolare la join sull'ordine torna null, quindi passiamo i dati del
   * cliente già disponibili nella lista/ordine.
   */
  const generateAndUploadPDF = async (ordineId, targetClienteId, profiloFallback) => {
    try {
      const { data: freshOrder, error: fetchError } = await supabase
        .from('ordini')
        .select(ORDER_PDF_SELECT)
        .eq('id', ordineId)
        .single()

      if (fetchError) throw fetchError

      const pdfBlob = generateOrderPDF({
        ...freshOrder,
        profili: freshOrder.profili || profiloFallback || null,
      })
      const uploadResult = await uploadOrderPDF(targetClienteId, ordineId, pdfBlob)

      if (!uploadResult.success) {
        console.warn('PDF upload warning:', uploadResult.error)
      }
    } catch (pdfError) {
      console.warn('PDF generation warning (non-blocking):', pdfError.message)
    }
  }

  // Crea un nuovo ordine per il cliente selezionato
  const handleCreateOrder = async () => {
    const dateString = format(selectedDate, 'yyyy-MM-dd')

    const { data: newOrdine, error: createError } = await createOrdine(
      clienteId,
      dateString,
      productsInOrder
    )
    if (createError) throw createError

    await generateAndUploadPDF(newOrdine.id, clienteId, selectedCliente)

    return { dateChanged: !defaultDate || new Date(defaultDate).toDateString() !== selectedDate.toDateString() }
  }

  // Salva le modifiche a un ordine esistente
  const handleUpdateOrder = async () => {
    const { error: updateError } = await updateOrdineDettagli(ordine.id, productsInOrder)
    if (updateError) throw updateError

    const dateChanged =
      selectedDate && new Date(ordine.data_ordine).toDateString() !== selectedDate.toDateString()

    if (dateChanged) {
      const { error: dateError } = await supabase
        .from('ordini')
        .update({ data_ordine: format(selectedDate, 'yyyy-MM-dd') })
        .eq('id', ordine.id)

      if (dateError) throw dateError
    }

    await generateAndUploadPDF(
      ordine.id,
      ordine.cliente_id || ordine.profili?.id,
      ordine.profili
    )

    return { dateChanged }
  }

  // Save order (create or update)
  const handleSaveOrder = async () => {
    if (isCreate && !clienteId) {
      setError('Seleziona il cliente per cui stai creando l\'ordine')
      return
    }

    if (productsInOrder.length === 0) {
      setError('Aggiungi almeno un prodotto prima di salvare')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const { dateChanged } = isCreate ? await handleCreateOrder() : await handleUpdateOrder()

      setSuccess(isCreate ? 'Ordine creato con successo!' : 'Ordine aggiornato con successo!')
      setProductsInOrder([])
      setEditingItemIndex(null)

      // Call parent callbacks after brief delay for UX.
      // Se la data è cambiata basta onDateChanged: spostandosi sul nuovo giorno
      // la pagina ricarica già gli ordini (due fetch in parallelo si sovrapporrebbero).
      setTimeout(() => {
        if (dateChanged && onDateChanged) {
          onDateChanged(selectedDate)
        } else {
          onSave()
        }
        onClose()
      }, 500)
    } catch (err) {
      setError(
        (isCreate ? 'Errore nella creazione: ' : 'Errore nel salvataggio: ') +
          (err.message || 'Errore sconosciuto')
      )
      console.error('Error saving order:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null
  if (!isCreate && !ordine) return null

  const canSave = !isSubmitting && productsInOrder.length > 0 && (!isCreate || !!clienteId)

  // Portal su document.body: il modale DEVE uscire da qualsiasi contenitore
  // scrollabile/overflow (es. la lista ordini), altrimenti su iOS Safari
  // position:fixed viene agganciato al contenitore e il modale appare
  // "dentro la pagina" invece che sopra a tutto.
  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isCreate ? 'Nuovo ordine' : 'Modifica ordine'}
        className="modal-mobile-full bg-white shadow-lg w-full sm:max-w-2xl sm:h-[90vh] sm:max-h-[900px] sm:rounded-xl flex flex-col overflow-hidden"
      >
        {/* Header - Sticky */}
        <div
          className="bg-verde-orto-900 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              {isCreate ? <IconPlus className="w-5 h-5" /> : <IconPencil className="w-5 h-5" />}
              {isCreate ? 'Nuovo ordine' : 'Modifica ordine'}
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Chiudi"
              className="btn-icon w-11 h-11 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-slate-50"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Order Info - Client and Date Selection */}
            {selectedDate && (
              <div className="card p-4 space-y-4">
                {isCreate ? (
                  <ClientSelect
                    clienti={clienti}
                    value={clienteId}
                    onChange={setClienteId}
                    isLoading={clientiLoading}
                    loadError={clientiError}
                    disabled={isSubmitting}
                    autoFocus={hasPointerFine()}
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-500 text-left">
                    Cliente: <span className="text-slate-900 font-semibold uppercase">{ordine.profili?.nome || 'Sconosciuto'}</span>
                  </p>
                )}

                {isCreate && hasExistingOrder && (
                  <div className="alert-warn">
                    Questo cliente ha già un ordine per la data scelta. Creandone un altro
                    risulteranno due ordini separati: se vuoi integrare quello esistente,
                    chiudi e usa "Modifica" sulla sua scheda.
                  </div>
                )}

                <CalendarPicker
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  autoFocus={!isCreate && hasPointerFine()}
                />
              </div>
            )}

            {/* Messages */}
          {error && (
            <div className="alert-error" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="alert-success" role="status">
              {success}
            </div>
          )}

          {/* Add Product Form */}
          <div ref={formRef}>
            <AddProductForm
              prodotti={prodotti}
              onAddProduct={handleAddProduct}
              editingItem={editingItemIndex !== null ? productsInOrder[editingItemIndex] : null}
              isAdminMode={true}
              onSetTomorrow={
                isCreate ? () => setSelectedDate(addDays(startOfDay(new Date()), 1)) : null
              }
            />
          </div>

          {/* Products Summary */}
          <div className="card p-4 space-y-3">
            <h3 className="section-title flex items-center gap-2">
              Prodotti nell'ordine
              {productsInOrder.length > 0 && (
                <span className="ml-auto badge-green">
                  {productsInOrder.length}
                </span>
              )}
            </h3>

            {productsInOrder.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500 font-medium">
                Nessun prodotto aggiunto. Aggiungi prodotti usando il modulo sopra.
              </div>
            ) : (
              <div className="space-y-2">
                {productsInOrder.map((item, index) => (
                  <OrderItemCard
                    key={index}
                    item={item}
                    index={index}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div
          className="border-t border-slate-200 bg-white px-4 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-2.5 flex-shrink-0"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={handleClearOrder}
            disabled={isSubmitting || productsInOrder.length === 0}
            className="btn-danger-soft flex-1 min-h-[48px] px-2 text-sm"
          >
            Svuota
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary flex-1 min-h-[48px] px-2 text-sm"
          >
            Annulla
          </button>
          <button
            onClick={handleSaveOrder}
            disabled={!canSave}
            aria-busy={isSubmitting}
            className="btn-primary flex-[1.4] min-h-[48px] px-2 text-sm"
          >
            {isSubmitting
              ? isCreate
                ? 'Creazione...'
                : 'Salvataggio...'
              : isCreate
              ? 'Crea ordine'
              : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
