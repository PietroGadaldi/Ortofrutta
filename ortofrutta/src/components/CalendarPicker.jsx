import { useState } from 'react'
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

/**
 * CalendarPicker component
 * Interactive calendar for selecting order dates
 * @param {Date} selectedDate - Currently selected date
 * @param {Function} onSelectDate - Callback when date is selected
 * @param {Array<Date>} disabledDates - Dates that cannot be selected (optional)
 */
export function CalendarPicker({ selectedDate, onSelectDate, disabledDates = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const renderHeader = () => {
    const monthText = format(currentMonth, 'MMMM yyyy', { locale: it })
    const capitalizedMonth = monthText.charAt(0).toUpperCase() + monthText.slice(1)

    return (
      <div className="flex items-center justify-between mb-5 px-1">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
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
      {renderHeader()}
      {renderDays()}
      {renderCells()}
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
