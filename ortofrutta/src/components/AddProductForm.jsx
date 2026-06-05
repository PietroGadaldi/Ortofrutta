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
    <form onSubmit={handleAddProduct} className="bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
        <span className="text-2xl">📝</span> Aggiungi Prodotto
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Product Autocomplete (col-span 5) */}
        <div className="md:col-span-5">
          <ProductAutocomplete
            prodotti={formattedProdotti}
            onSelectProduct={handleProductSelect}
            value={inputValue}
            onInputChange={setInputValue}
          />
        </div>

        {/* Quantity Input (col-span 3) */}
        <div className="md:col-span-3">
          <label className="block text-sm font-bold text-green-900 mb-2 text-left">
            📦 Quantità
          </label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={quantita}
            onChange={(e) => setQuantita(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black font-semibold transition-all"
            disabled={!selectedProduct}
          />
        </div>

        {/* Tipologia Select (col-span 4) */}
        <div className="md:col-span-4">
          <label className="block text-sm font-bold text-green-900 mb-2 text-left">
            🏷️ Tipologia
          </label>
          <select
            value={tipologia}
            onChange={(e) => setTipologia(e.target.value)}
            className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-black font-semibold transition-all"
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
