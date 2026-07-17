import { useState, useEffect, useRef } from 'react'
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, isSameDay, startOfDay, startOfWeek, startOfMonth, getDate, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { getOrdiniCountsByDates } from '../services/ordiniService'
import { IconChevronLeft, IconChevronRight, IconChevronDoubleLeft, IconChevronDoubleRight } from './icons'

/**
 * HorizontalWeekSelector component
 * Horizontal scrollable calendar showing 7 days of a week with navigation
 * @param {Date} selectedDate - Currently selected date
 * @param {Function} onSelectDate - Callback when date is selected
 */
export function HorizontalWeekSelector({ selectedDate, onSelectDate }) {
  // Inizializza l'inizio della settimana in base alla data selezionata passata come prop
  const [weekStart, setWeekStart] = useState(() => 
    startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 })
  )
  
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
    
    // Azzera il filtro manuale quando si interagisce con i giorni del calendario
    setFilterDate('')

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
    <div className="card p-3 sm:p-4">
      {/* Header with month/year and filter */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-slate-200 gap-2">
        <p className="text-sm sm:text-base font-semibold text-slate-900 flex-shrink-0">
          {monthYear.charAt(0).toUpperCase() + monthYear.slice(1)}
        </p>
        <div className="flex items-center gap-2">
          <label className="hidden md:block text-[13px] font-semibold text-slate-600">Filtra per data:</label>
          <input
            type="date"
            value={filterDate || format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setFilterDate(e.target.value)}
            className="input w-auto px-2 sm:px-3 py-1.5 sm:py-2 text-sm"
          />
          {filterDate && (
            <button
              onClick={() => {
                const today = startOfDay(new Date())
                setFilterDate('')
                onSelectDate(today)
                setWeekStart(startOfWeek(today, { weekStartsOn: 1 }))
              }}
              className="btn-danger-soft px-2.5 py-1.5 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Navigation controls and days */}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {/* Previous Month Button (Outer) - hidden on mobile */}
        <button
          onClick={handlePrevMonth}
          className="hidden sm:inline-flex btn-icon flex-shrink-0 border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 shadow-sm"
          title="Mese precedente"
        >
          <IconChevronDoubleLeft className="w-4 h-4" />
        </button>

        {/* Previous Week Button (Inner) */}
        <button
          onClick={handlePrevWeek}
          className="btn-icon flex-shrink-0 border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 shadow-sm"
          title="Settimana precedente"
        >
          <IconChevronLeft className="w-4 h-4" />
        </button>

        {/* Days Scroll Container */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className="flex-1 overflow-x-auto scroll-smooth"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="flex gap-1 sm:gap-3 min-w-max pb-1 sm:pb-2 justify-center">
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
                    flex-shrink-0 w-11 sm:w-20 md:w-28 py-2 sm:py-3 px-1 sm:px-2 rounded-lg border transition-colors flex flex-col items-center justify-center gap-1 sm:gap-1.5
                    ${
                      isSelected
                        ? 'bg-verde-orto-600 text-white border-verde-orto-700 shadow-sm'
                        : isToday
                        ? 'bg-verde-orto-50 text-slate-900 border-verde-orto-400'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-verde-orto-400 hover:bg-verde-orto-50/50'
                    }
                  `}
                >
                  <div className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide leading-none ${isSelected ? 'text-verde-orto-100' : 'text-slate-400'}`}>{dayName}</div>
                  <div className={`text-xs sm:text-[15px] font-bold tabular-nums ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {dayDate}
                  </div>
                  <div
                    className={`
                      text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full tabular-nums
                      ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : count > 0
                            ? 'bg-verde-orto-50 text-verde-orto-700 ring-1 ring-inset ring-verde-orto-600/20'
                            : 'bg-slate-100 text-slate-400'
                      }
                    `}
                  >
                    {loading ? '·' : count}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Next Week Button (Inner) */}
        <button
          onClick={handleNextWeek}
          className="btn-icon flex-shrink-0 border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 shadow-sm"
          title="Settimana successiva"
        >
          <IconChevronRight className="w-4 h-4" />
        </button>

        {/* Next Month Button (Outer) - hidden on mobile */}
        <button
          onClick={handleNextMonth}
          className="hidden sm:inline-flex btn-icon flex-shrink-0 border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 shadow-sm"
          title="Mese successivo"
        >
          <IconChevronDoubleRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
