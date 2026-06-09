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
        <h1 className="text-2xl sm:text-4xl font-black mb-2">🔧 Pannello Amministrativo</h1>
        <p className="text-green-100 text-sm sm:text-lg font-semibold">Gestisci ordini, prodotti e utenti del tuo negozio</p>
      </div>

      {/* Combined Stats and Navigation */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Sinistra: Ordini */}
          <Link
            to="/ordini"
            className="group bg-gradient-to-br from-white to-amber-50 border-2 border-amber-300 rounded-xl p-5 sm:p-8 shadow-lg hover:shadow-xl hover:border-amber-400 transition-all transform hover:scale-105 flex sm:block items-center gap-4"
          >
            <div className="text-4xl sm:text-5xl sm:mb-4 group-hover:scale-110 transition-transform flex-shrink-0">📦</div>
            <div className="flex-1 sm:block">
              <h3 className="text-xl sm:text-2xl font-bold text-black sm:mb-2">Ordini</h3>
              <p className="text-xs sm:text-sm text-black font-semibold sm:mb-6">
                Ordini per oggi
              </p>
              <div className="inline-block bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-black text-2xl sm:text-3xl mt-1 sm:mt-0">
                {stats.ordini}
              </div>
            </div>
            <p className="hidden sm:block text-xs text-amber-800 mt-4 font-semibold">
              📅 Clicca per gestire gli ordini
            </p>
          </Link>

          {/* Centro: Prodotti */}
          <Link
            to="/prodotti"
            className="group bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-xl p-5 sm:p-8 shadow-lg hover:shadow-xl hover:border-green-400 transition-all transform hover:scale-105 flex sm:block items-center gap-4"
          >
            <div className="text-4xl sm:text-5xl sm:mb-4 group-hover:scale-110 transition-transform flex-shrink-0">🥬</div>
            <div className="flex-1 sm:block">
              <h3 className="text-xl sm:text-2xl font-bold text-black sm:mb-2">Prodotti</h3>
              <p className="text-xs sm:text-sm text-black font-semibold sm:mb-6">
                Catalogo disponibile
              </p>
              <div className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-black text-2xl sm:text-3xl mt-1 sm:mt-0">
                {stats.prodotti}
              </div>
            </div>
            <p className="hidden sm:block text-xs text-green-800 mt-4 font-semibold">
              📝 Clicca per gestire i prodotti
            </p>
          </Link>

          {/* Destra: Clienti */}
          <Link
            to="/utenti"
            className="group bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-5 sm:p-8 shadow-lg hover:shadow-xl hover:border-blue-400 transition-all transform hover:scale-105 flex sm:block items-center gap-4"
          >
            <div className="text-4xl sm:text-5xl sm:mb-4 group-hover:scale-110 transition-transform flex-shrink-0">👥</div>
            <div className="flex-1 sm:block">
              <h3 className="text-xl sm:text-2xl font-bold text-black sm:mb-2">Clienti</h3>
              <p className="text-xs sm:text-sm text-black font-semibold sm:mb-6">
                Clienti registrati
              </p>
              <div className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-black text-2xl sm:text-3xl mt-1 sm:mt-0">
                {stats.clienti}
              </div>
            </div>
            <p className="hidden sm:block text-xs text-blue-800 mt-4 font-semibold">
              👤 Clicca per gestire gli utenti
            </p>
          </Link>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
