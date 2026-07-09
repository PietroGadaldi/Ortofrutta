import { useState, useEffect, useRef } from 'react'
import { parseTipologie, capitalize } from '../utils/constants'

/**
 * ProductAutocomplete component
 * Filters products as user types, shows dropdown with matches
 * @param {Array<Object>} prodotti - List of available products {id, nome, tipologie_possibili}
 * @param {Function} onSelectProduct - Callback when product is selected {id, nome, tipologie_possibili}
 * @param {string} value - Current input value
 * @param {Function} onInputChange - Callback for input changes
 * @param {boolean} isAdminMode - When true, hides WhatsApp fallback (for titolare)
 */
export function ProductAutocomplete({
  prodotti = [],
  onSelectProduct,
  value,
  onInputChange,
  isAdminMode = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  // Avviso "fuori catalogo": si nasconde con Invio/Esc o toccando fuori dall'input
  const [showNoMatchNotice, setShowNoMatchNotice] = useState(true)
  const [filteredProducts, setFilteredProducts] = useState([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const justSelectedRef = useRef(false)
  const itemRefs = useRef([])

  // Filter products based on input
  useEffect(() => {
    if (!value.trim()) {
      setFilteredProducts([])
      setIsOpen(false)
      return
    }

    const term = value.toLowerCase()
    const filtered = prodotti
      .filter((p) => p.nome.toLowerCase().includes(term))
      .sort((a, b) => {
        const aStarts = a.nome.toLowerCase().startsWith(term)
        const bStarts = b.nome.toLowerCase().startsWith(term)
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1
        return a.nome.localeCompare(b.nome)
      })

    setFilteredProducts(filtered)
    setHighlightedIndex(-1)
  }, [value, prodotti])

  // Close dropdown when clicking/touching outside (mousedown + touchstart per iOS)
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
      // Tocco/click fuori dall'input: nascondi l'avviso "fuori catalogo"
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowNoMatchNotice(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // Scroll automatico dell'elemento evidenziato quando si naviga con le frecce
  useEffect(() => {
    if (highlightedIndex < 0) return
    itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex])

  const handleInputChange = (e) => {
    const val = e.target.value
    onInputChange(val)
    // Apri il dropdown solo se l'utente sta effettivamente scrivendo nell'input
    if (val.trim() && !justSelectedRef.current) {
      setIsOpen(true)
    }
    // L'utente sta digitando: rimostra l'eventuale avviso "fuori catalogo"
    setShowNoMatchNotice(true)
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
    // Nessun prodotto corrispondente: Invio o Esc chiudono l'avviso "fuori catalogo"
    // (preventDefault evita che Invio invii subito il form)
    if (filteredProducts.length === 0 && (e.key === 'Enter' || e.key === 'Escape')) {
      e.preventDefault()
      setShowNoMatchNotice(false)
      return
    }

    // Tab: navigazione nei prodotti
    if (e.key === 'Tab') {
      // Filter only active products for selection
      const activeProducts = filteredProducts.filter((p) => p.attivo !== false)
      if (activeProducts.length > 0) {
        e.preventDefault()
        if (!isOpen) {
          // Apri dropdown e evidenzia il primo
          setIsOpen(true)
          const firstActiveIndex = filteredProducts.findIndex((p) => p.attivo !== false)
          setHighlightedIndex(firstActiveIndex)
        } else {
          // Naviga al prossimo elemento attivo
          let nextIndex = highlightedIndex + 1
          while (nextIndex < filteredProducts.length && filteredProducts[nextIndex].attivo === false) {
            nextIndex++
          }
          if (nextIndex >= filteredProducts.length) {
            nextIndex = filteredProducts.findIndex((p) => p.attivo !== false)
          }
          setHighlightedIndex(nextIndex)
        }
      }
      return
    }

    if (!isOpen && e.key !== 'ArrowDown') return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setIsOpen(true)
        let nextDownIndex = highlightedIndex + 1
        while (nextDownIndex < filteredProducts.length && filteredProducts[nextDownIndex].attivo === false) {
          nextDownIndex++
        }
        if (nextDownIndex < filteredProducts.length) {
          setHighlightedIndex(nextDownIndex)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        let nextUpIndex = highlightedIndex - 1
        while (nextUpIndex >= 0 && filteredProducts[nextUpIndex].attivo === false) {
          nextUpIndex--
        }
        if (nextUpIndex >= 0) {
          setHighlightedIndex(nextUpIndex)
        } else {
          setHighlightedIndex(-1)
        }
        break
      case 'Enter':
        e.preventDefault()
        if (filteredProducts.length > 0) {
          // Se c'è un elemento evidenziato, selezionalo solo se attivo
          const indexToSelect = highlightedIndex >= 0 ? highlightedIndex : 0
          if (filteredProducts[indexToSelect].attivo !== false) {
            handleSelectProduct(filteredProducts[indexToSelect])
          }
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
        placeholder="Cerca un prodotto per nome..."
        className="w-full h-12 px-4 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black font-semibold text-base"
      />

      {isOpen && filteredProducts.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-2 bg-white border-2 border-green-300 rounded-lg shadow-xl"
        >
          <ul className="max-h-60 overflow-y-auto">
            {filteredProducts.map((product, index) => {
              const isActive = product.attivo !== false
              return (
                <li key={product.id} ref={(el) => (itemRefs.current[index] = el)}>
                  <button
                    onClick={() => isActive && handleSelectProduct(product)}
                    disabled={!isActive}
                    className={`
                      w-full text-left px-4 py-3 transition-all border-b border-green-100 last:border-b-0
                      ${
                        !isActive
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                          : index === highlightedIndex
                          ? 'bg-green-500 text-white font-semibold'
                          : 'hover:bg-green-100 text-green-900'
                      }
                    `}
                  >
                    <div className="font-bold text-left uppercase">{product.nome}</div>
                    {!isActive && (
                      <div className="text-xs opacity-75 mt-1 text-left">
                        🚫 Prodotto non di stagione
                      </div>
                    )}
                    {isActive && isAdminMode && (
                      <div className="text-xs opacity-75 mt-1 text-left">
                        Disponibilità: {parseTipologie(product.tipologie_possibili).map(capitalize).join(', ')}
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {value.trim() && filteredProducts.length === 0 && showNoMatchNotice && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl p-4 border-2 border-amber-400">
          <p className="text-sm text-amber-700 font-semibold">
            ⚠️ "{value}" non è nel catalogo — verrà aggiunto all'ordine come <strong>prodotto fuori catalogo</strong>. Compila quantità e tipologia e premi "Aggiungi".
          </p>
        </div>
      )}
    </div>
  )
}
