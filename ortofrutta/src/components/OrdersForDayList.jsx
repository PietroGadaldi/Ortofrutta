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
 * @param {boolean} isLoading - Loading state
 * @param {boolean} isEmpty - Whether there are no orders
 * @param {boolean} showAsReceiptCards - If true, show orders as receipt cards (non-expandable)
 */
export function OrdersForDayList({
  selectedDate,
  ordini = [],
  onStatusChange,
  onDeleteOrder,
  isLoading = false,
  isEmpty = false,
  showAsReceiptCards = false,
}) {
  const formatDate = (date) => {
    try {
      return format(parseISO(date), 'dd MMMM yyyy', { locale: it })
    } catch {
      return date
    }
  }

  const dayName = format(selectedDate, 'EEEE', { locale: it }).toUpperCase()
  const totalOrders = ordini.length
  const ordiniDaStampare = ordini.filter(o => !o.completato).length

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-black flex items-center gap-2">
          <span className="text-3xl">📋</span> Ordini del {dayName}
        </h3>
        <div className="text-sm text-blue-900 mt-2 font-semibold">
          Data: {formatDate(selectedDate.toISOString())}
        </div>
        <div className="mt-3 flex gap-3">
          <div className="inline-block bg-blue-200 text-blue-900 px-4 py-2 rounded-full font-bold">
            Totale: <span className="text-lg">{totalOrders}</span> ordini
          </div>
          <div className="inline-block bg-orange-200 text-orange-900 px-4 py-2 rounded-full font-bold">
            Da stampare: <span className="text-lg">{ordiniDaStampare}</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {isEmpty || totalOrders === 0 ? (
        <div className="p-8 text-center bg-blue-100 border-l-4 border-blue-500 rounded-lg">
          <p className="text-black font-semibold">
            ❌ Nessun ordine per il {dayName.toLowerCase()} {formatDate(selectedDate.toISOString())}
          </p>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-4 max-h-72 overflow-y-auto">
          {ordini.map((ordine) => (
            <AdminOrderCard
              key={ordine.id}
              ordine={ordine}
              onStatusChange={onStatusChange}
              onDeleteOrder={onDeleteOrder}
              isLoading={isLoading}
              showAsReceiptCards={showAsReceiptCards}
            />
          ))}
        </div>
      )}
    </div>
  )
}
