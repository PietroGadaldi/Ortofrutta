import { useState, useEffect, useMemo, useRef } from 'react'
import { IconUser, IconChevronDown } from './icons'

/**
 * ClientSelect component
 * Combobox per scegliere il cliente di un ordine (solo titolare).
 * Filtra la lista mentre si digita; la selezione avviene con mouse/tap o tastiera.
 * @param {Array<Object>} clienti - Lista clienti {id, nome, provenienza}
 * @param {string|null} value - Id del cliente selezionato
 * @param {Function} onChange - Callback con l'id del cliente scelto
 * @param {boolean} isLoading - Mostra lo stato di caricamento della lista
 * @param {string} loadError - Messaggio di errore nel caricamento della lista
 * @param {boolean} disabled - Disabilita il controllo
 */
export function ClientSelect({
  clienti = [],
  value = null,
  onChange,
  isLoading = false,
  loadError = '',
  disabled = false,
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const itemRefs = useRef([])

  const selected = useMemo(
    () => clienti.find((c) => c.id === value) || null,
    [clienti, value]
  )

  // Lista filtrata: ordinata per nome, filtrata sul testo digitato
  const filtered = useMemo(() => {
    const ordinati = [...clienti].sort((a, b) =>
      (a.nome || '').localeCompare(b.nome || '')
    )
    const term = query.trim().toLowerCase()
    if (!term) return ordinati
    return ordinati.filter((c) => (c.nome || '').toLowerCase().includes(term))
  }, [clienti, query])

  // Chiude il dropdown al click/tap fuori (mousedown + touchstart per iOS)
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  // Mantiene visibile l'elemento evidenziato durante la navigazione da tastiera
  useEffect(() => {
    if (highlightedIndex < 0) return
    itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex])

  const openList = () => {
    if (disabled || isLoading) return
    setQuery('')
    setHighlightedIndex(-1)
    setIsOpen(true)
  }

  const handleSelect = (cliente) => {
    onChange(cliente.id)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      setQuery('')
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        openList()
        return
      }
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, -1))
      return
    }

    if (e.key === 'Enter') {
      // Evita l'invio del form quando si sta scegliendo dalla lista
      if (!isOpen) return
      e.preventDefault()
      const index = highlightedIndex >= 0 ? highlightedIndex : 0
      if (filtered[index]) handleSelect(filtered[index])
    }
  }

  // Mentre il dropdown è aperto l'input mostra il testo di ricerca,
  // altrimenti il nome del cliente già selezionato
  const inputValue = isOpen ? query : selected?.nome || ''

  const placeholder = isLoading
    ? 'Caricamento clienti...'
    : selected
    ? selected.nome
    : 'Cerca un cliente per nome...'

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label htmlFor="client-select-input" className="label">
        Cliente
      </label>

      <div className="relative">
        <IconUser className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="client-select-input"
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="client-select-list"
          aria-autocomplete="list"
          autoComplete="off"
          value={inputValue}
          disabled={disabled || isLoading}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlightedIndex(-1)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={openList}
          onClick={openList}
          onKeyDown={handleKeyDown}
          className={`input h-12 pl-10 pr-10 ${selected && !isOpen ? 'uppercase' : ''}`}
        />
        <IconChevronDown
          className={`w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500 text-left">
              {clienti.length === 0
                ? 'Nessun cliente registrato. Creane uno dalla pagina Utenti.'
                : `Nessun cliente corrisponde a "${query}". Prova con un altro nome.`}
            </p>
          ) : (
            <ul id="client-select-list" role="listbox" className="max-h-60 overflow-y-auto overscroll-contain">
              {filtered.map((cliente, index) => {
                const isSelected = cliente.id === value
                return (
                  <li key={cliente.id} ref={(el) => (itemRefs.current[index] = el)} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => handleSelect(cliente)}
                      className={`w-full text-left px-4 py-3 min-h-[44px] transition-colors border-b border-slate-100 last:border-b-0 ${
                        index === highlightedIndex
                          ? 'bg-verde-orto-600 text-white'
                          : isSelected
                          ? 'bg-verde-orto-50 text-verde-orto-800'
                          : 'text-slate-800 hover:bg-verde-orto-50'
                      }`}
                    >
                      <span className="block text-sm font-semibold uppercase">{cliente.nome}</span>
                      {cliente.provenienza && (
                        <span
                          className={`block text-xs mt-0.5 ${
                            index === highlightedIndex ? 'text-white/80' : 'text-slate-500'
                          }`}
                        >
                          {cliente.provenienza}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {loadError && (
        <p className="mt-1.5 text-sm text-red-700 text-left">{loadError}</p>
      )}
    </div>
  )
}
