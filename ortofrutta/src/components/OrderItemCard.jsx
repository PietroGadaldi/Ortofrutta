import { IconPencil, IconX, IconStar } from './icons'

/**
 * OrderItemCard component
 * Displays a single product line item in order summary
 * @param {Object} item - {prodotto_id, prodotto_nome, quantita, tipologia}
 * @param {Function} onEdit - Callback to edit item
 * @param {Function} onDelete - Callback to delete item
 * @param {number} index - Position in list for identification
 */
export function OrderItemCard({ item, onEdit, onDelete, index }) {
  const isCustom = !item.prodotto_id

  return (
    <div
      className={`rounded-lg p-3 flex items-center justify-between transition-colors border ${
        isCustom
          ? 'bg-amber-50 border-amber-300'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex-1 text-left min-w-0">
        <div className="font-semibold text-slate-900 text-sm uppercase break-words">{item.prodotto_nome}</div>
        {isCustom && (
          <div className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-semibold mt-0.5">
            <IconStar className="w-3 h-3" /> Fuori catalogo
          </div>
        )}
        <div className="text-xs text-slate-500 mt-0.5 font-medium tabular-nums">
          {item.quantita} {item.tipologia}
        </div>
      </div>

      <div className="flex gap-1 ml-3">
        <button
          onClick={() => onEdit(index)}
          className="btn-icon w-9 h-9 min-w-[36px] min-h-[36px] text-slate-400 hover:text-blue-600 hover:bg-blue-50"
          title="Modifica prodotto"
        >
          <IconPencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(index)}
          className="btn-icon w-9 h-9 min-w-[36px] min-h-[36px] text-slate-400 hover:text-red-600 hover:bg-red-50"
          title="Rimuovi prodotto"
        >
          <IconX className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
