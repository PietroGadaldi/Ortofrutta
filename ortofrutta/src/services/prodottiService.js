import { supabase } from './supabaseClient'
import { parseTipologie } from '../utils/constants'

/**
 * Get all prodotti
 * @returns {Promise<{data, error}>}
 */
export const getAllProdotti = async () => {
  const { data, error } = await supabase
    .from('prodotti')
    .select('*')
    .order('nome', { ascending: true })

  return { data, error }
}

/**
 * Create new prodotto
 * @param {string} nome
 * @param {string} tipologiePossibili - CSV string with semicolon separator
 * @returns {Promise<{data, error}>}
 */
export const createProdotto = async (nome, tipologiePossibili) => {
  const { data, error } = await supabase
    .from('prodotti')
    .insert({
      nome: nome.trim(),
      tipologie_possibili: tipologiePossibili,
    })
    .select()

  return { data, error }
}

/**
 * Update prodotto
 * @param {string} prodottoId
 * @param {object} updates - {nome?, tipologie_possibili?}
 * @returns {Promise<{data, error}>}
 */
export const updateProdotto = async (prodottoId, updates) => {
  const { data, error } = await supabase
    .from('prodotti')
    .update(updates)
    .eq('id', prodottoId)
    .select()

  return { data, error }
}

/**
 * Delete prodotto
 * @param {string} prodottoId
 * @returns {Promise<{error}>}
 */
export const deleteProdotto = async (prodottoId) => {
  const { error } = await supabase
    .from('prodotti')
    .delete()
    .eq('id', prodottoId)

  return { error }
}

/**
 * Format tipologie string to display
 * @param {string} csv
 * @returns {string[]}
 */
export const formatTipologie = (csv) => {
  return parseTipologie(csv)
}

export default {
  getAllProdotti,
  createProdotto,
  updateProdotto,
  deleteProdotto,
  formatTipologie,
}
