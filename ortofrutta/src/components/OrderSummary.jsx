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
      <div className="bg-green-50 border border-green-300 rounded-lg p-6 text-center">
        <p className="text-green-700">
          📋 Aggiungi prodotti dal modulo a sinistra per creare un ordine
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-bold text-green-800 mb-4">
        ✅ Riepilogo Ordine ({items.length} {items.length === 1 ? 'prodotto' : 'prodotti'})
      </h3>

      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
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
      <div className="border-t border-green-200 pt-3 mb-4">
        <div className="text-sm text-green-700">
          <span className="font-semibold">Totale prodotti:</span> {items.length}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onConfirmOrder}
          disabled={isLoading || items.length === 0}
          className="flex-1 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '⏳ Creazione in corso...' : '🚀 Conferma e Crea Ordine'}
        </button>
        <button
          onClick={onClearOrder}
          disabled={isLoading}
          className="py-2 px-4 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
          title="Cancella riepilogo"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
