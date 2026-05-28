import { useState, useEffect } from 'react'
import { startOfDay } from 'date-fns'
import { AgendaCalendar } from '../components/AgendaCalendar'
import { OrdersForDayList } from '../components/OrdersForDayList'
import { getOrdiniByDate, updateOrdineStatus, deleteOrdine } from '../services/ordiniService'

/**
 * AdminOrdersPage component
 * Main page for titolare to view and manage orders by date
 */
export function AdminOrdersPage() {
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
      const { data, error: fetchError } = await getOrdiniByDate(selectedDate)
      if (fetchError) throw fetchError
      setOrdini(data || [])
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
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl p-8 shadow-xl">
        <h1 className="text-4xl font-black mb-2">🏪 Gestione Ordini (Titolare)</h1>
        <p className="text-amber-100 text-lg font-semibold">Visualizza e gestisci gli ordini dei tuoi clienti</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-5 bg-red-100 border-l-4 border-red-500 rounded-lg shadow-md">
          <p className="text-red-900 font-bold">⚠️ {error}</p>
        </div>
      )}

      {/* Main Content: Calendar + Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar (Sidebar) */}
        <div className="lg:col-span-1">
          <AgendaCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>

        {/* Orders List (Main) */}
        <div className="lg:col-span-3">
          <OrdersForDayList
            selectedDate={selectedDate}
            ordini={ordini}
            onStatusChange={handleStatusChange}
            onDeleteOrder={handleDeleteOrder}
            isLoading={isUpdating}
            isEmpty={ordini.length === 0 && !loading}
          />
        </div>
      </div>
    </div>
  )
}

export default AdminOrdersPage
