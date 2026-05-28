import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { createProdotto } from '../services/prodottiService'

export function Prodotti() {
  const [prodotti, setProdotti] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [tipologie, setTipologie] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!nome.trim() || !tipologie.trim()) {
      alert('Compila tutti i campi')
      return
    }

    setIsSubmitting(true)
    try {
      const { error: err } = await createProdotto(nome.trim(), tipologie)

      if (err) throw err

      setNome('')
      setTipologie('')
      setShowForm(false)
      await fetchProdotti()
      alert('Prodotto aggiunto con successo!')
    } catch (err) {
      alert('Errore: ' + err.message)
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
      await fetchProdotti()
      alert('Prodotto eliminato!')
    } catch (err) {
      alert('Errore: ' + err.message)
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🛒 Prodotti</h1>
        <p className="text-gray-600 mt-2">Gestisci il catalogo dei prodotti.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">➕ Aggiungi Prodotto</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
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
                Tipologie (separate da ;)
              </label>
              <input
                type="text"
                value={tipologie}
                onChange={(e) => setTipologie(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-orto-500 outline-none text-black"
                placeholder="es. kg;pezzo;cassetta"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Inserisci le tipologie separate da punto e virgola
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-verde-orto-600 text-white rounded-lg font-semibold hover:bg-verde-orto-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : 'Aggiungi'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setNome('')
                  setTipologie('')
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-verde-orto-600 text-white rounded-lg font-semibold hover:bg-verde-orto-700 transition"
        >
          ➕ Nuovo Prodotto
        </button>
      )}

      {/* Prodotti List */}
      {prodotti.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          Nessun prodotto ancora.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Tipologie
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Azione
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {prodotti.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{p.nome}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {p.tipologie_possibili}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition"
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Prodotti
