/**
 * Netlify Function: Get list of all client profiles
 * 
 * Method: GET
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * Response: Array of client profiles with id, nome, ruolo
 * 
 * Only allows titolare (owner) to view client list
 */

import { createClient } from '@supabase/supabase-js'
import { verifyAuth, verifyUserRole, errorResponse, successResponse } from './auth.js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return errorResponse(405, 'Method not allowed')
  }

  try {
    // Verify auth
    const { userId, error: authError } = await verifyAuth(
      event.headers.authorization
    )

    if (authError) {
      return errorResponse(401, authError)
    }

    // Verify user is titolare
    const { hasRole, error: roleError } = await verifyUserRole(
      supabaseAdmin,
      userId,
      'titolare'
    )

    if (roleError || !hasRole) {
      return errorResponse(403, 'Solo i titolari possono visualizzare i clienti')
    }

    // Fetch all clients
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('profili')
      .select('id, nome, ruolo')
      .eq('ruolo', 'cliente')
      .order('nome', { ascending: true })

    if (clientsError) {
      console.error('Clients fetch error:', clientsError)
      return errorResponse(500, `Errore nel caricamento clienti: ${clientsError.message}`)
    }

    return successResponse(200, {
      clients: clients || [],
      count: (clients || []).length,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return errorResponse(500, `Errore interno del server: ${err.message}`)
  }
}
