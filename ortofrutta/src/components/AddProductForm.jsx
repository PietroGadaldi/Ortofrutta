import { useState, useEffect, useMemo } from 'react'
import { ProductAutocomplete } from './ProductAutocomplete'
import { parseTipologie, capitalize } from '../utils/constants'
import { IconPlus, IconMinus, IconRefresh, IconCalendar, IconPencil } from './icons'

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
      } else if (editingItem.prodotto_nome) {
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

  // Anche i clienti possono aggiungere prodotti fuori catalogo (testo libero)
  const isCustomProduct = !selectedProduct && inputValue.trim()

  const validateForm = () => {
    setError('')

    if (!selectedProduct && !isCustomProduct) {
      setError('Inserisci il nome del prodotto')
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

    // Conferma esplicita prima di aggiungere un prodotto fuori catalogo
    if (isCustomProduct) {
      const confirmed = window.confirm(
        `"${inputValue.trim().toUpperCase()}" non è presente nel catalogo.\n\nSei sicuro di voler aggiungere questo prodotto fuori catalogo all'ordine?`
      )
      if (!confirmed) return
    }

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
    <form onSubmit={handleAddProduct} className="md:h-[550px] h-auto flex flex-col card p-5 sm:p-6">
      <h3 className="section-title mb-5 flex items-center gap-2">
        <IconPencil className="w-5 h-5 text-verde-orto-600" />
        Aggiungi prodotto
      </h3>

      <div className="space-y-4 flex-1">
        {disabledMessage ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="alert-warn text-center">
              <p className="font-semibold text-sm">{disabledMessage}</p>
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
              <label className="label">
                Quantità
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
                  className="input flex-1 min-w-0 h-12"
                  disabled={!selectedProduct && !isCustomProduct}
                />
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={(!selectedProduct && !isCustomProduct) || parseQuantita(quantita) <= 1}
                  className="btn-icon w-12 h-12 flex-shrink-0 bg-white border border-slate-300 text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <IconMinus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={!selectedProduct && !isCustomProduct}
                  className="btn-icon w-12 h-12 flex-shrink-0 bg-white border border-slate-300 text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <IconPlus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tipologia */}
            <div>
              <label className="label">
                Tipologia
              </label>
              {isCustomProduct ? (
                <input
                  type="text"
                  value={tipologia}
                  onChange={(e) => setTipologia(e.target.value)}
                  placeholder="es: kg, pezzo, cassetta..."
                  className="input h-12"
                />
              ) : (
                <select
                  value={tipologia}
                  onChange={(e) => setTipologia(e.target.value)}
                  className="input h-12"
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
        <div className="pt-2 flex gap-2.5">
          {onReorderLast && (
            <button
              type="button"
              onClick={onReorderLast}
              className="btn-secondary flex-1 h-11 px-2 text-xs"
            >
              <IconRefresh className="w-4 h-4 flex-shrink-0" />
              Ripeti ultimo ordine
            </button>
          )}
          <button
            type="button"
            onClick={onSetTomorrow}
            className="btn-secondary flex-1 h-11 px-2 text-xs"
          >
            <IconCalendar className="w-4 h-4 flex-shrink-0" />
            Ordina per domani
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="alert-error mt-4">
          {error}
        </div>
      )}

      {/* Add button — nascosto se disabilitato */}
      {!disabledMessage && (
        <button
          type="submit"
          disabled={(!selectedProduct && !isCustomProduct) || !quantita || !tipologia}
          className="btn-primary mt-5 w-full py-3"
        >
          Aggiungi al riepilogo
        </button>
      )}
    </form>
  )
}
