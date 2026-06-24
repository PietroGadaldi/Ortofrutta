/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * Validate password (min 6 chars — Supabase minimum)
 * @param {string} password
 * @returns {boolean}
 */
export const validatePassword = (password) => {
  return password && password.length >= 6
}

/**
 * Validate product name (non-empty, unique check done server-side)
 * @param {string} nome
 * @returns {boolean}
 */
export const validateProdottoNome = (nome) => {
  return nome && nome.trim().length > 0
}

/**
 * Validate tipologie string (CSV format)
 * @param {string} tipologie
 * @returns {boolean}
 */
export const validateTipologie = (tipologie) => {
  return tipologie && tipologie.trim().length > 0
}

/**
 * Validate order quantity (positive number)
 * @param {number|string} quantita
 * @returns {boolean}
 */
export const validateQuantita = (quantita) => {
  const num = Number(quantita)
  return !isNaN(num) && num > 0
}

/**
 * Validate form field (generic)
 * @param {string} value
 * @param {string} fieldType - 'email', 'password', 'text', 'number'
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateField = (value, fieldType = 'text') => {
  if (!value) {
    return { valid: false, error: 'Campo obbligatorio' }
  }

  switch (fieldType) {
    case 'email':
      if (!validateEmail(value)) {
        return { valid: false, error: 'Email non valida' }
      }
      break
    case 'password':
      if (!validatePassword(value)) {
        return { valid: false, error: 'Password deve avere almeno 6 caratteri' }
      }
      break
    case 'number':
      if (isNaN(Number(value)) || Number(value) <= 0) {
        return { valid: false, error: 'Inserisci un numero positivo' }
      }
      break
  }

  return { valid: true, error: null }
}

export default {
  validateEmail,
  validatePassword,
  validateProdottoNome,
  validateTipologie,
  validateQuantita,
  validateField,
}
