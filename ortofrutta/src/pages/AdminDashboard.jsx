import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { startOfDay, format } from 'date-fns'
import { it } from 'date-fns/locale'
import { supabase } from '../services/supabaseClient'
import { getClientList } from '../services/profiliService'
import { getOrdiniCountByDate } from '../services/ordiniService'
import { IconClipboard, IconPackage, IconUsers, IconChevronRight } from '../components/icons'

export function AdminDashboard() {
  const [stats, setStats] = useState({ ordini: 0, clienti: 0, prodotti: 0 })
  const [loading, setLoading] = useState(true)
  const [todayDate] = useState(startOfDay(new Date()))

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

  const cards = [
    {
      to: '/ordini',
      label: 'Ordini di oggi',
      value: stats.ordini,
      hint: 'Gestisci gli ordini',
      Icon: IconClipboard,
      iconClass: 'bg-amber-50 text-amber-600',
    },
    {
      to: '/prodotti',
      label: 'Prodotti a catalogo',
      value: stats.prodotti,
      hint: 'Gestisci il catalogo',
      Icon: IconPackage,
      iconClass: 'bg-verde-orto-50 text-verde-orto-700',
    },
    {
      to: '/utenti',
      label: 'Clienti registrati',
      value: stats.clienti,
      hint: 'Gestisci gli utenti',
      Icon: IconUsers,
      iconClass: 'bg-blue-50 text-blue-600',
    },
  ]

  const todayLabel = format(todayDate, 'EEEE d MMMM yyyy', { locale: it })

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Panoramica del negozio · {todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)}
        </p>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {cards.map(({ to, label, value, hint, Icon, iconClass }) => (
            <Link
              key={to}
              to={to}
              className="card p-5 group hover:border-verde-orto-300 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${iconClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <IconChevronRight className="w-5 h-5 text-slate-300 group-hover:text-verde-orto-600 transition-colors" />
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
              <p className="mt-1.5 text-[13px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
              <p className="mt-3 text-sm font-medium text-verde-orto-700 group-hover:underline">{hint}</p>
            </Link>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
