import { useState, useEffect } from 'react'
import { ProductAutocomplete } from './ProductAutocomplete'
import { parseTipologie } from '../utils/constants'

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

  // If editing, pre-fill the form
  useEffect(() => {
    if (editingItem) {
      const product = prodotti.find((p) => p.id === editingItem.prodotto_id)
      if (product) {
        setSelectedProduct(product)
        setInputValue(product.nome)
        setQuantita(editingItem.quantita.toString())
        setTipologia(editingItem.tipologia)
        setTipologieDisponibili(parseTipologie(product.tipologie_possibili))
      }
    }
  }, [editingItem, prodotti])

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

  const validateForm = () => {
    setError('')

    if (!selectedProduct) {
      setError('Seleziona un prodotto')
      return false
    }

    if (!quantita || Number(quantita) <= 0) {
      setError('Inserisci una quantità valida (maggiore di 0)')
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
    <form onSubmit={handleAddProduct} className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-bold text-green-800 mb-4">📝 Aggiungi Prodotto</h3>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Product Autocomplete (col-span 5) */}
        <div className="md:col-span-5">
          <ProductAutocomplete
            prodotti={prodotti}
            onSelectProduct={handleProductSelect}
            value={inputValue}
            onInputChange={setInputValue}
          />
        </div>

        {/* Quantity Input (col-span 3) */}
        <div className="md:col-span-3">
          <label className="block text-sm font-semibold text-green-800 mb-2">
            📦 Quantità
          </label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={quantita}
            onChange={(e) => setQuantita(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={!selectedProduct}
          />
        </div>

        {/* Tipologia Select (col-span 4) */}
        <div className="md:col-span-4">
          <label className="block text-sm font-semibold text-green-800 mb-2">
            🏷️ Tipologia
          </label>
          <select
            value={tipologia}
            onChange={(e) => setTipologia(e.target.value)}
            className="w-full px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            disabled={!selectedProduct}
          >
            <option value="">-- Seleziona tipologia --</option>
            {tipologieDisponibili.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-sm text-red-600">⚠️ {error}</p>
        </div>
      )}

      {/* Add button */}
      <button
        type="submit"
        disabled={!selectedProduct || !quantita || !tipologia}
        className="mt-4 w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        ✅ Aggiungi al Riepilogo
      </button>
    </form>
  )
}
