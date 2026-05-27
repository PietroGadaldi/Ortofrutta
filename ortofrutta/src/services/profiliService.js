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
 * Now uses RLS policies instead of Function
 * @returns {Promise<{data, error}>}
 */
export const getClientList = async () => {
  const { data, error } = await supabase
    .from('profili')
    .select('id, nome, ruolo')
    .eq('ruolo', 'cliente')
    .order('nome', { ascending: true })

  return { data, error }
}

export default {
  getProfile,
  getAllProfiles,
  getAllClientProfiles,
  createProfile,
  updateProfile,
  getClientList,
}
