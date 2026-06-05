import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { createProdotto, updateProdotto, deleteProdotto } from '../services/prodottiService'
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

  useEffect(() => {
    fetchProdotti()
  }, [])

  const fetchProdotti = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase.from('prodotti').select('*')
      if (err) throw err
      setProdotti(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
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
      } else {
        // Modalità creazione
        const { error: err } = await createProdotto(nomeLower, tipologieStr)

        if (err) throw err
        setSuccess('Prodotto aggiunto con successo!')
      }

      resetForm()
      await fetchProdotti()
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-4 shadow-xl">
        <h1 className="text-4xl font-black mb-2">🛒 Gestione Prodotti</h1>
        <p className="text-green-100 text-lg font-semibold">Aggiungi, modifica o elimina i prodotti del tuo catalogo</p>
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

      {/* Layout Bicolonna */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Sezione Sinistra: Form sempre visibile */}
        <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black flex items-center gap-2">
              <span className="text-3xl">➕</span> Aggiungi Prodotto
            </h2>
            <button
              type="submit"
              form="form-nuovo-prodotto"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-md hover:scale-105 disabled:hover:scale-100"
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
                className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none text-black font-semibold"
                placeholder="es. Pomodori"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2 text-left">
                🏷️ Tipologia
              </label>
              <div className="flex gap-2">
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
                  className="flex-1 px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none text-black font-semibold"
                  placeholder="es. kg"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleAggiungiTipologia}
                  disabled={isSubmitting}
                  className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition disabled:from-gray-400 disabled:to-gray-500 whitespace-nowrap shadow-md hover:scale-105 disabled:hover:scale-100"
                >
                  ➕
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
        <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black flex items-center gap-2">
              <span className="text-3xl">📦</span> Prodotti ({prodotti.length})
            </h2>
            <button
              onClick={fetchProdotti}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition disabled:from-gray-400 disabled:to-gray-500 shadow-md hover:scale-105 disabled:hover:scale-100"
            >
              🔄 Aggiorna
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

          {loading ? (
            <div className="text-black font-semibold">⏳ Caricamento...</div>
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
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredProdotti.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-left">{capitalize(p.nome)}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
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
                    <div className="ml-2 flex flex-col gap-2">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-semibold hover:bg-red-200 transition"
                      >
                        ❌
                      </button>
                      <button
                        onClick={() => handleModificaProdotto(p)}
                        className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-semibold hover:bg-blue-200 transition"
                      >
                        ✏️
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
