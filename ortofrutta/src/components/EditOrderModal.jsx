import { useState, useEffect, useMemo } from 'react'
import { AddProductForm } from './AddProductForm'
import { OrderItemCard } from './OrderItemCard'
import { updateOrdineDettagli } from '../services/ordiniService'
import { generateOrderPDF } from '../utils/pdfGenerator'
import { uploadOrderPDF } from '../services/pdfStorageService'
import { supabase } from '../services/supabaseClient'

/**
 * EditOrderModal component
 * Modal to edit an existing order (admin/titolare only)
 * Allows adding/editing/removing products from an order
 * @param {Object} ordine - Order object to edit
 * @param {boolean} isOpen - Whether modal is open
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onSave - Callback when order is successfully saved
 * @param {Array} prodotti - Available products for autocomplete
 */
export function EditOrderModal({ ordine, isOpen, onClose, onSave, prodotti = [] }) {
  const [productsInOrder, setProductsInOrder] = useState([])
  const [editingItemIndex, setEditingItemIndex] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Initialize products when modal opens
  useEffect(() => {
    if (isOpen && ordine) {
      const items = (ordine.dettagli_ordine || []).map((dettaglio) => ({
        prodotto_id: dettaglio.prodotto_id,
        prodotto_nome: dettaglio.prodotti?.nome || '',
        quantita: dettaglio.quantita,
        tipologia: dettaglio.tipologia,
      }))
      setProductsInOrder(items)
      setEditingItemIndex(null)
      setError('')
      setSuccess('')
    }
  }, [isOpen, ordine])

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
    setError('')
    setSuccess('')
  }

  // Edit product in order summary
  const handleEditItem = (index) => {
    setEditingItemIndex(index)
  }

  // Delete product from order summary
  const handleDeleteItem = (index) => {
    setProductsInOrder(productsInOrder.filter((_, i) => i !== index))
  }

  // Clear all products
  const handleClearOrder = () => {
    setProductsInOrder([])
    setEditingItemIndex(null)
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

      // Call parent callback after brief delay for UX
      setTimeout(() => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 sticky top-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              ✏️ Modifica Ordine
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white text-2xl leading-none hover:opacity-80 disabled:opacity-50 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Info */}
          {ordine && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Cliente:</span> {ordine.profili?.nome || 'Sconosciuto'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold">Ordine per:</span> {new Date(ordine.data_ordine).toLocaleDateString('it-IT')}
              </p>
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
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <h3 className="font-bold text-green-900 mb-4">📦 Aggiungi Prodotto</h3>
            <AddProductForm
              prodotti={prodotti}
              onAddProduct={handleAddProduct}
              editingItem={editingItemIndex !== null ? productsInOrder[editingItemIndex] : null}
            />
          </div>

          {/* Products Summary */}
          <div className="space-y-3">
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

          {/* Action Buttons */}
          <div className="border-t pt-6 flex gap-3">
            <button
              onClick={handleClearOrder}
              disabled={isSubmitting || productsInOrder.length === 0}
              className="flex-1 py-3 px-4 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 disabled:bg-gray-300 transition-all"
            >
              🗑️ Svuota
            </button>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 disabled:bg-gray-300 transition-all"
            >
              ❌ Annulla
            </button>
            <button
              onClick={handleSaveOrder}
              disabled={isSubmitting || productsInOrder.length === 0}
              className="flex-1 py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-all"
            >
              {isSubmitting ? '⏳ Salvataggio...' : '✅ Salva Modifiche'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
