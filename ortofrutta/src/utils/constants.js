/**
 * User roles
 */
export const RUOLI = {
  CLIENTE: 'cliente',
  TITOLARE: 'titolare',
}

/**
 * Order states
 * false = In Sospeso (pending)
 * true = Completato (completed)
 */
export const STATI_ORDINE = {
  SOSPESO: false,
  COMPLETATO: true,
}

/**
 * Default product types (can be overridden by database)
 */
export const TIPOLOGIE_DEFAULT = ['kg', 'pezzo', 'cassetta']

/**
 * Parse CSV-like string into array
 * @param {string} str - String with semicolon-separated values
 * @returns {string[]}
 */
export const parseTipologie = (str) => {
  if (!str) return TIPOLOGIE_DEFAULT
  return str.split(';').map(t => t.trim()).filter(Boolean)
}

/**
 * Format role for display
 * @param {string} role
 * @returns {string}
 */
export const formatRole = (role) => {
  const roleMap = {
    [RUOLI.CLIENTE]: 'Cliente',
    [RUOLI.TITOLARE]: 'Titolare',
  }
  return roleMap[role] || role
}

/**
 * Format order state for display
 * @param {boolean} completato
 * @returns {string}
 */
export const formatStatoOrdine = (completato) => {
  return completato ? 'Completato' : 'In Sospeso'
}

export default {
  RUOLI,
  STATI_ORDINE,
  TIPOLOGIE_DEFAULT,
  parseTipologie,
  formatRole,
  formatStatoOrdine,
}
