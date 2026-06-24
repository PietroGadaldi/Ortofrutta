import { useState, useEffect, useMemo } from 'react'
import { ProductAutocomplete } from './ProductAutocomplete'
import { parseTipologie, capitalize } from '../utils/constants'

const parseQuantita = (val) => parseFloat(String(val).replace(',', '.'))

/**
 * AddProductForm component
 * Form to add new products to order with product autocomplete, quantity, and type selection
 * @param {Array<Object>} prodotti - List of available products
 * @param {Function} onAddProduct - Callback when product is added {prodotto_id, prodotto_nome, quantita, tipologia}
 * @param {Object} editingItem - If editing, the item being edited (used to populate form)
 * @param {Function} onReorderLast - Callback to reorder items from the most recent order
 * @param {Function} onSetTomorrow - Callback to set order date to tomorrow
 * @param {boolean} isAdminMode - When true, allows free-text product entry without catalog lookup
 */
export function AddProductForm({ prodotti = [], onAddProduct, editingItem = null, onReorderLast, onSetTomorrow, isAdminMode = false, disabledMessage = null }) {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [quantita, setQuantita] = useState('')
  const [tipologia, setTipologia] = useState('')
  const [tipologieDisponibili, setTipologieDisponibili] = useState([])
  const [error, setError] = useState('')

  // Trasforma i prodotti per avere i nomi con l'iniziale maiuscola per l'autocomplete e la visualizzazione
  const formattedProdotti = useMemo(() => {
    return prodotti.map(p => ({
      ...p,
      nome: capitalize(p.nome)
    }))
  }, [prodotti])

  // If editing, pre-fill the form
  useEffect(() => {
    if (editingItem) {
      const product = formattedProdotti.find((p) => p.id === editingItem.prodotto_id)
      if (product) {
        setSelectedProduct(product)
        setInputValue(capitalize(product.nome))
        setQuantita(editingItem.quantita.toString())
        setTipologia(editingItem.tipologia)
        setTipologieDisponibili(parseTipologie(product.tipologie_possibili))
      } else if (isAdminMode && editingItem.prodotto_nome) {
        // Custom product (no catalog entry)
        setSelectedProduct(null)
        setInputValue(editingItem.prodotto_nome)
        setQuantita(editingItem.quantita.toString())
        setTipologia(editingItem.tipologia)
        setTipologieDisponibili([])
      }
    }
  }, [editingItem, formattedProdotti, isAdminMode])

  // Update tipologie when product changes
  useEffect(() => {
    if (selectedProduct) {
      const tipologie = parseTipologie(selectedProduct.tipologie_possibili)
      setTipologieDisponibili(tipologie)
    }
  }, [selectedProduct])

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setInputValue(product.nome)
    // Reset della tipologia solo quando l'utente sceglie manualmente 
    // un nuovo prodotto dalla lista (non durante il caricamento in modifica)
    setTipologia('')
  }

  const handleIncrement = () => {
    const val = parseQuantita(quantita) || 0;
    setQuantita((val + 1).toString());
  };

  const handleDecrement = () => {
    const val = parseQuantita(quantita) || 0;
    if (val > 1) {
      setQuantita((val - 1).toString());
    }
  };

  const isCustomProduct = isAdminMode && !selectedProduct && inputValue.trim()

  const validateForm = () => {
    setError('')

    if (!selectedProduct && !isCustomProduct) {
      setError(isAdminMode ? 'Inserisci il nome del prodotto' : 'Seleziona un prodotto')
      return false
    }

    const numQuantita = parseQuantita(quantita);
    if (!quantita || isNaN(numQuantita) || numQuantita <= 0) {
      setError('Inserisci una quantità valida (es: 1 oppure 0,5)')
      return false
    }

    if (!tipologia) {
      setError('Seleziona una tipologia')
      return false
    }

    return true
  }

  const handleAddProduct = (e) => {
    e.preventDefault()

    if (!validateForm()) return

    onAddProduct({
      prodotto_id: isCustomProduct ? null : selectedProduct.id,
      prodotto_nome: isCustomProduct ? inputValue.trim() : selectedProduct.nome,
      quantita: parseQuantita(quantita),
      tipologia,
    })

    // Reset form
    setSelectedProduct(null)
    setInputValue('')
    setQuantita('')
    setTipologia('')
    setTipologieDisponibili([])
  }

  return (
    <form onSubmit={handleAddProduct} className="md:h-[550px] h-auto flex flex-col bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
        <span className="text-2xl">📝</span> Aggiungi Prodotto
      </h3>

      <div className="space-y-5 flex-1">
        {disabledMessage ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="p-5 bg-orange-50 border-2 border-orange-300 rounded-xl text-center">
              <p className="text-orange-900 font-bold text-sm">{disabledMessage}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Product Autocomplete */}
            <ProductAutocomplete
              prodotti={formattedProdotti}
              onSelectProduct={handleProductSelect}
              value={inputValue}
              onInputChange={(val) => {
                setInputValue(val)
                if (selectedProduct && val !== selectedProduct.nome) {
                  setSelectedProduct(null)
                  setTipologieDisponibili([])
                }
              }}
              isAdminMode={isAdminMode}
            />

            {/* Quantity Input */}
            <div>
              <label className="block text-sm font-bold text-green-900 mb-2 text-left">
                📦 Quantità
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantita}
                  onChange={(e) => setQuantita(e.target.value)}
                  onBlur={() => {
                    if (quantita === '') return;
                    const num = parseQuantita(quantita);
                    if (isNaN(num) || num <= 0) setQuantita('');
                  }}
                  placeholder="es: 1 o 0,5"
                  className="flex-1 min-w-0 h-12 px-4 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black font-semibold transition-all text-base"
                  disabled={!selectedProduct && !isCustomProduct}
                />
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={(!selectedProduct && !isCustomProduct) || parseQuantita(quantita) <= 1}
                  className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white border-2 border-green-300 rounded-lg text-green-700 font-bold hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={!selectedProduct && !isCustomProduct}
                  className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white border-2 border-green-300 rounded-lg text-green-700 font-bold hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Tipologia */}
            <div>
              <label className="block text-sm font-bold text-green-900 mb-2 text-left">
                🏷️ Tipologia
              </label>
              {isCustomProduct ? (
                <input
                  type="text"
                  value={tipologia}
                  onChange={(e) => setTipologia(e.target.value)}
                  placeholder="es: kg, pezzo, cassetta..."
                  className="w-full h-12 px-4 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black font-semibold transition-all"
                />
              ) : (
                <select
                  value={tipologia}
                  onChange={(e) => setTipologia(e.target.value)}
                  className="w-full h-12 px-4 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-black font-semibold transition-all"
                  disabled={!selectedProduct}
                >
                  <option value="">-- Seleziona tipologia --</option>
                  {tipologieDisponibili.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {capitalize(tipo)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </>
        )}

        {/* Quick Actions — sempre visibili */}
        <div className="pt-2 flex gap-3">
          {onReorderLast && (
            <button
              type="button"
              onClick={onReorderLast}
              className="flex-1 h-12 px-2 bg-amber-50 border-2 border-amber-300 text-amber-800 rounded-lg text-xs font-bold hover:bg-amber-100 transition-all flex items-center justify-center gap-1 shadow-sm hover:shadow-md transform active:scale-95"
            >
              🔄 Ripeti ultimo ordine
            </button>
          )}
          <button
            type="button"
            onClick={onSetTomorrow}
            className="flex-1 h-12 px-2 bg-blue-50 border-2 border-blue-300 text-blue-800 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-1 shadow-sm hover:shadow-md transform active:scale-95"
          >
            📅 Ordina per domani
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 rounded-lg">
          <p className="text-sm text-red-800 font-semibold">⚠️ {error}</p>
        </div>
      )}

      {/* Add button — nascosto se disabilitato */}
      {!disabledMessage && (
        <button
          type="submit"
          disabled={(!selectedProduct && !isCustomProduct) || !quantita || !tipologia}
          className="mt-5 w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
        >
          ✅ Aggiungi al Riepilogo
        </button>
      )}
    </form>
  )
}
