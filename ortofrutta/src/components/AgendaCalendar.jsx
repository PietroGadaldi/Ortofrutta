import { useState, useEffect } from 'react'
import { format, addDays, subDays, isSameDay, startOfDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { getOrdiniCountsByDates } from '../services/ordiniService'

/**
 * AgendaCalendar component
 * Scrollable vertical calendar showing days with order counts
 * @param {Date} selectedDate - Currently selected date
 * @param {Function} onSelectDate - Callback when date is selected
 */
export function AgendaCalendar({ selectedDate, onSelectDate }) {
  const [visibleDays, setVisibleDays] = useState([])
  const [ordersPerDay, setOrdersPerDay] = useState({})
  const [loading, setLoading] = useState(false)

  // Generate visible days (±7 days from selected date)
  useEffect(() => {
    const start = subDays(selectedDate, 7)
    const end = addDays(selectedDate, 7)
    const days = []

    for (let i = 0; i < 15; i++) {
      days.push(addDays(start, i))
    }

    setVisibleDays(days)
    fetchOrderCounts(days)
  }, [selectedDate])

  // Fetch order counts for visible days
  const fetchOrderCounts = async (days) => {
    setLoading(true)
    try {
      const { data, error } = await getOrdiniCountsByDates(days)
      if (!error && data) {
        const counts = {}
        data.forEach((item) => {
          counts[item.date] = item.count
        })
        setOrdersPerDay(counts)
      }
    } catch (err) {
      console.error('Error fetching order counts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    onSelectDate(subDays(selectedDate, 14))
  }

  const handleNextMonth = () => {
    onSelectDate(addDays(selectedDate, 14))
  }

  const getDateKey = (date) => format(date, 'yyyy-MM-dd')

  return (
    <div className="bg-gradient-to-br from-white to-amber-50 border-2 border-amber-300 rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
        <span className="text-2xl">📅</span> Seleziona Giorno
      </h3>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 text-amber-700 hover:bg-amber-200 rounded-lg transition-all hover:scale-110 font-bold"
        >
          ◀
        </button>
        <span className="text-sm font-bold text-amber-900">
          {format(selectedDate, 'MMMM yyyy', { locale: it })}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-2 text-amber-700 hover:bg-amber-200 rounded-lg transition-all hover:scale-110 font-bold"
        >
          ▶
        </button>
      </div>

      {/* Days List */}
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {visibleDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate)
          const dateKey = getDateKey(day)
          const count = ordersPerDay[dateKey] || 0
          const dayName = format(day, 'EEEE', { locale: it })
          const dayDate = format(day, 'dd/MM/yyyy')

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(startOfDay(day))}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all flex items-center justify-between
                ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-800 shadow-lg'
                    : 'bg-white border-amber-200 text-black hover:border-amber-400 hover:shadow-md'
                }
              `}
            >
              <div className="flex-1">
                <div className="font-bold text-sm capitalize">
                  {dayName}
                </div>
                <div className={`text-xs mt-1 ${isSelected ? 'text-amber-100' : 'text-amber-700'}`}>
                  {dayDate}
                </div>
              </div>

              <div className={`
                px-3 py-1 rounded-full font-bold text-sm
                ${isSelected 
                  ? 'bg-white text-amber-700' 
                  : 'bg-amber-100 text-amber-800'
                }
              `}>
                {loading ? '...' : count}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
