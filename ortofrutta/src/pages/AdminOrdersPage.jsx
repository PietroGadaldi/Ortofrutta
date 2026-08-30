import { useState, useEffect, useMemo } from 'react'
import { startOfDay, format } from 'date-fns'
import { it } from 'date-fns/locale'
import { HorizontalWeekSelector } from '../components/HorizontalWeekSelector'
import { OrdersForDayList } from '../components/OrdersForDayList'
import { OrderFormModal } from '../components/OrderFormModal'
import { updateOrdineStatus, deleteOrdine } from '../services/ordiniService'
import { getClientListBasic } from '../services/profiliService'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { IconPlus } from '../components/icons'

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
  const [clienti, setClienti] = useState([])
  const [loadingClienti, setLoadingClienti] = useState(false)
  const [errorClienti, setErrorClienti] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  // Lista clienti: caricata alla prima apertura del modale "Nuovo ordine",
  // che è l'unico punto in cui serve scegliere l'intestatario dell'ordine
  const fetchClienti = async () => {
    setLoadingClienti(true)
    setErrorClienti('')
    try {
      const { data, error: clientiError } = await getClientListBasic()
      if (clientiError) throw new Error(clientiError.message)
      setClienti(data || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
      setErrorClienti('Impossibile caricare la lista clienti. Chiudi la finestra e riprova.')
      setClienti([])
    } finally {
      setLoadingClienti(false)
    }
  }

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

  const handleMarkAllCompleted = async (ordineIds) => {
    setIsUpdating(true)
    try {
      await Promise.all(ordineIds.map((id) => updateOrdineStatus(id, true)))
      setOrdini((prev) =>
        prev.map((o) => (ordineIds.includes(o.id) ? { ...o, completato: true } : o))
      )
    } catch (err) {
      console.error('Error marking all as completed:', err)
      setError('Errore nell\'aggiornamento degli stati')
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

  // Apre il modale di creazione, ricaricando i clienti se il primo tentativo era fallito
  const handleOpenCreateModal = () => {
    if (!loadingClienti && (errorClienti || clienti.length === 0)) {
      fetchClienti()
    }
    setShowCreateModal(true)
  }

  const handleDateChanged = async (newDate) => {
    // Change the selected date to the new order date
    setSelectedDate(startOfDay(newDate))
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Gestione ordini</h1>
          <p className="page-subtitle">Crea, visualizza e gestisci gli ordini dei tuoi clienti</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="btn-primary w-full sm:w-auto min-h-[44px] flex-shrink-0"
        >
          <IconPlus className="w-4 h-4" />
          Nuovo ordine
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {/* Horizontal Week Selector */}
      <HorizontalWeekSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Titolo Formattato e Riquadri Statistiche */}
      <div className="card flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 sm:p-5">
        <h2 className="text-sm sm:text-lg font-bold text-slate-900 uppercase tracking-tight text-left">
          Ordini di {format(selectedDate, "EEEE d MMMM yyyy", { locale: it })}
        </h2>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none md:min-w-[120px] rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Totale ordini</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">{stats.totale}</p>
          </div>
          <div className="flex-1 md:flex-none md:min-w-[120px] rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-center">
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">Da stampare</p>
            <p className="text-xl font-bold text-amber-800 tabular-nums">{stats.daStampare}</p>
          </div>
        </div>
      </div>


      {/* Orders List */}
      <div>
        {loading && ordini.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-slate-500 font-medium">Caricamento ordini...</p>
            </div>
          </div>
        ) : (
          <OrdersForDayList
            selectedDate={selectedDate}
            ordini={filteredOrdini}
            onStatusChange={handleStatusChange}
            onMarkAllCompleted={handleMarkAllCompleted}
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

      {/* Modale creazione nuovo ordine per un cliente */}
      <OrderFormModal
        mode="create"
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleOrderModified}
        onDateChanged={handleDateChanged}
        prodotti={prodotti}
        clienti={clienti}
        clientiLoading={loadingClienti}
        clientiError={errorClienti}
        defaultDate={selectedDate}
      />
    </div>
  )
}

export default AdminOrdersPage
