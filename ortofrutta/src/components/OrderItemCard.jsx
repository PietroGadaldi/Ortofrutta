/**
 * OrderItemCard component
 * Displays a single product line item in order summary
 * @param {Object} item - {prodotto_id, prodotto_nome, quantita, tipologia}
 * @param {Function} onEdit - Callback to edit item
 * @param {Function} onDelete - Callback to delete item
 * @param {number} index - Position in list for identification
 */
export function OrderItemCard({ item, onEdit, onDelete, index }) {
  return (
    <div className="bg-white border border-green-200 rounded-lg p-3 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="font-semibold text-green-800">{item.prodotto_nome}</div>
        <div className="text-sm text-green-600">
          {item.quantita} {item.tipologia}
        </div>
      </div>

      <div className="flex gap-2 ml-3">
        <button
          onClick={() => onEdit(index)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Modifica prodotto"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(index)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Rimuovi prodotto"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
