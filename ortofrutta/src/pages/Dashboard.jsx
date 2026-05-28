import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { CalendarPicker } from '../components/CalendarPicker'
import { AddProductForm } from '../components/AddProductForm'
import { OrderSummary } from '../components/OrderSummary'
import { OrdersHistory } from '../components/OrdersHistory'
import { createOrdine, updateOrdineDettagli, updateOrdineStatus, deleteOrdine, getAllOrdini } from '../services/ordiniService'
import { format } from 'date-fns'

export function Dashboard() {
  const { user } = useAuth()
  
  // State for orders and products
  const [ordini, setOrdini] = useState([])
  const [prodotti, setProdotti] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  
  // State for new/editing order
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [productsInOrder, setProductsInOrder] = useState([])
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [editingItemIndex, setEditingItemIndex] = useState(null)

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
          data_ordine,
          completato,
          dettagli_ordine (
            id,
            quantita,
            tipologia,
            prodotto_id,
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

    setSubmitting(true)
    setError(null)

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
        
        setEditingOrderId(null)
      } else {
        // Create new order
        const { data: newOrdine, error: createError } = await createOrdine(
          user.id,
          dateString,
          productsInOrder
        )
        if (createError) throw createError
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
      prodotto_nome: dettaglio.prodotti.nome,
      quantita: dettaglio.quantita,
      tipologia: dettaglio.tipologia,
    }))
    
    setProductsInOrder(items)
    setEditingItemIndex(null)

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-8 shadow-xl">
        <h1 className="text-4xl font-black mb-2">📦 Gestione Ordini</h1>
        <p className="text-green-100 text-lg font-semibold">Crea, modifica e visualizza i tuoi ordini in modo semplice e intuitivo</p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-5 bg-red-100 border-l-4 border-red-500 rounded-lg shadow-md">
          <p className="text-red-900 font-bold">⚠️ {error}</p>
        </div>
      )}

      {/* Calendar Picker Section */}
      <div>
        <CalendarPicker
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* Form + Summary Section (Grid layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AddProductForm (left, col-span 2) */}
        <div className="lg:col-span-2">
          <AddProductForm
            prodotti={prodotti}
            onAddProduct={handleAddProduct}
            editingItem={
              editingItemIndex !== null
                ? productsInOrder[editingItemIndex]
                : null
            }
          />
        </div>

        {/* OrderSummary (right, col-span 1) */}
        <div className="lg:col-span-1">
          <OrderSummary
            items={productsInOrder}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onConfirmOrder={handleConfirmOrder}
            onClearOrder={handleClearOrder}
            isLoading={submitting}
          />
        </div>
      </div>

      {editingOrderId && (
        <div className="p-5 bg-blue-100 border-l-4 border-blue-500 rounded-lg shadow-md">
          <p className="text-blue-900 font-bold">
            ℹ️ Stai modificando un ordine. Clicca "Conferma e Crea Ordine" per salvare le modifiche.
          </p>
        </div>
      )}

      {/* Orders History Section */}
      <div>
        <OrdersHistory
          ordini={ordini}
          onEditOrder={handleEditOrder}
          onDeleteOrder={handleDeleteOrder}
          isLoading={submitting}
        />
      </div>
    </div>
  )
}

export default Dashboard
