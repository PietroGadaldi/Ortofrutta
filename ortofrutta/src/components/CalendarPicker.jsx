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
      <div className="flex items-center justify-between mb-6 px-2">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 bg-white border-2 border-green-300 hover:bg-green-200 rounded-lg transition-all hover:scale-110"
          title="Mese precedente"
        >
          <span className="text-green-700 font-bold text-lg">{'<<'}</span>
        </button>
        <h2 className="text-xl font-bold text-green-900">
          {capitalizedMonth}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 bg-white border-2 border-green-300 hover:bg-green-200 rounded-lg transition-all hover:scale-110"
          title="Mese prossimo"
        >
          <span className="text-green-700 font-bold text-lg">{'>>'}</span>
        </button>
      </div>
    )
  }

  const renderDays = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
    return (
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-xs sm:text-sm font-bold text-green-700 py-2 bg-green-100 rounded-lg"
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
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

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
              min-h-[44px] p-1 sm:p-2 text-sm font-semibold rounded-lg transition-colors
              ${!isSameMonth(day, monthStart) ? 'text-gray-300' : ''}
              ${isDisabled && isSameMonth(day, monthStart) ? 'text-gray-400 cursor-not-allowed' : ''}
              ${isSelected ? 'bg-green-600 text-white' : ''}
              ${!isDisabled && !isSelected && isSameMonth(day, monthStart) ? 'hover:bg-green-100 text-green-800 cursor-pointer' : ''}
              ${isTodayDate && !isSelected ? 'ring-2 ring-green-400' : ''}
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
    <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-xl p-4 sm:p-6 shadow-lg">
      <h3 className="text-lg sm:text-xl font-bold text-green-900 mb-3 sm:mb-4 flex items-center gap-2">
        <span className="text-xl sm:text-2xl">📅</span> Seleziona Data Ordine
      </h3>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {selectedDate && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-green-50 border-l-4 border-green-500 rounded-lg">
          <p className="text-sm text-green-900 font-semibold">
            Data selezionata:
          </p>
          <p className="text-lg text-green-700 font-bold mt-1">
            {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: it })}
          </p>
        </div>
      )}
    </div>
  )
}
