import { useState, useEffect, useMemo, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { AddProductForm } from './AddProductForm'
import { OrderItemCard } from './OrderItemCard'
import { CalendarPicker } from './CalendarPicker'
import { updateOrdineDettagli } from '../services/ordiniService'
import { generateOrderPDF } from '../utils/pdfGenerator'
import { uploadOrderPDF } from '../services/pdfStorageService'
import { supabase } from '../services/supabaseClient'

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

  // Blocca scroll del body quando il modal è aperto (iOS fix)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl max-w-2xl w-full h-[95vh] sm:h-[90vh] flex flex-col">
        {/* Header - Sticky */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 border-b-2 border-blue-800 rounded-t-2xl sm:rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              ✏️ Modifica Ordine
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white text-2xl leading-none hover:opacity-80 disabled:opacity-50 transition-all p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Order Info - Client and Date Selection */}
            {ordine && selectedDate && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-4">
                  👤 Cliente: <span className="text-blue-900">{ordine.profili?.nome || 'Sconosciuto'}</span>
                </p>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  📅 Data dell'ordine
                </h3>
                <CalendarPicker 
                  selectedDate={selectedDate} 
                  onSelectDate={setSelectedDate}
                />
              </div>
            )}

            {/* Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Add Product Form */}
          <div ref={formRef} className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <h3 className="font-bold text-green-900 mb-4">📦 Aggiungi Prodotto</h3>
            <AddProductForm
              prodotti={prodotti}
              onAddProduct={handleAddProduct}
              editingItem={editingItemIndex !== null ? productsInOrder[editingItemIndex] : null}
              isAdminMode={true}
            />
          </div>

          {/* Products Summary */}
          <div ref={productsListRef} className="space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span>📋</span> Prodotti nell'ordine
              {productsInOrder.length > 0 && (
                <span className="ml-auto bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-sm font-bold">
                  {productsInOrder.length}
                </span>
              )}
            </h3>

            {productsInOrder.length === 0 ? (
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 text-center text-gray-500">
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
        <div className="border-t-2 border-gray-300 bg-white px-4 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={handleClearOrder}
            disabled={isSubmitting || productsInOrder.length === 0}
            className="flex-1 py-2 px-3 bg-gray-500 text-white text-sm font-bold rounded-lg hover:bg-gray-600 disabled:bg-gray-300 transition-all"
          >
            🗑️ Svuota
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2 px-3 bg-gray-400 text-white text-sm font-bold rounded-lg hover:bg-gray-500 disabled:bg-gray-300 transition-all"
          >
            ❌ Annulla
          </button>
          <button
            onClick={handleSaveOrder}
            disabled={isSubmitting || productsInOrder.length === 0}
            className="flex-1 py-2 px-3 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-all"
          >
            {isSubmitting ? '⏳ Salvataggio...' : '✅ Salva Modifiche'}
          </button>
        </div>
      </div>
    </div>
  )
}
