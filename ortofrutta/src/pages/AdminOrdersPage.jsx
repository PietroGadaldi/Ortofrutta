import { useState, useEffect } from 'react'
import { startOfDay, format } from 'date-fns'
import { HorizontalWeekSelector } from '../components/HorizontalWeekSelector'
import { OrdersForDayList } from '../components/OrdersForDayList'
import { updateOrdineStatus, deleteOrdine } from '../services/ordiniService'
import { useAuth } from '../hooks/useAuth'

/**
 * AdminOrdersPage component
 * Main page for titolare to view and manage orders by date
 */
export function AdminOrdersPage() {
  const { token } = useAuth()
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()))
  const [ordini, setOrdini] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Fetch orders when date changes
  useEffect(() => {
    fetchOrders()
  }, [selectedDate])

  const fetchOrders = async () => {
    setLoading(true)
    setError('')
    try {
      if (!token) {
        throw new Error('Token di autenticazione non disponibile')
      }

      // Call Netlify function with service role key
      const formattedDate = format(selectedDate, 'yyyy-MM-dd')
      const response = await fetch(
        `/.netlify/functions/list-clients?type=orders&date=${formattedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Errore nella richiesta')
      }

      const result = await response.json()
      setOrdini(result.data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Errore nel caricamento degli ordini')
      setOrdini([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (ordineId, newStatus) => {
    setIsUpdating(true)
    try {
      const { error } = await updateOrdineStatus(ordineId, newStatus)
      if (error) throw error

      // Update local state
      setOrdini((prevOrdini) =>
        prevOrdini.map((o) =>
          o.id === ordineId ? { ...o, completato: newStatus } : o
        )
      )
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Errore nell\'aggiornamento dello stato')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteOrder = async (ordineId) => {
    setIsUpdating(true)
    try {
      const { error } = await deleteOrdine(ordineId)
      if (error) throw error

      // Update local state
      setOrdini((prevOrdini) => prevOrdini.filter((o) => o.id !== ordineId))
    } catch (err) {
      console.error('Error deleting order:', err)
      setError('Errore nell\'eliminazione dell\'ordine')
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading && ordini.length === 0) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="text-center">
          <div className="animate-spin mb-6">
            <div className="h-16 w-16 border-4 border-amber-300 border-t-amber-600 rounded-full"></div>
          </div>
          <p className="text-amber-700 font-bold text-lg">Caricamento ordini...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl p-4 shadow-xl">
        <h1 className="text-4xl font-black mb-2">🏪 Gestione Ordini (Titolare)</h1>
        <p className="text-amber-100 text-lg font-semibold">Visualizza e gestisci gli ordini dei tuoi clienti</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-5 bg-red-100 border-l-4 border-red-500 rounded-lg shadow-md">
          <p className="text-red-900 font-bold">⚠️ {error}</p>
        </div>
      )}

      {/* Horizontal Week Selector */}
      <HorizontalWeekSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Orders List */}
      <div>
        <OrdersForDayList
          selectedDate={selectedDate}
          ordini={ordini}
          onStatusChange={handleStatusChange}
          onDeleteOrder={handleDeleteOrder}
          isLoading={isUpdating}
          isEmpty={ordini.length === 0 && !loading}
          showAsReceiptCards={true}
        />
      </div>
    </div>
  )
}

export default AdminOrdersPage
