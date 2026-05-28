import { supabase } from './supabaseClient'

/**
 * Get all ordini (titolare) or user's ordini (cliente)
 * @param {string} userId
 * @param {string} role
 * @returns {Promise<{data, error}>}
 */
export const getAllOrdini = async (userId, role) => {
  let query = supabase.from('ordini').select(`
    id,
    data_creazione,
    data_ordine,
    completato,
    cliente_id,
    profili (nome),
    dettagli_ordine (
      id,
      quantita,
      tipologia,
      prodotto_id,
      prodotti (nome)
    )
  `)

  // If cliente, filter by their ID
  if (role === 'cliente') {
    query = query.eq('cliente_id', userId)
  }

  query = query.order('data_creazione', { ascending: false })

  const { data, error } = await query

  return { data, error }
}

/**
 * Create new ordine
 * @param {string} clienteId
 * @param {Date} dataOrdine - Data for which order is being placed
 * @param {Array} dettagli - Array of {prodotto_id, quantita, tipologia}
 * @returns {Promise<{data, error}>}
 */
export const createOrdine = async (clienteId, dataOrdine, dettagli) => {
  try {
    // Create ordine
    const { data: ordineData, error: ordineError } = await supabase
      .from('ordini')
      .insert({ cliente_id: clienteId, data_ordine: dataOrdine })
      .select()

    if (ordineError) throw ordineError

    const ordineId = ordineData[0].id

    // Create dettagli_ordine
    const dettagliRecords = dettagli.map((d) => ({
      ordine_id: ordineId,
      prodotto_id: d.prodotto_id,
      quantita: d.quantita,
      tipologia: d.tipologia,
    }))

    const { data: dettagliData, error: dettagliError } = await supabase
      .from('dettagli_ordine')
      .insert(dettagliRecords)
      .select()

    if (dettagliError) throw dettagliError

    return { data: ordineData[0], error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}

/**
 * Update ordine status (only for titolare)
 * @param {string} ordineId
 * @param {boolean} completato
 * @returns {Promise<{data, error}>}
 */
export const updateOrdineStatus = async (ordineId, completato) => {
  const { data, error } = await supabase
    .from('ordini')
    .update({ completato })
    .eq('id', ordineId)
    .select()

  return { data, error }
}

/**
 * Delete ordine (only non-completed)
 * @param {string} ordineId
 * @returns {Promise<{error}>}
 */
export const deleteOrdine = async (ordineId) => {
  const { error } = await supabase.from('ordini').delete().eq('id', ordineId)

  return { error }
}

/**
 * Update ordine dettagli (modify products in existing order)
 * @param {string} ordineId
 * @param {Array} dettagli - Array of {prodotto_id, quantita, tipologia}
 * @returns {Promise<{data, error}>}
 */
export const updateOrdineDettagli = async (ordineId, dettagli) => {
  try {
    // Delete existing dettagli_ordine for this ordine
    const { error: deleteError } = await supabase
      .from('dettagli_ordine')
      .delete()
      .eq('ordine_id', ordineId)

    if (deleteError) throw deleteError

    // Insert new dettagli_ordine
    const dettagliRecords = dettagli.map((d) => ({
      ordine_id: ordineId,
      prodotto_id: d.prodotto_id,
      quantita: d.quantita,
      tipologia: d.tipologia,
    }))

    const { data: dettagliData, error: dettagliError } = await supabase
      .from('dettagli_ordine')
      .insert(dettagliRecords)
      .select()

    if (dettagliError) throw dettagliError

    return { data: dettagliData, error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}

export default {
  getAllOrdini,
  createOrdine,
  updateOrdineStatus,
  deleteOrdine,
  updateOrdineDettagli,
}
