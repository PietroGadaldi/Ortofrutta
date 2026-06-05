import { OrderItemCard } from './OrderItemCard'

/**
 * OrderSummary component
 * Displays summary of products added to order before confirmation
 * @param {Array<Object>} items - Products in order [{prodotto_id, prodotto_nome, quantita, tipologia}]
 * @param {Function} onEditItem - Callback to edit a product
 * @param {Function} onDeleteItem - Callback to delete a product
 * @param {Function} onConfirmOrder - Callback to confirm and create order
 * @param {Function} onClearOrder - Callback to clear all products
 * @param {boolean} isLoading - Loading state during submission
 */
export function OrderSummary({
  items = [],
  onEditItem,
  onDeleteItem,
  onConfirmOrder,
  onClearOrder,
  isLoading = false,
}) {
  if (items.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-300 rounded-xl p-6 text-center shadow-lg">
        <p className="text-green-900 font-semibold">
          📋 Aggiungi prodotti dal modulo a sinistra per creare un ordine
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
        <span className="text-2xl">✅</span> Riepilogo Ordine
        <span className="ml-auto bg-green-200 text-green-900 px-3 py-1 rounded-full text-sm font-bold">
          {items.length} {items.length === 1 ? 'prodotto' : 'prodotti'}
        </span>
      </h3>

      <div className="space-y-3 mb-5 max-h-72 overflow-y-auto pr-2">
        {items.map((item, index) => (
          <OrderItemCard
            key={index}
            item={item}
            index={index}
            onEdit={onEditItem}
            onDelete={onDeleteItem}
          />
        ))}
      </div>

      {/* Summary stats */}
      <div className="border-t-2 border-green-300 pt-4 mb-5">
        <div className="text-sm text-green-900 font-semibold">
          Total items: {items.length}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onConfirmOrder}
          disabled={isLoading || items.length === 0}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
        >
          {isLoading ? 'Invio in corso...' : 'Conferma e Ordina'}
        </button>
        <button
          onClick={() => {
            if (window.confirm('Sei sicuro di voler cancellare tutto l\'ordine?')) {
              onClearOrder()
            }
          }}
          disabled={isLoading}
          className="py-3 px-4 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:text-gray-500 transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
          title="Cancella riepilogo"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
