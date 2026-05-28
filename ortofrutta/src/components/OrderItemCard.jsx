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
    <div className="bg-gradient-to-r from-white to-green-50 border-2 border-green-300 rounded-lg p-4 shadow-md flex items-center justify-between hover:shadow-lg hover:border-green-400 transition-all">
      <div className="flex-1 text-left">
        <div className="font-bold text-green-900 text-sm">{item.prodotto_nome}</div>
        <div className="text-xs text-green-700 mt-1 font-semibold">
          {item.quantita} {item.tipologia}
        </div>
      </div>

      <div className="flex gap-2 ml-4">
        <button
          onClick={() => onEdit(index)}
          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all hover:scale-110"
          title="Modifica prodotto"
        >
          ✏️
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Sei sicuro di voler eliminare "${item.prodotto_nome}" dall\'ordine?`)) {
              onDelete(index)
            }
          }}
          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all hover:scale-110"
          title="Rimuovi prodotto"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
