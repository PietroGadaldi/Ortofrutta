import { useState, useEffect, useRef } from 'react'
import { parseTipologie, capitalize } from '../utils/constants'

/**
 * ProductAutocomplete component
 * Filters products as user types, shows dropdown with matches
 * @param {Array<Object>} prodotti - List of available products {id, nome, tipologie_possibili}
 * @param {Function} onSelectProduct - Callback when product is selected {id, nome, tipologie_possibili}
 * @param {string} value - Current input value
 * @param {Function} onInputChange - Callback for input changes
 */
export function ProductAutocomplete({
  prodotti = [],
  onSelectProduct,
  value,
  onInputChange,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const justSelectedRef = useRef(false)

  // Filter products based on input
  useEffect(() => {
    if (!value.trim()) {
      setFilteredProducts([])
      setIsOpen(false)
      return
    }

    const filtered = prodotti.filter((p) =>
      p.nome.toLowerCase().includes(value.toLowerCase())
    )

    setFilteredProducts(filtered)
    // Non riaprire il dropdown se è stato appena selezionato un prodotto
    if (!justSelectedRef.current) {
      setIsOpen(filtered.length > 0)
    }
    setHighlightedIndex(-1)
  }, [value, prodotti])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    onInputChange(e.target.value)
  }

  const handleSelectProduct = (product) => {
    justSelectedRef.current = true
    onSelectProduct(product)
    setIsOpen(false)
    // Reset flag dopo un momento per permettere future navigazioni
    setTimeout(() => {
      justSelectedRef.current = false
    }, 0)
  }

  const handleKeyDown = (e) => {
    // Tab: navigazione nei prodotti
    if (e.key === 'Tab') {
      if (filteredProducts.length > 0) {
        e.preventDefault()
        if (!isOpen) {
          // Apri dropdown e evidenzia il primo
          setIsOpen(true)
          setHighlightedIndex(0)
        } else {
          // Naviga al prossimo elemento (o ritorna al primo se sei all'ultimo)
          setHighlightedIndex((prev) =>
            prev < filteredProducts.length - 1 ? prev + 1 : 0
          )
        }
      }
      return
    }

    if (!isOpen && e.key !== 'ArrowDown') return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setIsOpen(true)
        setHighlightedIndex((prev) =>
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredProducts.length > 0) {
          // Se c'è un elemento evidenziato, selezionalo; altrimenti seleziona il primo
          const indexToSelect = highlightedIndex >= 0 ? highlightedIndex : 0
          handleSelectProduct(filteredProducts[indexToSelect])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
      default:
        break
    }
  }

  return (
    <div className="relative w-full">
      <label className="block text-sm font-bold text-green-900 mb-2 text-left">
        🌱 Prodotto
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value && setIsOpen(true)}
        placeholder="Scrivi il nome del prodotto..."
        className="w-full h-12 px-4 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black font-semibold"
      />

      {isOpen && filteredProducts.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-2 bg-white border-2 border-green-300 rounded-lg shadow-xl"
        >
          <ul className="max-h-60 overflow-y-auto">
            {filteredProducts.map((product, index) => (
              <li key={product.id}>
                <button
                  onClick={() => handleSelectProduct(product)}
                  className={`
                    w-full text-left px-4 py-3 transition-all border-b border-green-100 last:border-b-0
                    ${
                      index === highlightedIndex
                        ? 'bg-green-500 text-white font-semibold'
                        : 'hover:bg-green-100 text-green-900'
                    }
                  `}
                >
                  <div className="font-bold text-left">{capitalize(product.nome)}</div>
                  <div className="text-xs opacity-75 mt-1 text-left">
                    Disponibilità: {parseTipologie(product.tipologie_possibili).map(capitalize).join(', ')}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {value && !isOpen && filteredProducts.length === 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-red-400 rounded-lg shadow-xl p-4">
          <p className="text-sm text-red-700 font-semibold">
            ❌ Nessun prodotto trovato per "{value}"
          </p>
        </div>
      )}
    </div>
  )
}
