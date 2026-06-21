import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { createProdotto, updateProdotto, updateProdottoStatus, deleteProdotto } from '../services/prodottiService'
import { parseTipologie, capitalize } from '../utils/constants'

export function Prodotti() {
  const [prodotti, setProdotti] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
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

  useEffect(() => {
    fetchProdotti(true)
  }, [])

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(null), 3500)
    return () => clearTimeout(t)
  }, [success])

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
    setSuccess(null)
    setMobileTab('aggiungi')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

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
        setSuccess('Prodotto modificato con successo!')
        
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
        setSuccess('Prodotto aggiunto con successo!')
        
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
      const { error: err } = await deleteProdotto(prodottoId)

      if (err) throw err
      setSuccess('Prodotto eliminato!')
      await fetchProdotti()
    } catch (err) {
      setError('Errore: ' + err.message)
    }
  }

  const handleToggleAttivo = async (prodotto) => {
    try {
      const { error: err } = await updateProdottoStatus(prodotto.id, !prodotto.attivo)

      if (err) throw err
      setSuccess(`Prodotto ${!prodotto.attivo ? 'attivato' : 'disattivato'} con successo!`)
      // Aggiorna solo il prodotto locale senza refetch
      setProdotti(prodotti.map(p => p.id === prodotto.id ? { ...p, attivo: !p.attivo } : p))
    } catch (err) {
      setError('Errore: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-verde-orto-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-8 overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-4 shadow-xl">
        <h1 className="text-2xl sm:text-4xl font-black mb-2">🛒 Gestione Prodotti</h1>
        <p className="text-green-100 text-sm sm:text-lg font-semibold">Aggiungi, modifica o elimina i prodotti del tuo catalogo</p>
      </div>

      {error && (
        <div className="p-5 bg-red-100 border-l-4 border-red-500 rounded-lg text-red-900 text-sm font-semibold">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="p-5 bg-green-100 border-l-4 border-green-500 rounded-lg text-green-900 text-sm font-semibold">
          ✅ {success}
        </div>
      )}

      {/* Tab mobile */}
      <div className="flex md:hidden rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
        <button
          onClick={() => setMobileTab('aggiungi')}
          className={`flex-1 py-3 font-bold text-sm transition-all ${
            mobileTab === 'aggiungi'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          ➕ {isModifying ? 'Modifica' : 'Aggiungi'}
        </button>
        <button
          onClick={() => setMobileTab('lista')}
          className={`flex-1 py-3 font-bold text-sm transition-all ${
            mobileTab === 'lista'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          📦 Lista ({prodotti.length})
        </button>
      </div>

      {/* Layout Bicolonna */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        {/* Sezione Sinistra: Form */}
        <div className={`${mobileTab === 'aggiungi' ? 'block' : 'hidden'} md:block min-w-0 bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-xl shadow-lg p-4 sm:p-8`}>
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-black flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">➕</span> Aggiungi Prodotto
            </h2>
            <button
              type="submit"
              form="form-nuovo-prodotto"
              disabled={isSubmitting}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-md hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
            >
              {isSubmitting ? '⏳ Salvando...' : isModifying ? '📝 Modifica' : '✅ Aggiungi'}
            </button>
          </div>

          <form id="form-nuovo-prodotto" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-black mb-2 text-left">
                📦 Nome Prodotto
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none text-black font-semibold text-base"
                placeholder="es. Pomodori"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2 text-left">
                🏷️ Tipologia
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
                  className="flex-1 min-w-0 px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none text-black font-semibold text-base"
                  placeholder="es. kg"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleAggiungiTipologia}
                  disabled={isSubmitting}
                  className="flex-none flex items-center justify-center bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-2xl hover:from-green-700 hover:to-green-800 transition disabled:from-gray-400 disabled:to-gray-500 shadow-md active:scale-95"
                  style={{ minWidth: '48px', minHeight: '48px', width: '48px', height: '48px' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Lista Tipologie Aggiunte */}
            {tipologieArray.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-black mb-3 text-left">
                  ✅ Tipologie ({tipologieArray.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tipologieArray.map((tip, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white border-2 border-green-300 rounded-lg shadow-sm hover:shadow-md transition"
                    >
                      <span className="text-sm text-black font-bold">{capitalize(tip)}</span>
                      <button
                        type="button"
                        onClick={() => handleRimuoviTipologia(index)}
                        disabled={isSubmitting}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm font-bold hover:bg-red-600 transition disabled:bg-gray-400 hover:scale-110"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Sezione Destra: Lista Prodotti */}
        <div className={`${mobileTab === 'lista' ? 'block' : 'hidden'} md:block min-w-0 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl shadow-lg p-4 sm:p-8`}>
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-black flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">📦</span> Prodotti ({prodotti.length})
            </h2>
            <button
              onClick={() => fetchProdotti()}
              disabled={listLoading}
              className="px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition disabled:from-gray-400 disabled:to-gray-500 shadow-md hover:scale-105 disabled:hover:scale-100 flex items-center gap-1"
            >
              <span className={listLoading ? 'animate-spin inline-block' : ''}>🔄</span>
              {listLoading ? 'Aggiornamento...' : 'Aggiorna'}
            </button>
          </div>

          {/* Filtro di Ricerca */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 Cerca prodotto..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-black font-semibold"
            />
          </div>

          {listLoading ? (
            <div className="flex items-center gap-2 text-blue-700 font-semibold py-4">
              <div className="h-5 w-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
              Aggiornamento lista...
            </div>
          ) : prodotti.length === 0 ? (
            <div className="text-black font-semibold italic">❌ Nessun prodotto presente</div>
          ) : (
            <>
              {(() => {
                const filteredProdotti = prodotti.filter((p) => {
                  const searchLower = searchFilter.toLowerCase()
                  const nomeMatch = p.nome.toLowerCase().includes(searchLower)
                  const tipologieMatch = parseTipologie(p.tipologie_possibili).some(tip =>
                    tip.toLowerCase().includes(searchLower)
                  )
                  return nomeMatch || tipologieMatch
                })

                return (
                  <>
                    {filteredProdotti.length === 0 && searchFilter ? (
                      <div className="text-black font-semibold italic">❌ Nessun prodotto corrisponde alla ricerca</div>
                    ) : (
                      <div className="space-y-3 max-h-[62vh] overflow-y-auto md:max-h-96 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {filteredProdotti.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-left truncate uppercase">{p.nome}</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-bold whitespace-nowrap flex-shrink-0 ${
                          p.attivo ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {p.attivo ? 'Attivo' : 'Non attivo'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {parseTipologie(p.tipologie_possibili).map((tip, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-verde-orto-100 text-verde-orto-700 rounded"
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
                        <div className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors pointer-events-none ${
                          p.attivo ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                              p.attivo ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </div>
                      </button>
                      <button
                        onClick={() => handleModificaProdotto(p)}
                        className="bg-blue-100 text-blue-600 rounded text-sm font-semibold hover:bg-blue-200 transition flex items-center justify-center"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="bg-red-100 text-red-600 rounded text-sm font-semibold hover:bg-red-200 transition flex items-center justify-center"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      >
                        🗑️
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
    </div>
  )
}

export default Prodotti
