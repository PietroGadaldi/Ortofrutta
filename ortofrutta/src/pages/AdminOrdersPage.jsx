import { useState, useEffect, useMemo } from 'react'
import { startOfDay, format } from 'date-fns'
import { it } from 'date-fns/locale'
import { HorizontalWeekSelector } from '../components/HorizontalWeekSelector'
import { OrdersForDayList } from '../components/OrdersForDayList'
import { updateOrdineStatus, deleteOrdine } from '../services/ordiniService'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../hooks/useAuth'

/**
 * AdminOrdersPage component
 * Main page for titolare to view and manage orders by date
 */
export function AdminOrdersPage() {
  const { token } = useAuth()
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()))
  const [ordini, setOrdini] = useState([])
  const [prodotti, setProdotti] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Filtro per nome cliente
  const filteredOrdini = useMemo(() => {
    if (!searchTerm.trim()) return ordini
    return ordini.filter((o) =>
      o.profili?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [ordini, searchTerm])

  // Calcolo statistiche per i riquadri
  const stats = useMemo(() => {
    return {
      totale: ordini.length,
      daStampare: ordini.filter(o => !o.completato).length
    }
  }, [ordini])

  // Fetch orders when date changes
  useEffect(() => {
    fetchOrders()
  }, [selectedDate])

  // Fetch products on mount
  useEffect(() => {
    fetchProdotti()
  }, [])

  const fetchProdotti = async () => {
    try {
      const { data, error } = await supabase
        .from('prodotti')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error
      setProdotti(data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
      // Non è critico, continua comunque
    }
  }

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

  const handleOrderModified = async () => {
    // Refresh orders after modification
    await fetchOrders()
  }

  const handleDateChanged = async (newDate) => {
    // Change the selected date to the new order date
    setSelectedDate(startOfDay(newDate))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl p-4 shadow-xl">
        <h1 className="text-2xl sm:text-4xl font-black mb-2">🏪 Gestione Ordini (Titolare)</h1>
        <p className="text-amber-100 text-sm sm:text-lg font-semibold">Visualizza e gestisci gli ordini dei tuoi clienti</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-5 bg-red-100 border-l-4 border-red-500 rounded-lg shadow-md">
          <p className="text-red-900 font-bold">⚠️ {error}</p>
        </div>
      )}

      {/* Horizontal Week Selector */}
      <HorizontalWeekSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Titolo Formattato e Riquadri Statistiche */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 sm:p-6 rounded-xl border-2 border-amber-200 shadow-sm">
        <h2 className="text-base sm:text-2xl font-black text-amber-900 uppercase">
          ORDINI DI {format(selectedDate, "EEEE d MMMM yyyy", { locale: it })}
        </h2>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-amber-50 border-2 border-amber-300 p-3 rounded-lg text-center">
            <p className="text-xs font-bold text-amber-700 uppercase">Totale ordini</p>
            <p className="text-xl sm:text-2xl font-black text-amber-900">{stats.totale}</p>
          </div>
          <div className="flex-1 md:flex-none bg-orange-50 border-2 border-orange-300 p-3 rounded-lg text-center">
            <p className="text-xs font-bold text-orange-700 uppercase">Da stampare</p>
            <p className="text-xl sm:text-2xl font-black text-orange-900">{stats.daStampare}</p>
          </div>
        </div>
      </div>


      {/* Orders List */}
      <div>
        {loading && ordini.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin mb-4">
                <div className="h-12 w-12 border-4 border-amber-300 border-t-amber-600 rounded-full mx-auto"></div>
              </div>
              <p className="text-amber-700 font-bold">Caricamento ordini...</p>
            </div>
          </div>
        ) : (
          <OrdersForDayList
            selectedDate={selectedDate}
            ordini={filteredOrdini}
            onStatusChange={handleStatusChange}
            onDeleteOrder={handleDeleteOrder}
            onOrderModified={handleOrderModified}
            onDateChanged={handleDateChanged}
            prodotti={prodotti}
            isLoading={isUpdating || loading}
            isEmpty={filteredOrdini.length === 0 && !loading}
            showAsReceiptCards={true}
          />
        )}
      </div>
    </div>
  )
}

export default AdminOrdersPage
