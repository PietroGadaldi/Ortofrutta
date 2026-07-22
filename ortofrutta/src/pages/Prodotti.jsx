import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { createProdotto, updateProdotto, updateProdottoStatus, deleteProdotto } from '../services/prodottiService'
import { parseTipologie, capitalize } from '../utils/constants'
import { NoticeModal } from '../components/NoticeModal'
import { IconPlus, IconPencil, IconTrash, IconRefresh, IconSearch, IconPackage, IconX } from '../components/icons'

export function Prodotti() {
  const [prodotti, setProdotti] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Popup di conferma operazioni riuscite: { title, message }
  const [notice, setNotice] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [tipologieArray, setTipologieArray] = useState([])
  const [tipologieInput, setTipologieInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModifying, setIsModifying] = useState(false)
  const [modifyingProdottoId, setModifyingProdottoId] = useState(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [listLoading, setListLoading] = useState(false)
  const [mobileTab, setMobileTab] = useState('lista')
  const [statusFilter, setStatusFilter] = useState('tutti')

  useEffect(() => {
    fetchProdotti(true)
  }, [])

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(t)
  }, [error])

  const fetchProdotti = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true)
    } else {
      setListLoading(true)
    }
    try {
      const { data, error: err } = await supabase.from('prodotti').select('*').order('nome', { ascending: true })
      if (err) throw err
      setProdotti(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      if (isInitialLoad) {
        setLoading(false)
      } else {
        setListLoading(false)
      }
    }
  }

  const handleAggiungiTipologia = () => {
    const tipologiaTrimmed = tipologieInput.trim()

    if (!tipologiaTrimmed) {
      setError('La tipologia non può essere vuota')
      return
    }

    const tipologiaLower = tipologiaTrimmed.toLowerCase()

    if (tipologieArray.includes(tipologiaLower)) {
      setError('Questa tipologia è già stata aggiunta')
      return
    }

    setTipologieArray([...tipologieArray, tipologiaLower])
    setTipologieInput('')
    setError(null)
  }

  const handleRimuoviTipologia = (index) => {
    setTipologieArray(tipologieArray.filter((_, i) => i !== index))
    setError(null)
  }

  const resetForm = () => {
    setNome('')
    setTipologieArray([])
    setTipologieInput('')
    setIsModifying(false)
    setModifyingProdottoId(null)
    setError(null)
  }

  const handleModificaProdotto = (prodotto) => {
    setNome(capitalize(prodotto.nome))
    setTipologieArray(parseTipologie(prodotto.tipologie_possibili))
    setTipologieInput('')
    setIsModifying(true)
    setModifyingProdottoId(prodotto.id)
    setError(null)
    setMobileTab('aggiungi')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!nome.trim()) {
      setError('Inserisci il nome del prodotto')
      return
    }

    if (tipologieArray.length === 0) {
      setError('Aggiungi almeno una tipologia')
      return
    }

    setIsSubmitting(true)
    try {
      const nomeLower = nome.trim().toLowerCase()
      const tipologieStr = tipologieArray.join(';')

      if (isModifying) {
        // Modalità modifica
        const { error: err } = await updateProdotto(modifyingProdottoId, nomeLower, tipologieStr)

        if (err) throw err
        setNotice({
          title: 'Prodotto modificato!',
          message: `Le modifiche a "${nomeLower.toUpperCase()}" sono state salvate con successo.`,
        })

        // Aggiorna solo il prodotto locale senza refetch
        setProdotti(prodotti.map(p => 
          p.id === modifyingProdottoId 
            ? { ...p, nome: nomeLower, tipologie_possibili: tipologieStr }
            : p
        ))
      } else {
        // Modalità creazione
        const { error: err } = await createProdotto(nomeLower, tipologieStr)

        if (err) throw err
        setNotice({
          title: 'Prodotto aggiunto!',
          message: `"${nomeLower.toUpperCase()}" è stato aggiunto al catalogo con successo.`,
        })

        // Ricarica per ottenere il nuovo prodotto con ID
        await fetchProdotti()
      }

      resetForm()
      setMobileTab('lista')
    } catch (err) {
      setError('Errore: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (prodottoId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo prodotto?')) return

    try {
      const nomeProdotto = prodotti.find((p) => p.id === prodottoId)?.nome || ''
      const { error: err } = await deleteProdotto(prodottoId)

      if (err) throw err
      setNotice({
        title: 'Prodotto eliminato!',
        message: nomeProdotto
          ? `"${nomeProdotto.toUpperCase()}" è stato eliminato dal catalogo.`
          : 'Il prodotto è stato eliminato dal catalogo.',
      })
      await fetchProdotti()
    } catch (err) {
      setError('Errore: ' + err.message)
    }
  }

  const handleToggleAttivo = async (prodotto) => {
    const azione = prodotto.attivo ? 'disattivare' : 'attivare'
    if (!window.confirm(`Sei sicuro di voler ${azione} "${prodotto.nome.toUpperCase()}"?`)) return
    try {
      const { error: err } = await updateProdottoStatus(prodotto.id, !prodotto.attivo)
      if (err) throw err
      setNotice({
        title: `Prodotto ${!prodotto.attivo ? 'attivato' : 'disattivato'}!`,
        message: `"${prodotto.nome.toUpperCase()}" ${!prodotto.attivo ? 'è di nuovo visibile ai clienti nel catalogo.' : 'non è più visibile ai clienti nel catalogo.'}`,
      })
      setProdotti(prodotti.map(p => p.id === prodotto.id ? { ...p, attivo: !p.attivo } : p))
    } catch (err) {
      setError('Errore: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="page-title">Gestione prodotti</h1>
        <p className="page-subtitle">Aggiungi, modifica o elimina i prodotti del tuo catalogo</p>
      </div>

      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {/* Tab mobile */}
      <div className="flex md:hidden rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm p-1 gap-1">
        <button
          onClick={() => setMobileTab('aggiungi')}
          className={`flex-1 py-2.5 rounded-md font-semibold text-sm transition-colors ${
            mobileTab === 'aggiungi'
              ? 'bg-verde-orto-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          {isModifying ? 'Modifica' : 'Aggiungi'}
        </button>
        <button
          onClick={() => setMobileTab('lista')}
          className={`flex-1 py-2.5 rounded-md font-semibold text-sm transition-colors ${
            mobileTab === 'lista'
              ? 'bg-verde-orto-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Lista ({prodotti.length})
        </button>
      </div>

      {/* Layout Bicolonna */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Sezione Sinistra: Form */}
        <div className={`${mobileTab === 'aggiungi' ? 'block' : 'hidden'} md:block min-w-0 card p-4 sm:p-6`}>
          <div className="flex justify-between items-center mb-5 gap-2">
            <h2 className="section-title flex items-center gap-2">
              <IconPlus className="w-5 h-5 text-verde-orto-600" />
              {isModifying ? 'Modifica prodotto' : 'Nuovo prodotto'}
            </h2>
            <div className="flex gap-2">
              {isModifying && (
                <button
                  type="button"
                  onClick={() => { resetForm(); setMobileTab('lista') }}
                  disabled={isSubmitting}
                  className="btn-secondary px-3 py-2 text-sm"
                >
                  Annulla
                </button>
              )}
              <button
                type="submit"
                form="form-nuovo-prodotto"
                disabled={isSubmitting}
                className="btn-primary px-3 sm:px-4 py-2 text-sm"
              >
                {isSubmitting ? 'Salvando...' : isModifying ? 'Salva modifiche' : 'Aggiungi'}
              </button>
            </div>
          </div>

          <form id="form-nuovo-prodotto" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                Nome prodotto
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input"
                placeholder="es. Pomodori"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="label">
                Tipologia
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={tipologieInput}
                  onChange={(e) => setTipologieInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAggiungiTipologia()
                    }
                  }}
                  className="input flex-1 min-w-0"
                  placeholder="es. kg"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleAggiungiTipologia}
                  disabled={isSubmitting}
                  className="btn-icon flex-none bg-verde-orto-600 text-white shadow-sm hover:bg-verde-orto-700 disabled:opacity-50"
                  style={{ minWidth: '48px', minHeight: '48px', width: '48px', height: '48px' }}
                >
                  <IconPlus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lista Tipologie Aggiunte */}
            {tipologieArray.length > 0 && (
              <div>
                <label className="label">
                  Tipologie aggiunte ({tipologieArray.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tipologieArray.map((tip, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <span className="text-sm text-slate-800 font-semibold">{capitalize(tip)}</span>
                      <button
                        type="button"
                        onClick={() => handleRimuoviTipologia(index)}
                        disabled={isSubmitting}
                        className="btn-icon w-8 h-8 min-w-[32px] min-h-[32px] text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Sezione Destra: Lista Prodotti */}
        <div className={`${mobileTab === 'lista' ? 'block' : 'hidden'} md:block min-w-0 card p-4 sm:p-6`}>
          <div className="flex justify-between items-center mb-5 gap-2">
            <h2 className="section-title flex items-center gap-2">
              <IconPackage className="w-5 h-5 text-verde-orto-600" />
              Catalogo ({prodotti.length})
            </h2>
            <button
              onClick={() => fetchProdotti()}
              disabled={listLoading}
              className="btn-secondary px-3 py-2 text-sm"
            >
              <IconRefresh className={`w-4 h-4 ${listLoading ? 'animate-spin' : ''}`} />
              {listLoading ? 'Aggiornamento...' : 'Aggiorna'}
            </button>
          </div>

          {/* Filtro di Ricerca */}
          <div className="mb-4 space-y-2.5">
            <div className="relative">
              <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cerca prodotto..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="input pl-9 py-2"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { value: 'tutti', label: `Tutti (${prodotti.length})` },
                { value: 'attivi', label: `Solo attivi (${prodotti.filter(p => p.attivo).length})` },
                { value: 'non_attivi', label: `Solo non attivi (${prodotti.filter(p => !p.attivo).length})` },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                    statusFilter === value
                      ? 'bg-verde-orto-600 border-verde-orto-600 text-white'
                      : 'bg-white border-slate-300 text-slate-600 hover:border-verde-orto-400 hover:text-verde-orto-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

          </div>

          {listLoading ? (
            <div className="flex items-center gap-2.5 text-slate-500 font-medium py-4">
              <div className="spinner-sm flex-shrink-0" />
              Aggiornamento lista...
            </div>
          ) : prodotti.length === 0 ? (
            <div className="text-slate-500 font-medium italic">Nessun prodotto presente</div>
          ) : (
            <>
              {(() => {
                // Ripulisce gli spazi iniziali/finali dal termine di ricerca
                const searchLower = searchFilter.trim().toLowerCase()
                const filteredProdotti = prodotti
                  .filter((p) => {
                    const nomeMatch = p.nome.toLowerCase().includes(searchLower)
                    const tipologieMatch = parseTipologie(p.tipologie_possibili).some(tip =>
                      tip.toLowerCase().includes(searchLower)
                    )
                    const searchOk = nomeMatch || tipologieMatch
                    const statusOk = statusFilter === 'tutti' || (statusFilter === 'attivi' ? p.attivo : !p.attivo)
                    return searchOk && statusOk
                  })
                  .sort((a, b) => {
                    if (!searchLower) return 0
                    const aStarts = a.nome.toLowerCase().startsWith(searchLower)
                    const bStarts = b.nome.toLowerCase().startsWith(searchLower)
                    if (aStarts && !bStarts) return -1
                    if (!aStarts && bStarts) return 1
                    return a.nome.localeCompare(b.nome)
                  })

                return (
                  <>
                    {filteredProdotti.length === 0 && searchFilter ? (
                      <div className="text-slate-500 font-medium italic">Nessun prodotto corrisponde alla ricerca</div>
                    ) : (
                      <div className="space-y-2 max-h-[62vh] overflow-y-auto md:max-h-96 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {filteredProdotti.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="font-semibold text-slate-900 text-sm text-left truncate uppercase">{p.nome}</p>
                        <span className={p.attivo ? 'badge-green flex-shrink-0' : 'badge-red flex-shrink-0'}>
                          {p.attivo ? 'Attivo' : 'Non attivo'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {parseTipologie(p.tipologie_possibili).map((tip, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded"
                          >
                            {capitalize(tip)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-row gap-1 items-center flex-shrink-0">
                      <button
                        onClick={() => handleToggleAttivo(p)}
                        className="flex items-center justify-center flex-shrink-0"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                        title={p.attivo ? 'Disattiva prodotto' : 'Attiva prodotto'}
                      >
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors pointer-events-none ${
                          p.attivo ? 'bg-verde-orto-600' : 'bg-slate-300'
                        }`}>
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              p.attivo ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </div>
                      </button>
                      <button
                        onClick={() => handleModificaProdotto(p)}
                        className="btn-icon text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                        title="Modifica prodotto"
                      >
                        <IconPencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="btn-icon text-slate-400 hover:text-red-600 hover:bg-red-50"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                        title="Elimina prodotto"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                        ))}
                      </div>
                    )}
                  </>
                )
              })()}
            </>
          )}
        </div>
      </div>

      {/* Popup di conferma operazioni riuscite */}
      <NoticeModal
        isOpen={!!notice}
        onClose={() => setNotice(null)}
        variant="success"
        title={notice?.title}
        message={notice?.message}
        closeLabel="Chiudi"
      />
    </div>
  )
}

export default Prodotti
