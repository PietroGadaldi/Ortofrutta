import { useState, useEffect, useRef } from 'react'

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
    setIsOpen(filtered.length > 0)
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
    onSelectProduct(product)
    onInputChange('')
    setIsOpen(false)
  }

  const handleKeyDown = (e) => {
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
        if (highlightedIndex >= 0 && filteredProducts[highlightedIndex]) {
          handleSelectProduct(filteredProducts[highlightedIndex])
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
      <label className="block text-sm font-semibold text-green-800 mb-2">
        🌱 Prodotto
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value && setIsOpen(true)}
        placeholder="Inizia a digitare il nome del prodotto..."
        className="w-full px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
      />

      {isOpen && filteredProducts.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-green-300 rounded-lg shadow-lg"
        >
          <ul className="max-h-60 overflow-y-auto">
            {filteredProducts.map((product, index) => (
              <li key={product.id}>
                <button
                  onClick={() => handleSelectProduct(product)}
                  className={`
                    w-full text-left px-4 py-2 transition-colors
                    ${
                      index === highlightedIndex
                        ? 'bg-green-200 text-green-900'
                        : 'hover:bg-green-50 text-green-800'
                    }
                  `}
                >
                  <div className="font-semibold">{product.nome}</div>
                  <div className="text-xs text-green-600">
                    Tipi: {product.tipologie_possibili}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {value && !isOpen && filteredProducts.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-red-300 rounded-lg shadow-lg p-3">
          <p className="text-sm text-red-600">
            ❌ Nessun prodotto trovato per "{value}"
          </p>
        </div>
      )}
    </div>
  )
}
