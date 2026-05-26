import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { parseTipologie } from './constants'

/**
 * Format date to DD/MM/YYYY HH:mm
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd/MM/yyyy HH:mm', { locale: it })
  } catch (err) {
    return 'Data non disponibile'
  }
}

/**
 * Format date to DD/MM/YYYY
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateOnly = (date) => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd/MM/yyyy', { locale: it })
  } catch (err) {
    return 'Data non disponibile'
  }
}

/**
 * Format time to HH:mm
 * @param {string|Date} date
 * @returns {string}
 */
export const formatTime = (date) => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'HH:mm', { locale: it })
  } catch (err) {
    return 'Ora non disponibile'
  }
}

/**
 * Format tipologie CSV string to readable string
 * @param {string} csv - Semicolon-separated values
 * @returns {string}
 */
export const formatTipologieList = (csv) => {
  const arr = parseTipologie(csv)
  return arr.join(', ')
}

/**
 * Format quantity with unit
 * @param {number} quantity
 * @param {string} unit
 * @returns {string}
 */
export const formatQuantity = (quantity, unit = '') => {
  if (!quantity) return '0'
  const q = Number(quantity).toFixed(2)
  return unit ? `${q} ${unit}` : q
}

/**
 * Format currency (EUR)
 * @param {number} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export default {
  formatDate,
  formatDateOnly,
  formatTime,
  formatTipologieList,
  formatQuantity,
  formatCurrency,
}
