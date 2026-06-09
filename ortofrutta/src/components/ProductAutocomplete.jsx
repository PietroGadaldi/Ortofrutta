import { useState, useEffect, useRef } from 'react'
import { parseTipologie, capitalize, WHATSAPP_NUMBER } from '../utils/constants'

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
    const val = e.target.value
    onInputChange(val)
    // Apri il dropdown solo se l'utente sta effettivamente scrivendo nell'input
    if (val.trim() && !justSelectedRef.current) {
      setIsOpen(true)
    }
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
        className="w-full h-12 px-4 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black font-semibold"
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
                <li key={product.id}>
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
                    <div className="font-bold text-left">{capitalize(product.nome)}</div>
                    <div className="text-xs opacity-75 mt-1 text-left">
                      {isActive ? (
                        <>Disponibilità: {parseTipologie(product.tipologie_possibili).map(capitalize).join(', ')}</>
                      ) : (
                        <>🚫 Prodotto non di stagione</>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {value.trim() && filteredProducts.length === 0 && (
        <div className={`absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl p-4 ${isAdminMode ? 'border-2 border-amber-400' : 'border-2 border-red-400'}`}>
          {isAdminMode ? (
            <p className="text-sm text-amber-700 font-semibold">
              ⚠️ "{value}" non è nel catalogo — verrà aggiunto come prodotto personalizzato
            </p>
          ) : (
            <>
              <p className="text-sm text-red-700 font-semibold mb-2">
                ❌ "{value}" non è presente nel nostro catalogo.
              </p>
              <p className="text-sm text-gray-700 mb-3">
                Se desideri verificare se questo prodotto è reperibile, contatta il titolare su WhatsApp.
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Salve, vorrei sapere se il prodotto "${value}" è disponibile.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.554 4.1 1.523 5.823L.057 23.486a.5.5 0 0 0 .612.612l5.663-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.502-5.176-1.381l-.372-.217-3.863 1 1-3.863-.217-.372A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Contatta il titolare su WhatsApp
              </a>
            </>
          )}
        </div>
      )}
    </div>
  )
}
