import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { createProdotto, updateProdotto } from '../services/prodottiService'
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
      const { error: err } = await supabase
        .from('prodotti')
        .delete()
        .eq('id', prodottoId)

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
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Layout Bicolonna */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sezione Sinistra: Form sempre visibile */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">➕ Aggiungi Prodotto</h2>
            <button
              type="submit"
              form="form-nuovo-prodotto"
              disabled={isSubmitting}
              className="px-4 py-2 bg-verde-orto-600 text-white rounded-lg font-semibold hover:bg-verde-orto-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : isModifying ? 'Modifica Prodotto' : 'Aggiungi Prodotto'}
            </button>
          </div>

          <form id="form-nuovo-prodotto" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Prodotto
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-orto-500 outline-none text-black"
                placeholder="es. Pomodori"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipologia
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-orto-500 outline-none text-black"
                  placeholder="es. kg"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleAggiungiTipologia}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-verde-orto-600 text-white rounded-lg font-semibold hover:bg-verde-orto-700 transition disabled:opacity-50 whitespace-nowrap"
                >
                  Aggiungi
                </button>
              </div>
            </div>

            {/* Lista Tipologie Aggiunte */}
            {tipologieArray.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipologie Aggiunte ({tipologieArray.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tipologieArray.map((tip, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-verde-orto-50 border border-verde-orto-200 rounded-lg"
                    >
                      <span className="text-sm text-gray-900">{capitalize(tip)}</span>
                      <button
                        type="button"
                        onClick={() => handleRimuoviTipologia(index)}
                        disabled={isSubmitting}
                        className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-semibold hover:bg-red-200 transition disabled:opacity-50"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Sezione Destra: Lista Prodotti */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">📦 Prodotti ({prodotti.length})</h2>
            <button
              onClick={fetchProdotti}
              disabled={loading}
              className="px-3 py-1 text-sm bg-verde-orto-100 text-verde-orto-700 rounded hover:bg-verde-orto-200 transition disabled:opacity-50"
            >
              🔄 Aggiorna
            </button>
          </div>

          {loading ? (
            <div className="text-gray-500 text-sm">Caricamento...</div>
          ) : prodotti.length === 0 ? (
            <div className="text-gray-500 text-sm">Nessun prodotto presente</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {prodotti.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{capitalize(p.nome)}</p>
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
        </div>
      </div>
    </div>
  )
}

export default Prodotti
