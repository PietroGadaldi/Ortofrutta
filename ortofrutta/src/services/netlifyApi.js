import { supabase } from './supabaseClient'

// Use relative URL for Netlify functions (works on localhost and production)
// For dev with Netlify CLI, can override with VITE_NETLIFY_FUNCTIONS_URL
const FUNCTIONS_URL = import.meta.env.VITE_NETLIFY_FUNCTIONS_URL || '/.netlify/functions'

/**
 * Call a Netlify Function with automatic auth token
 * @param {string} functionName - Name of the function (without .netlify/functions prefix)
 * @param {string} method - HTTP method
 * @param {object} body - Request body
 * @returns {Promise<{data, error, status}>}
 */
export const callFunction = async (functionName, method = 'POST', body = {}) => {
  try {
    // Get auth token
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token

    if (!token) {
      return {
        data: null,
        error: new Error('No authentication token'),
        status: 401,
      }
    }

    // Build URL
    const url = `${FUNCTIONS_URL}/${functionName}`

    // Build fetch options
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }

    // Only add body for non-GET/HEAD requests
    if (!['GET', 'HEAD'].includes(method.toUpperCase()) && body) {
      fetchOptions.body = JSON.stringify(body)
    }

    // Call function
    const response = await fetch(url, fetchOptions)

    const data = await response.json()

    if (!response.ok) {
      return {
        data: null,
        error: new Error(data.error || 'Function call failed'),
        status: response.status,
      }
    }

    return { data, error: null, status: response.status }
  } catch (err) {
    return {
      data: null,
      error: err,
      status: 500,
    }
  }
}

/**
 * Create new user via Netlify Function
 * @param {string} email
 * @param {string} password
 * @param {string} nome
 * @param {string} ruolo
 * @returns {Promise<{data, error}>}
 */
export const createUser = async (email, password, nome, ruolo) => {
  const { data, error } = await callFunction('create-user', 'POST', {
    email,
    password,
    nome,
    ruolo,
  })

  return { data, error }
}

/**
 * Create new product via Netlify Function
 * @param {string} nome
 * @param {string} tipologie_possibili
 * @returns {Promise<{data, error}>}
 */
export const createProduct = async (nome, tipologie_possibili) => {
  const { data, error } = await callFunction('create-product', 'POST', {
    nome,
    tipologie_possibili,
  })

  return { data, error }
}

/**
 * Update product via Netlify Function
 * @param {string} productId
 * @param {string} nome
 * @param {string} tipologie_possibili
 * @returns {Promise<{data, error}>}
 */
export const updateProduct = async (productId, nome, tipologie_possibili) => {
  const { data, error } = await callFunction('update-product', 'PATCH', {
    productId,
    nome,
    tipologie_possibili,
  })

  return { data, error }
}

/**
 * Update order status via Netlify Function
 * @param {string} ordineId
 * @param {boolean} completato
 * @returns {Promise<{data, error}>}
 */
export const updateOrderStatus = async (ordineId, completato) => {
  const { data, error } = await callFunction('update-order-status', 'PATCH', {
    ordineId,
    completato,
  })

  return { data, error }
}

/**
 * Delete product via Netlify Function
 * @param {string} productId
 * @returns {Promise<{data, error}>}
 */
export const deleteProduct = async (productId) => {
  const { data, error } = await callFunction('delete-product', 'DELETE', {
    productId,
  })

  return { data, error }
}

/**
 * Get list of all client profiles
 * @returns {Promise<{data, error}>}
 */
export const listClients = async () => {
  const { data, error } = await callFunction('list-clients', 'GET')

  return { data, error }
}

export default {
  callFunction,
  createUser,
  createProduct,
  updateProduct,
  updateOrderStatus,
  deleteProduct,
  listClients,
}
