import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { startOfDay } from 'date-fns'
import { supabase } from '../services/supabaseClient'
import { getClientList } from '../services/profiliService'
import { getOrdiniCountByDate } from '../services/ordiniService'

export function AdminDashboard() {
  const [stats, setStats] = useState({ ordini: 0, clienti: 0, prodotti: 0 })
  const [loading, setLoading] = useState(true)
  const [todayDate, setTodayDate] = useState(startOfDay(new Date()))

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch ordini count for today
        const { count: ordiniCount, error: ordiniError } = await getOrdiniCountByDate(todayDate)

        // Fetch prodotti count
        const prodottiRes = await supabase.from('prodotti').select('id', { count: 'exact' })

        // Fetch clienti using the new RLS policy
        const { data: clientiData, error: clientiError } = await getClientList()
        const clientiCount = clientiError ? 0 : (clientiData || []).length

        setStats({
          ordini: ordiniError ? 0 : (ordiniCount || 0),
          clienti: clientiCount,
          prodotti: prodottiRes.count || 0,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [todayDate])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-4 shadow-xl">
        <h1 className="text-4xl font-black mb-2">🔧 Pannello Amministrativo</h1>
        <p className="text-green-100 text-lg font-semibold">Gestisci ordini, prodotti e utenti del tuo negozio</p>
      </div>

      {/* Combined Stats and Navigation */}
      {!loading && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Sinistra: Ordini */}
          <Link
            to="/ordini"
            className="group bg-gradient-to-br from-white to-amber-50 border-2 border-amber-300 rounded-xl p-8 shadow-lg hover:shadow-xl hover:border-amber-400 transition-all transform hover:scale-105"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📦</div>
            <h3 className="text-2xl font-bold text-black mb-2">Ordini</h3>
            <p className="text-sm text-black font-semibold mb-6">
              Ordini per oggi
            </p>
            <div className="inline-block bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-3 rounded-lg font-black text-3xl">
              {stats.ordini}
            </div>
            <p className="text-xs text-amber-800 mt-4 font-semibold">
              📅 Clicca per gestire gli ordini
            </p>
          </Link>

          {/* Centro: Prodotti */}
          <Link
            to="/prodotti"
            className="group bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-xl p-8 shadow-lg hover:shadow-xl hover:border-green-400 transition-all transform hover:scale-105"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🥬</div>
            <h3 className="text-2xl font-bold text-black mb-2">Prodotti</h3>
            <p className="text-sm text-black font-semibold mb-6">
              Catalogo disponibile
            </p>
            <div className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-black text-3xl">
              {stats.prodotti}
            </div>
            <p className="text-xs text-green-800 mt-4 font-semibold">
              📝 Clicca per gestire i prodotti
            </p>
          </Link>

          {/* Destra: Clienti */}
          <Link
            to="/utenti"
            className="group bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-8 shadow-lg hover:shadow-xl hover:border-blue-400 transition-all transform hover:scale-105"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">👥</div>
            <h3 className="text-2xl font-bold text-black mb-2">Clienti</h3>
            <p className="text-sm text-black font-semibold mb-6">
              Clienti registrati
            </p>
            <div className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-black text-3xl">
              {stats.clienti}
            </div>
            <p className="text-xs text-blue-800 mt-4 font-semibold">
              👤 Clicca per gestire gli utenti
            </p>
          </Link>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
