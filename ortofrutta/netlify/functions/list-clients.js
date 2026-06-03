/**
 * Netlify Function: Get list of client profiles or orders for a specific date
 * 
 * Method: GET
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * Query params:
 *   - type: 'clients' (default) or 'orders'
 *   - date: YYYY-MM-DD (required if type='orders')
 * 
 * Only allows titolare (owner) to access this function
 */

import { format, parseISO } from 'date-fns'

import { createClient } from '@supabase/supabase-js'
import { verifyAuth, verifyUserRole, errorResponse, successResponse } from './auth.js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SERVICE_ROLE_KEY
)

export async function handler(event) {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  }

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
      return errorResponse(403, 'Solo i titolari possono accedere a questa risorsa')
    }

    // Get request type from query params
    const queryParams = new URLSearchParams(event.rawUrl.split('?')[1] || '')
    const type = queryParams.get('type') || 'clients'

    if (type === 'orders') {
      // Fetch orders for specific date
      const dateParam = queryParams.get('date')
      if (!dateParam) {
        return errorResponse(400, 'Parametro "date" richiesto per type=orders (formato: YYYY-MM-DD)')
      }

      try {
        // Parse and validate date
        const orderDate = parseISO(dateParam)
        const formattedDate = format(orderDate, 'yyyy-MM-dd')

        // Fetch orders with client names using service role key (bypasses RLS)
        const { data: ordini, error: ordiniError } = await supabaseAdmin
          .from('ordini')
          .select(`
            id,
            data_creazione,
            data_ordine,
            completato,
            cliente_id,
            profili:cliente_id(nome),
            dettagli_ordine (
              id,
              quantita,
              tipologia,
              prodotto_id,
              prodotti (nome)
            )
          `)
          .eq('data_ordine', formattedDate)
          .order('data_creazione', { ascending: false })

        if (ordiniError) {
          console.error('Orders fetch error:', ordiniError)
          return errorResponse(500, `Errore nel caricamento ordini: ${ordiniError.message}`)
        }

        // Format response to match expected structure
        const formattedOrdini = (ordini || []).map(ordine => ({
          ...ordine,
          profili: ordine.profili ? { nome: ordine.profili.nome } : null
        }))

        return successResponse(200, {
          data: formattedOrdini,
        })
      } catch (err) {
        console.error('Date parsing error:', err)
        return errorResponse(400, 'Formato data non valido. Usa YYYY-MM-DD')
      }
    } else {
      // Fetch all clients (default)
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
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return errorResponse(500, `Errore interno del server: ${err.message}`)
  }
}
