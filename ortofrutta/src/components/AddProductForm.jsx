import { useState, useEffect, useMemo } from 'react'
import { ProductAutocomplete } from './ProductAutocomplete'
import { parseTipologie, capitalize } from '../utils/constants'

/**
 * AddProductForm component
 * Form to add new products to order with product autocomplete, quantity, and type selection
 * @param {Array<Object>} prodotti - List of available products
 * @param {Function} onAddProduct - Callback when product is added {prodotto_id, prodotto_nome, quantita, tipologia}
 * @param {Object} editingItem - If editing, the item being edited (used to populate form)
 */
export function AddProductForm({ prodotti = [], onAddProduct, editingItem = null }) {
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
      }
    }
  }, [editingItem, formattedProdotti])

  // Update tipologie when product changes
  useEffect(() => {
    if (selectedProduct) {
      const tipologie = parseTipologie(selectedProduct.tipologie_possibili)
      setTipologieDisponibili(tipologie)
      setTipologia('')
    }
  }, [selectedProduct])

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setInputValue(product.nome)
  }

  const handleIncrement = () => {
    const val = parseFloat(quantita) || 0;
    if (val < 100) {
      setQuantita((val + 1).toString());
    }
  };

  const handleDecrement = () => {
    const val = parseFloat(quantita) || 0;
    if (val > 1) {
      setQuantita((val - 1).toString());
    }
  };

  const validateForm = () => {
    setError('')

    if (!selectedProduct) {
      setError('Seleziona un prodotto')
      return false
    }

    const numQuantita = Number(quantita);
    if (!quantita || numQuantita < 1 || numQuantita > 100) {
      setError('Inserisci una quantità valida tra 1 e 100')
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
      prodotto_id: selectedProduct.id,
      prodotto_nome: selectedProduct.nome,
      quantita: Number(quantita),
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
        {/* Product Autocomplete */}
        <ProductAutocomplete
          prodotti={formattedProdotti}
          onSelectProduct={handleProductSelect}
          value={inputValue}
          onInputChange={setInputValue}
        />

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-bold text-green-900 mb-2 text-left">
            📦 Quantità
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="100"
              step="any"
              value={quantita}
              onChange={(e) => setQuantita(e.target.value)}
              onBlur={() => {
                if (quantita === '') return;
                const num = parseFloat(quantita);
                if (isNaN(num)) return;
                
                if (num > 100) setQuantita('100');
                else if (num < 1) setQuantita('1');
              }}
              placeholder="0"
            className="flex-1 min-w-0 h-12 px-4 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black font-semibold transition-all"
              disabled={!selectedProduct}
            />
            <button
              type="button"
              onClick={handleDecrement}
              disabled={!selectedProduct || Number(quantita) <= 1}
            className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white border-2 border-green-300 rounded-lg text-green-700 font-bold hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
            >
              -
            </button>
            <button
              type="button"
              onClick={handleIncrement}
              disabled={!selectedProduct || Number(quantita) >= 100}
            className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white border-2 border-green-300 rounded-lg text-green-700 font-bold hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        {/* Tipologia Select */}
        <div>
          <label className="block text-sm font-bold text-green-900 mb-2 text-left">
            🏷️ Tipologia
          </label>
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
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 rounded-lg">
          <p className="text-sm text-red-800 font-semibold">⚠️ {error}</p>
        </div>
      )}

      {/* Add button */}
      <button
        type="submit"
        disabled={!selectedProduct || !quantita || !tipologia}
        className="mt-5 w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
      >
        ✅ Aggiungi al Riepilogo
      </button>
    </form>
  )
}
