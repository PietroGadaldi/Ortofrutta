import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { formatDate, formatTipologieList } from '../utils/formatters'
import { parseTipologie } from '../utils/constants'

export function Dashboard() {
  const { user } = useAuth()
  const [ordini, setOrdini] = useState([])
  const [prodotti, setProdotti] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNewOrderForm, setShowNewOrderForm] = useState(false)
  const [selectedProdotto, setSelectedProdotto] = useState(null)
  const [selectedTipologia, setSelectedTipologia] = useState('')
  const [quantita, setQuantita] = useState('')

  // Fetch user ordini and prodotti on mount
  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch prodotti
      const { data: prodData, error: prodError } = await supabase
        .from('prodotti')
        .select('*')

      if (prodError) throw prodError
      setProdotti(prodData || [])

      // Fetch ordini dell'utente
      const { data: ordData, error: ordError } = await supabase
        .from('ordini')
        .select(
          `
          id,
          data_creazione,
          completato,
          dettagli_ordine (
            id,
            quantita,
            tipologia,
            prodotto_id,
            prodotti (nome)
          )
        `
        )
        .eq('cliente_id', user.id)
        .order('data_creazione', { ascending: false })

      if (ordError) throw ordError
      setOrdini(ordData || [])
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault()

    if (!selectedProdotto || !selectedTipologia || !quantita) {
      alert('Compila tutti i campi')
      return
    }

    try {
      // Create ordine
      const { data: ordineData, error: ordineError } = await supabase
        .from('ordini')
        .insert({ cliente_id: user.id })
        .select()

      if (ordineError) throw ordineError

      const ordineId = ordineData[0].id

      // Create dettagli_ordine
      const { error: dettagliError } = await supabase
        .from('dettagli_ordine')
        .insert({
          ordine_id: ordineId,
          prodotto_id: selectedProdotto,
          quantita: Number(quantita),
          tipologia: selectedTipologia,
        })

      if (dettagliError) throw dettagliError

      // Reset form and refresh
      setSelectedProdotto(null)
      setSelectedTipologia('')
      setQuantita('')
      setShowNewOrderForm(false)
      await fetchData()
      alert('Ordine creato con successo!')
    } catch (err) {
      alert('Errore: ' + err.message)
      console.error(err)
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Ordini</h1>
        <p className="text-gray-600 mt-2">Benvenuto! Gestisci i tuoi ordini.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Nuovo Ordine Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📦 Crea Nuovo Ordine</h2>

        {showNewOrderForm ? (
          <form onSubmit={handleCreateOrder} className="space-y-4">
            {/* Prodotto select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prodotto
              </label>
              <select
                value={selectedProdotto || ''}
                onChange={(e) => {
                  setSelectedProdotto(e.target.value)
                  setSelectedTipologia('')
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-orto-500 outline-none"
              >
                <option value="">-- Seleziona un prodotto --</option>
                {prodotti.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipologia select */}
            {selectedProdotto && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipologia
                </label>
                <select
                  value={selectedTipologia}
                  onChange={(e) => setSelectedTipologia(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-orto-500 outline-none"
                >
                  <option value="">-- Seleziona tipologia --</option>
                  {prodotti
                    .find((p) => p.id === selectedProdotto)
                    ?.tipologie_possibili.split(';')
                    .map((t) => (
                      <option key={t} value={t.trim()}>
                        {t.trim()}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Quantita input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantità
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={quantita}
                onChange={(e) => setQuantita(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-orto-500 outline-none"
                placeholder="Inserisci quantità"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-verde-orto-600 text-white rounded-lg font-semibold hover:bg-verde-orto-700 transition"
              >
                Aggiungi all'ordine
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewOrderForm(false)
                  setSelectedProdotto(null)
                  setSelectedTipologia('')
                  setQuantita('')
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Annulla
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowNewOrderForm(true)}
            className="px-6 py-3 bg-verde-orto-600 text-white rounded-lg font-semibold hover:bg-verde-orto-700 transition"
          >
            ➕ Nuovo Ordine
          </button>
        )}
      </div>

      {/* Cronologia Ordini Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Cronologia Ordini</h2>

        {ordini.length === 0 ? (
          <p className="text-gray-600">Nessun ordine ancora.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Prodotti
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Stato
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ordini.map((ordine) => (
                  <tr key={ordine.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {formatDate(ordine.data_creazione)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {ordine.dettagli_ordine?.length || 0} prodotto/i
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ordine.completato
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {ordine.completato ? '✅ Completato' : '⏳ In Sospeso'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
