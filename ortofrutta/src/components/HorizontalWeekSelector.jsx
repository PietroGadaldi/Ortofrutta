import { useState, useEffect, useRef } from 'react'
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, isSameDay, startOfDay, startOfWeek, startOfMonth, getDate, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { getOrdiniCountsByDates } from '../services/ordiniService'

/**
 * HorizontalWeekSelector component
 * Horizontal scrollable calendar showing 7 days of a week with navigation
 * @param {Date} selectedDate - Currently selected date
 * @param {Function} onSelectDate - Callback when date is selected
 */
export function HorizontalWeekSelector({ selectedDate, onSelectDate }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [visibleDays, setVisibleDays] = useState([])
  const [ordersPerDay, setOrdersPerDay] = useState({})
  const [loading, setLoading] = useState(false)
  const [filterDate, setFilterDate] = useState('')
  const scrollContainerRef = useRef(null)

  // Generate visible days (7 days of the week)
  useEffect(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i))
    }
    setVisibleDays(days)
    fetchOrderCounts(days)
  }, [weekStart])

  // Update week and select date when filter date changes
  useEffect(() => {
    if (filterDate) {
      try {
        const filteredDate = parseISO(filterDate)
        const newWeekStart = startOfWeek(filteredDate, { weekStartsOn: 1 })
        
        // Update week start
        setWeekStart(newWeekStart)
        
        // Update visible days directly
        const days = []
        for (let i = 0; i < 7; i++) {
          days.push(addDays(newWeekStart, i))
        }
        setVisibleDays(days)
        fetchOrderCounts(days)
        
        // Also select the filtered date
        onSelectDate(startOfDay(filteredDate))
      } catch (err) {
        console.error('Error parsing filter date:', err)
      }
    }
  }, [filterDate, onSelectDate])

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

  // Navigate to previous month
  const handlePrevMonth = () => {
    setWeekStart(startOfWeek(subMonths(weekStart, 1), { weekStartsOn: 1 }))
  }

  // Navigate to previous week
  const handlePrevWeek = () => {
    setWeekStart(subWeeks(weekStart, 1))
  }

  // Navigate to next week
  const handleNextWeek = () => {
    setWeekStart(addWeeks(weekStart, 1))
  }

  // Navigate to next month
  const handleNextMonth = () => {
    setWeekStart(startOfWeek(addMonths(weekStart, 1), { weekStartsOn: 1 }))
  }

  // Handle day selection - updates week and selected date
  const handleDayClick = (day) => {
    const selectedDay = startOfDay(day)
    const newWeekStart = startOfWeek(selectedDay, { weekStartsOn: 1 })
    
    // Update week first
    setWeekStart(newWeekStart)
    
    // Select the date to load orders
    onSelectDate(selectedDay)
  }

  // Handle mouse wheel scrolling
  const handleWheel = (e) => {
    if (scrollContainerRef.current) {
      e.preventDefault()
      
      // Scroll right with wheel down, left with wheel up
      const scrollAmount = e.deltaY > 0 ? 100 : -100
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const getDateKey = (date) => format(date, 'yyyy-MM-dd')
  
  // Calculate week number within the month
  const dayOfMonth = getDate(weekStart)
  const firstDayOfMonth = startOfMonth(weekStart)
  const firstDayOfWeekNumber = firstDayOfMonth.getDay() // 0 = domenica, 1 = lunedì, etc
  // Convert to 0-6 where 0 = lunedì
  const adjustedFirstDay = firstDayOfWeekNumber === 0 ? 6 : firstDayOfWeekNumber - 1
  const weekOfMonth = Math.ceil((dayOfMonth + adjustedFirstDay) / 7)
  const monthYear = format(weekStart, 'MMMM yyyy', { locale: it })

  return (
    <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-4 shadow-lg">
      {/* Header with month/year and filter */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-amber-300">
        <p className="text-lg font-bold text-amber-900">
          {monthYear.charAt(0).toUpperCase() + monthYear.slice(1)}
        </p>
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-amber-900">Filtra per data:</label>
          <input
            type="date"
            value={filterDate || format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-black font-semibold"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="px-3 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-bold"
            >
              ✕ Azzera
            </button>
          )}
        </div>
      </div>

      {/* Navigation controls and days */}
      <div className="flex items-center justify-center gap-3">
        {/* Previous Month Button (Outer) */}
        <button
          onClick={handlePrevMonth}
          className="flex-shrink-0 p-3 bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-100 rounded-lg transition-all hover:scale-110 font-bold shadow-md text-lg"
          title="Mese precedente"
        >
          {'<<'}
        </button>

        {/* Previous Week Button (Inner) */}
        <button
          onClick={handlePrevWeek}
          className="flex-shrink-0 p-3 bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-100 rounded-lg transition-all hover:scale-110 font-bold shadow-md"
          title="Settimana precedente"
        >
          {'<'}
        </button>

        {/* Days Scroll Container */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className="flex-1 overflow-x-auto scroll-smooth"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="flex gap-3 min-w-max pb-2 justify-center">
            {visibleDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())
              const dateKey = getDateKey(day)
              const count = ordersPerDay[dateKey] || 0
              const dayName = format(day, 'EEE', { locale: it }).toUpperCase()
              const dayDate = format(day, 'dd/MM')

              return (
                <button
                  key={dateKey}
                  onClick={() => handleDayClick(day)}
                  className={`
                    flex-shrink-0 w-28 py-3 px-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2
                    ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-600 to-amber-700 text-white border-amber-800 shadow-lg'
                        : isToday
                        ? 'bg-white text-amber-900 border-amber-400 shadow-md'
                        : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400'
                    }
                  `}
                >
                  <div className="text-sm font-bold">{dayName}</div>
                  <div className={`text-base font-bold ${isSelected ? 'text-white' : 'text-amber-600'}`}>
                    {dayDate}
                  </div>
                  <div
                    className={`
                      text-xs font-bold px-2 py-1 rounded-full
                      ${
                        isSelected
                          ? 'bg-white text-amber-700'
                          : 'bg-amber-100 text-amber-800'
                      }
                    `}
                  >
                    {loading ? '...' : count}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Next Week Button (Inner) */}
        <button
          onClick={handleNextWeek}
          className="flex-shrink-0 p-3 bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-100 rounded-lg transition-all hover:scale-110 font-bold shadow-md"
          title="Settimana successiva"
        >
          {'>'}
        </button>

        {/* Next Month Button (Outer) */}
        <button
          onClick={handleNextMonth}
          className="flex-shrink-0 p-3 bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-100 rounded-lg transition-all hover:scale-110 font-bold shadow-md text-lg"
          title="Mese successivo"
        >
          {'>>'}
        </button>
      </div>
    </div>
  )
}
