import { OrderItemCard } from './OrderItemCard'
import { format } from 'date-fns'

/**
 * OrderSummary component
 * Displays summary of products added to order before confirmation
 * @param {Array<Object>} items - Products in order [{prodotto_id, prodotto_nome, quantita, tipologia}]
 * @param {Function} onEditItem - Callback to edit a product
 * @param {Function} onDeleteItem - Callback to delete a product
 * @param {Function} onConfirmOrder - Callback to confirm and create order
 * @param {Function} onClearOrder - Callback to clear all products
 * @param {boolean} isLoading - Loading state during submission
 * @param {Date} selectedDate - La data selezionata per l'ordine
 */
export function OrderSummary({
  items = [],
  onEditItem,
  onDeleteItem,
  onConfirmOrder,
  onClearOrder,
  isLoading = false,
  selectedDate,
}) {
  return (
    <div className="md:h-[550px] h-auto flex flex-col bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
        <span className="text-2xl">✅</span> Riepilogo Ordine
        {items.length > 0 && (
          <span className="ml-auto bg-green-200 text-green-900 px-3 py-1 rounded-full text-sm font-bold">
            {items.length} {items.length === 1 ? 'prodotto' : 'prodotti'}
          </span>
        )}
      </h3>

      <div className="flex-1 space-y-3 mb-5 overflow-y-auto pr-2">
        {[...items].reverse().map((item, index) => {
          // Calcoliamo l'indice originale per mantenere le referenze corrette per onEdit e onDelete
          const originalIndex = items.length - 1 - index;
          return (
            <OrderItemCard
              key={originalIndex}
              item={item}
              index={originalIndex}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          );
        })}
        {items.length === 0 && (
          <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-300 rounded-lg p-4 text-center shadow-md">
            <p className="text-green-900 font-semibold">
              Aggiungi dei prodotti per visualizzare il Riepilogo del Ordine.
            </p>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="border-t-2 border-green-300 pt-4 mb-5">
        <div className="text-sm text-green-900 font-semibold">
          Data di consegna selezionata: {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : '--/--/----'}
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
          onClick={onClearOrder}
          disabled={isLoading || items.length === 0}
          className="py-3 px-4 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:text-gray-500 transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
          title="Cancella riepilogo"
        >
          Annulla
        </button>
      </div>
    </div>
  )
}
