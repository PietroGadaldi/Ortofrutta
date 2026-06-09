import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { AdminOrderCard } from './AdminOrderCard'

/**
 * OrdersForDayList component
 * Displays all orders for a selected date
 * @param {Date} selectedDate - Selected date
 * @param {Array} ordini - Array of orders for the date
 * @param {Function} onStatusChange - Callback when order status changes
 * @param {Function} onDeleteOrder - Callback when order is deleted
 * @param {Function} onOrderModified - Callback when order is modified
 * @param {Function} onDateChanged - Callback when order date is changed
 * @param {Array} prodotti - Available products for editing orders
 * @param {boolean} isLoading - Loading state
 * @param {boolean} isEmpty - Whether there are no orders
 * @param {boolean} showAsReceiptCards - If true, show orders as receipt cards (non-expandable)
 */
export function OrdersForDayList({
  selectedDate,
  ordini = [],
  onStatusChange,
  onDeleteOrder,
  onOrderModified,
  onDateChanged,
  prodotti = [],
  isLoading = false,
  isEmpty = false,
  showAsReceiptCards = false,
}) {
  const [filterName, setFilterName] = useState('')
  
  const formatDate = (date) => {
    try {
      return format(parseISO(date), 'dd MMMM yyyy', { locale: it })
    } catch {
      return date
    }
  }

  const dayName = format(selectedDate, 'EEEE', { locale: it }).toUpperCase()
  const totalOrders = ordini.length
  
  // Filter orders by client name
  const filteredOrdini = ordini.filter(o => {
    const clientName = o.profili?.nome || ''
    return clientName.toLowerCase().includes(filterName.toLowerCase())
  })
  
  const ordiniDaStampare = filteredOrdini.filter(o => !o.completato).length

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6">
    
        {/* Filter Input */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="🔍 Filtra per nome cliente..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-800 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Empty State */}
      {isEmpty || totalOrders === 0 ? (
        <div className="p-8 text-center bg-blue-100 border-l-4 border-blue-500 rounded-lg">
          <p className="text-black font-semibold">
            ❌ Nessun ordine per il {dayName.toLowerCase()} {formatDate(selectedDate.toISOString())}
          </p>
        </div>
      ) : filteredOrdini.length === 0 ? (
        <div className="p-8 text-center bg-yellow-100 border-l-4 border-yellow-500 rounded-lg">
          <p className="text-black font-semibold">
            ⚠️ Nessun ordine corrisponde al filtro "{filterName}"
          </p>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {filteredOrdini.map((ordine) => (
            <AdminOrderCard
              key={ordine.id}
              ordine={ordine}
              onStatusChange={onStatusChange}
              onDeleteOrder={onDeleteOrder}
              onOrderModified={onOrderModified}
              onDateChanged={onDateChanged}
              prodotti={prodotti}
              isLoading={isLoading}
              showAsReceiptCards={showAsReceiptCards}
            />
          ))}
        </div>
      )}
    </div>
  )
}
