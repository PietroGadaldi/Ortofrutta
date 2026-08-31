import { useState, useEffect, useRef } from 'react'
import { parseTipologie, capitalize } from '../utils/constants'
import { focusAdjacentField, focusAdjacentFieldDeferred } from '../utils/fieldNav'

/**
 * ProductAutocomplete component
 * Filters products as user types, shows dropdown with matches
 * @param {Array<Object>} prodotti - List of available products {id, nome, tipologie_possibili}
 * @param {Function} onSelectProduct - Callback when product is selected {id, nome, tipologie_possibili}
 * @param {string} value - Current input value
 * @param {Function} onInputChange - Callback for input changes
 * @param {boolean} isAdminMode - When true, hides WhatsApp fallback (for titolare)
 * @param {Object} inputRef - Ref esterno per l'input (es. ritorno del focus dopo l'aggiunta)
 */
export function ProductAutocomplete({
  prodotti = [],
  onSelectProduct,
  value,
  onInputChange,
  isAdminMode = false,
  inputRef: inputRefProp = null,
}) {
  const [isOpen, setIsOpen] = useState(false)
  // Avviso "fuori catalogo": si nasconde con Invio/Esc o toccando fuori dall'input
  const [showNoMatchNotice, setShowNoMatchNotice] = useState(true)
  const [filteredProducts, setFilteredProducts] = useState([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const localInputRef = useRef(null)
  const inputRef = inputRefProp || localInputRef
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

    // Ripulisce gli spazi iniziali/finali così "insalata " trova comunque "insalata"
    // (evita falsi "fuori catalogo" per prodotti già presenti nel catalogo)
    const term = value.trim().toLowerCase()
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
      // Invio su un prodotto fuori catalogo: prosegue verso la quantità
      if (e.key === 'Enter' && value.trim()) {
        focusAdjacentFieldDeferred(e.currentTarget, 1)
      }
      return
    }

    // Tab: conferma il prodotto evidenziato (o il primo attivo) e lascia
    // proseguire il focus verso il campo quantità — inserimento rapido da tastiera
    if (e.key === 'Tab') {
      if (isOpen && !e.shiftKey) {
        const indexToSelect =
          highlightedIndex >= 0 && filteredProducts[highlightedIndex]?.attivo !== false
            ? highlightedIndex
            : filteredProducts.findIndex((p) => p.attivo !== false)
        if (indexToSelect >= 0) {
          handleSelectProduct(filteredProducts[indexToSelect])
        } else {
          setIsOpen(false)
        }
      } else if (isOpen) {
        setIsOpen(false)
      }
      // Niente preventDefault: Tab passa al campo successivo
      return
    }

    // Lista chiusa: Invio e frecce su/giù spostano il focus tra i campi
    // (freccia giù con del testo digitato riapre invece la lista, vedi sotto)
    if (!isOpen) {
      if (e.key === 'Enter') {
        e.preventDefault()
        focusAdjacentFieldDeferred(e.currentTarget, 1)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        focusAdjacentField(e.currentTarget, -1)
        return
      }
      if (e.key === 'ArrowDown' && !value.trim()) {
        e.preventDefault()
        focusAdjacentField(e.currentTarget, 1)
        return
      }
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
        } else if (highlightedIndex < 0) {
          // Già in cima alla lista: chiudi e torna al campo precedente
          setIsOpen(false)
          focusAdjacentField(e.currentTarget, -1)
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
            // Invio: conferma e prosegue verso il campo quantità
            focusAdjacentFieldDeferred(e.currentTarget, 1)
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
      <label className="label">
        Prodotto
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value && setIsOpen(true)}
        data-kbfield="prodotto"
        placeholder="Cerca un prodotto per nome..."
        className="input h-12"
      />

      {isOpen && filteredProducts.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
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
                      w-full text-left px-4 py-3 transition-colors border-b border-slate-100 last:border-b-0
                      ${
                        !isActive
                          ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                          : index === highlightedIndex
                          ? 'bg-verde-orto-600 text-white'
                          : 'hover:bg-verde-orto-50 text-slate-800'
                      }
                    `}
                  >
                    <div className="font-semibold text-left text-sm uppercase">{product.nome}</div>
                    {!isActive && (
                      <div className="text-xs mt-0.5 text-left">
                        Prodotto non di stagione
                      </div>
                    )}
                    {isActive && isAdminMode && (
                      <div className="text-xs opacity-75 mt-0.5 text-left">
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
        <div className="absolute z-10 w-full mt-1.5 alert-warn shadow-lg">
          <p className="text-sm">
            "{value}" non è nel catalogo — verrà aggiunto all'ordine come <strong>prodotto fuori catalogo</strong>. Compila quantità e tipologia e premi "Aggiungi".
          </p>
        </div>
      )}
    </div>
  )
}
