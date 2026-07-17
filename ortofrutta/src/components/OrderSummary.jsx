import { OrderItemCard } from './OrderItemCard'
import { format } from 'date-fns'
import { IconClipboard } from './icons'

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
    <div className="md:h-[550px] h-auto flex flex-col card p-5 sm:p-6">
      <h3 className="section-title mb-5 flex items-center gap-2">
        <IconClipboard className="w-5 h-5 text-verde-orto-600" />
        Riepilogo ordine
        {items.length > 0 && (
          <span className="ml-auto badge-green">
            {items.length} {items.length === 1 ? 'prodotto' : 'prodotti'}
          </span>
        )}
      </h3>

      <div className="flex-1 space-y-2.5 mb-4 overflow-y-auto pr-1">
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
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Aggiungi dei prodotti per visualizzare il riepilogo dell'ordine.
            </p>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="border-t border-slate-200 pt-3.5 mb-4 text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Data di consegna</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">
          {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : '--/--/----'}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2.5">
        <button
          onClick={onConfirmOrder}
          disabled={isLoading || items.length === 0}
          className="btn-primary flex-1 py-3"
        >
          {isLoading ? 'Invio in corso...' : 'Conferma e ordina'}
        </button>
        <button
          onClick={onClearOrder}
          disabled={isLoading || items.length === 0}
          className="btn-danger-soft py-3"
          title="Cancella riepilogo"
        >
          Annulla
        </button>
      </div>
    </div>
  )
}
