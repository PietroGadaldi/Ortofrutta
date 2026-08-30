import { supabase } from './supabaseClient'

/**
 * Get profile for user
 * @param {string} userId
 * @returns {Promise<{data, error}>}
 */
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profili')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}

/**
 * Get all profiles (only for titolare)
 * @returns {Promise<{data, error}>}
 */
export const getAllProfiles = async () => {
  const { data, error } = await supabase
    .from('profili')
    .select('*')
    .order('nome', { ascending: true })

  return { data, error }
}

/**
 * Get all client profiles
 * @returns {Promise<{data, error}>}
 */
export const getAllClientProfiles = async () => {
  const { data, error } = await supabase
    .from('profili')
    .select('*')
    .eq('ruolo', 'cliente')
    .order('nome', { ascending: true })

  return { data, error }
}

/**
 * Create new profile (called after user creation)
 * @param {string} userId
 * @param {string} nome
 * @param {string} ruolo
 * @returns {Promise<{data, error}>}
 */
export const createProfile = async (userId, nome, ruolo) => {
  const { data, error } = await supabase
    .from('profili')
    .insert({
      id: userId,
      nome,
      ruolo,
    })
    .select()

  return { data, error }
}

/**
 * Update profile
 * @param {string} userId
 * @param {object} updates - {nome?, ruolo?}
 * @returns {Promise<{data, error}>}
 */
export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profili')
    .update(updates)
    .eq('id', userId)
    .select()

  return { data, error }
}

/**
 * Get all client profiles (for titolare)
 * Uses server-side function with service_role key to bypass RLS
 * @returns {Promise<{data, error}>}
 */
export const getClientList = async () => {
  try {
    const response = await fetch(
      (import.meta.env.VITE_NETLIFY_FUNCTIONS_URL || '/.netlify/functions') + '/list-clients',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Errore nel caricamento clienti' } }
    }

    return { data: data.clients || [], error: null }
  } catch (err) {
    console.error('getClientList error:', err)
    return { data: null, error: { message: err.message } }
  }
}

/**
 * Get client profiles with basic fields only (id, nome, provenienza).
 * Usata dove serve solo identificare il cliente (es. creazione ordine dal
 * titolare): non trasferisce password né email.
 * @returns {Promise<{data, error}>}
 */
export const getClientListBasic = async () => {
  try {
    const response = await fetch(
      (import.meta.env.VITE_NETLIFY_FUNCTIONS_URL || '/.netlify/functions') +
        '/list-clients?role=cliente&fields=basic',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        data: null,
        error: { message: data.message || data.error || 'Errore nel caricamento clienti' },
      }
    }

    return { data: data.clients || [], error: null }
  } catch (err) {
    console.error('getClientListBasic error:', err)
    return { data: null, error: { message: err.message } }
  }
}

// Helper to get auth token
const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || ''
}

export default {
  getProfile,
  getAllProfiles,
  getAllClientProfiles,
  createProfile,
  updateProfile,
  getClientList,
  getClientListBasic,
}
