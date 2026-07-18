import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import { AddProductForm } from './AddProductForm'
import { OrderItemCard } from './OrderItemCard'
import { CalendarPicker } from './CalendarPicker'
import { updateOrdineDettagli } from '../services/ordiniService'
import { generateOrderPDF } from '../utils/pdfGenerator'
import { uploadOrderPDF } from '../services/pdfStorageService'
import { supabase } from '../services/supabaseClient'
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock'
import { IconX, IconPencil } from './icons'

/**
 * EditOrderModal component
 * Modal to edit an existing order (admin/titolare only)
 * Allows adding/editing/removing products from an order and changing order date
 * @param {Object} ordine - Order object to edit
 * @param {boolean} isOpen - Whether modal is open
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onSave - Callback when order is successfully saved
 * @param {Function} onDateChanged - Callback when order date is changed
 * @param {Array} prodotti - Available products for autocomplete
 */
export function EditOrderModal({ ordine, isOpen, onClose, onSave, onDateChanged, prodotti = [] }) {
  const [productsInOrder, setProductsInOrder] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [editingItemIndex, setEditingItemIndex] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const formRef = useRef(null)
  const productsListRef = useRef(null)
  const scrollContainerRef = useRef(null)

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

  // Initialize products and date when modal opens
  useEffect(() => {
    if (isOpen && ordine) {
      const items = (ordine.dettagli_ordine || []).map((dettaglio) => ({
        prodotto_id: dettaglio.prodotto_id,
        prodotto_nome: dettaglio.prodotti?.nome || dettaglio.nome_custom || '',
        quantita: dettaglio.quantita,
        tipologia: dettaglio.tipologia,
      }))
      setProductsInOrder(items)
      setSelectedDate(new Date(ordine.data_ordine))
      setEditingItemIndex(null)
      setError('')
      setSuccess('')
    }
  }, [isOpen, ordine])

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
    scrollTo(productsListRef)
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

  // Save order changes
  const handleSaveOrder = async () => {
    if (productsInOrder.length === 0) {
      setError('Aggiungi almeno un prodotto prima di salvare')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Update order details in database
      const { error: updateError } = await updateOrdineDettagli(
        ordine.id,
        productsInOrder
      )
      if (updateError) throw updateError

      // Check if date has changed
      const dateChanged = selectedDate && new Date(ordine.data_ordine).toDateString() !== selectedDate.toDateString()
      
      // Update order date if changed
      if (dateChanged) {
        const dateString = format(selectedDate, 'yyyy-MM-dd')
        const { error: dateError } = await supabase
          .from('ordini')
          .update({ data_ordine: dateString })
          .eq('id', ordine.id)

        if (dateError) throw dateError
      }

      // Fetch fresh order data for PDF generation
      const { data: updatedOrder, error: fetchError } = await supabase
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
        .eq('id', ordine.id)
        .single()

      if (fetchError) throw fetchError

      // Generate and upload new PDF
      try {
        const pdfBlob = generateOrderPDF(updatedOrder)
        const clienteId = ordine.cliente_id || ordine.profili?.id
        const uploadResult = await uploadOrderPDF(clienteId, ordine.id, pdfBlob)
        
        if (!uploadResult.success) {
          console.warn('PDF upload warning:', uploadResult.error)
        }
      } catch (pdfError) {
        console.warn('PDF generation warning (non-blocking):', pdfError.message)
      }

      setSuccess('Ordine aggiornato con successo!')
      setProductsInOrder([])
      setEditingItemIndex(null)

      // Call parent callbacks after brief delay for UX
      setTimeout(() => {
        if (dateChanged && onDateChanged) {
          onDateChanged(selectedDate)
        }
        onSave()
        onClose()
      }, 500)
    } catch (err) {
      setError('Errore nel salvataggio: ' + (err.message || 'Errore sconosciuto'))
      console.error('Error saving order:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // Portal su document.body: il modale DEVE uscire da qualsiasi contenitore
  // scrollabile/overflow (es. la lista ordini), altrimenti su iOS Safari
  // position:fixed viene agganciato al contenitore e il modale appare
  // "dentro la pagina" invece che sopra a tutto.
  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="modal-mobile-full bg-white shadow-2xl w-full sm:max-w-2xl sm:h-[90vh] sm:max-h-[900px] sm:rounded-xl flex flex-col overflow-hidden">
        {/* Header - Sticky */}
        <div
          className="bg-verde-orto-900 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <IconPencil className="w-5 h-5" />
              Modifica ordine
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
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
            {ordine && selectedDate && (
              <div className="card p-4">
                <p className="text-sm font-medium text-slate-500 mb-4 text-left">
                  Cliente: <span className="text-slate-900 font-semibold uppercase">{ordine.profili?.nome || 'Sconosciuto'}</span>
                </p>
                <CalendarPicker
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              </div>
            )}

            {/* Messages */}
          {error && (
            <div className="alert-error">
              {error}
            </div>
          )}
          {success && (
            <div className="alert-success">
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
            />
          </div>

          {/* Products Summary */}
          <div ref={productsListRef} className="card p-4 space-y-3">
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
            disabled={isSubmitting || productsInOrder.length === 0}
            className="btn-primary flex-[1.4] min-h-[48px] px-2 text-sm"
          >
            {isSubmitting ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
