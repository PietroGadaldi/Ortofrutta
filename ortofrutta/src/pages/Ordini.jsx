import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { formatDate } from '../utils/formatters'

export function Ordini() {
  const [ordini, setOrdini] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrdini()
  }, [])

  const fetchOrdini = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('ordini')
        .select(
          `
          id,
          data_creazione,
          completato,
          profili (nome),
          dettagli_ordine (quantita, tipologia, nome_custom, prodotti (nome))
        `
        )
        .order('data_creazione', { ascending: false })

      if (err) throw err
      setOrdini(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (ordineId, currentStatus) => {
    try {
      const { error: err } = await supabase
        .from('ordini')
        .update({ completato: !currentStatus })
        .eq('id', ordineId)

      if (err) throw err
      await fetchOrdini()
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
        <h1 className="text-3xl font-bold text-gray-900">📋 Ordini</h1>
        <p className="text-gray-600 mt-2">Gestisci gli ordini ricevuti dai clienti.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {ordini.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          Nessun ordine.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Prodotti
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Azione
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ordini.map((ordine) => (
                  <tr key={ordine.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900 uppercase">{ordine.profili?.nome}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {formatDate(ordine.data_creazione)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {ordine.dettagli_ordine?.length || 0}
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
                    <td className="px-6 py-3 text-sm">
                      <button
                        onClick={() => handleToggleStatus(ordine.id, ordine.completato)}
                        className="px-3 py-1 bg-verde-orto-600 text-white rounded text-xs font-semibold hover:bg-verde-orto-700 transition"
                      >
                        {ordine.completato ? 'Riaprendi' : 'Completa'}
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

export default Ordini
