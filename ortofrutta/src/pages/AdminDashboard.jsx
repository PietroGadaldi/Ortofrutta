import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

export function AdminDashboard() {
  const [stats, setStats] = useState({ ordini: 0, clienti: 0, prodotti: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordiniRes, clientiRes, prodottiRes] = await Promise.all([
          supabase.from('ordini').select('id', { count: 'exact' }),
          supabase
            .from('profili')
            .select('id', { count: 'exact' })
            .eq('ruolo', 'cliente'),
          supabase.from('prodotti').select('id', { count: 'exact' }),
        ])

        setStats({
          ordini: ordiniRes.count || 0,
          clienti: clientiRes.count || 0,
          prodotti: prodottiRes.count || 0,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🔧 Pannello Amministrativo</h1>
        <p className="text-gray-600 mt-2">Gestisci ordini, prodotti e utenti.</p>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-verde-orto-600">
            <div className="text-4xl text-verde-orto-600 mb-2">📦</div>
            <p className="text-gray-600 text-sm">Ordini Totali</p>
            <p className="text-3xl font-bold text-gray-900">{stats.ordini}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-verde-orto-600">
            <div className="text-4xl text-verde-orto-600 mb-2">👥</div>
            <p className="text-gray-600 text-sm">Clienti</p>
            <p className="text-3xl font-bold text-gray-900">{stats.clienti}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-verde-orto-600">
            <div className="text-4xl text-verde-orto-600 mb-2">🥬</div>
            <p className="text-gray-600 text-sm">Prodotti</p>
            <p className="text-3xl font-bold text-gray-900">{stats.prodotti}</p>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link
          to="/ordini"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition hover:border-l-4 hover:border-verde-orto-600"
        >
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Ordini</h3>
          <p className="text-gray-600 text-sm">Visualizza e gestisci gli ordini ricevuti.</p>
        </Link>

        <Link
          to="/prodotti"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition hover:border-l-4 hover:border-verde-orto-600"
        >
          <div className="text-4xl mb-3">🛒</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Prodotti</h3>
          <p className="text-gray-600 text-sm">Aggiungi, modifica o elimina prodotti.</p>
        </Link>

        <Link
          to="/utenti"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition hover:border-l-4 hover:border-verde-orto-600"
        >
          <div className="text-4xl mb-3">👤</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Utenti</h3>
          <p className="text-gray-600 text-sm">Crea nuovi account per clienti e titolari.</p>
        </Link>
      </div>
    </div>
  )
}

export default AdminDashboard
