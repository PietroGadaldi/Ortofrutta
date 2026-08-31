import { useState, useEffect, useRef } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns'
import { it } from 'date-fns/locale'
import { IconCalendar, IconChevronLeft, IconChevronRight } from './icons'
import { focusAdjacentField } from '../utils/fieldNav'

/**
 * CalendarPicker component
 * Interactive calendar for selecting order dates
 * @param {Date} selectedDate - Currently selected date
 * @param {Function} onSelectDate - Callback when date is selected
 * @param {Array<Date>} disabledDates - Dates that cannot be selected (optional)
 * @param {boolean} autoFocus - Focus del calendario all'apertura (uso da tastiera)
 */
export function CalendarPicker({ selectedDate, onSelectDate, disabledDates = [], autoFocus = false }) {
  const [currentMonth, setCurrentMonth] = useState(() => selectedDate || new Date())
  const gridRef = useRef(null)

  // Il mese visualizzato segue la data selezionata (es. navigazione con le frecce
  // oltre il fine mese, o "Ordina per domani" a cavallo del mese)
  useEffect(() => {
    if (selectedDate) setCurrentMonth(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    if (autoFocus) gridRef.current?.focus()
  }, [autoFocus])

  const isDateDisabled = (date) =>
    isBefore(startOfDay(date), startOfDay(new Date())) ||
    disabledDates.some((d) => isSameDay(d, date))

  // Frecce sinistra/destra: giorno precedente/successivo (il calendario è un
  // unico tab stop, i singoli giorni hanno tabIndex -1).
  // Invio e freccia giù passano al campo successivo, freccia su al precedente.
  const handleGridKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      focusAdjacentField(e.currentTarget, 1)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusAdjacentField(e.currentTarget, -1)
      return
    }
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    if (!selectedDate) return
    e.preventDefault()
    const candidate = addDays(selectedDate, e.key === 'ArrowRight' ? 1 : -1)
    if (isDateDisabled(candidate)) return
    onSelectDate(candidate)
  }

  const renderHeader = () => {
    const monthText = format(currentMonth, 'MMMM yyyy', { locale: it })
    const capitalizedMonth = monthText.charAt(0).toUpperCase() + monthText.slice(1)

    return (
      <div className="flex items-center justify-between mb-5 px-1">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          tabIndex={-1}
          className="btn-icon border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 shadow-sm"
          title="Mese precedente"
        >
          <IconChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">
          {capitalizedMonth}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          tabIndex={-1}
          className="btn-icon border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 shadow-sm"
          title="Mese prossimo"
        >
          <IconChevronRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  const renderDays = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
    return (
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-slate-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd')
        const cloneDay = day

        // Check if date is disabled or in the past
        const isPast = isBefore(startOfDay(cloneDay), startOfDay(new Date()))
        const isDisabled =
          !isSameMonth(day, monthStart) ||
          isPast ||
          disabledDates.some((d) => isSameDay(d, cloneDay))

        const isSelected = selectedDate && isSameDay(cloneDay, selectedDate)
        const isTodayDate = isToday(cloneDay)

        days.push(
          <button
            key={day}
            onClick={() => !isDisabled && onSelectDate(cloneDay)}
            disabled={isDisabled}
            tabIndex={-1}
            className={`
              min-h-[44px] p-1 sm:p-2 text-sm font-medium rounded-lg transition-colors text-center
              ${!isSameMonth(day, monthStart) ? 'text-slate-200' : ''}
              ${isDisabled && isSameMonth(day, monthStart) ? 'text-slate-300 cursor-not-allowed' : ''}
              ${isSelected ? 'bg-verde-orto-600 text-white font-semibold shadow-sm' : ''}
              ${!isDisabled && !isSelected && isSameMonth(day, monthStart) ? 'hover:bg-verde-orto-50 text-slate-700 cursor-pointer' : ''}
              ${isTodayDate && !isSelected ? 'ring-1 ring-inset ring-verde-orto-500 text-verde-orto-700 font-semibold' : ''}
            `}
          >
            {formattedDate}
          </button>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day} className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
          {days}
        </div>
      )
      days = []
    }

    return <div>{rows}</div>
  }

  return (
    <div className="card card-pad">
      <h3 className="section-title mb-4 flex items-center gap-2">
        <IconCalendar className="w-5 h-5 text-verde-orto-600" />
        Data di consegna
      </h3>
      {/* Unico tab stop del calendario: da tastiera si cambia giorno con ← → */}
      <div
        ref={gridRef}
        tabIndex={0}
        role="group"
        data-kbfield="calendario"
        aria-label="Calendario data di consegna. Frecce sinistra e destra per cambiare giorno, Invio per passare al campo successivo"
        onKeyDown={handleGridKeyDown}
        className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-verde-orto-500 focus-visible:ring-offset-2"
      >
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
      {selectedDate && (
        <div className="mt-5 rounded-lg bg-verde-orto-50 border border-verde-orto-200 px-4 py-3 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-verde-orto-700">
            Data selezionata
          </p>
          <p className="text-[15px] text-verde-orto-900 font-semibold mt-0.5">
            {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: it })}
          </p>
        </div>
      )}
    </div>
  )
}
