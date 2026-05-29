import { supabase } from './supabaseClient'
import { createProduct, updateProduct } from './netlifyApi'
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
 * Create new prodotto via Netlify Function
 * @param {string} nome
 * @param {string} tipologiePossibili - CSV string with semicolon separator
 * @returns {Promise<{data, error}>}
 */
export const createProdotto = async (nome, tipologiePossibili) => {
  const { data, error } = await createProduct(nome.trim(), tipologiePossibili)
  return { data, error }
}

/**
 * Update prodotto via Netlify Function
 * @param {string} prodottoId
 * @param {string} nome
 * @param {string} tipologie_possibili
 * @returns {Promise<{data, error}>}
 */
export const updateProdotto = async (prodottoId, nome, tipologie_possibili) => {
  const { data, error } = await updateProduct(prodottoId, nome, tipologie_possibili)
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
