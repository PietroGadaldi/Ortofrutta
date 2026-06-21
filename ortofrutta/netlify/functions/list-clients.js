/**
 * Netlify Function: Get list of client profiles or orders for a specific date
 * 
 * Method: GET
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * Query params:
 *   - type: 'clients' (default) or 'orders'
 *   - date: YYYY-MM-DD (required if type='orders')
 *   - role: 'cliente' (default) or 'titolare'
 * 
 * Only allows titolare (owner) to access this function
 */

import { format, parseISO } from 'date-fns'

import { createClient } from '@supabase/supabase-js'
import { verifyAuth, verifyUserRole, errorResponse, successResponse } from './auth.js'
import { decrypt } from './crypto-utils.js'

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

    // Get parameters from query string
    const params = event.queryStringParameters || {}
    const type = params.type || 'clients'
    const role = params.role || 'cliente'
    const dateParam = params.date

    if (type === 'orders') {
      // Fetch orders for specific date
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
            updated_at,
            data_ordine,
            completato,
            cliente_id,
            profili:cliente_id(nome),
            dettagli_ordine (
              id,
              quantita,
              tipologia,
              prodotto_id,
              nome_custom,
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
      // Fetch profiles based on role
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profili')
        .select('id, nome, ruolo, password_plain')
        .eq('ruolo', role)
        .order('nome', { ascending: true })

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError)
        return errorResponse(500, `Errore nel caricamento profili: ${profilesError.message}`)
      }

      // Recupera tutti gli utenti dall'Auth di Supabase per ottenere le email
      // Nota: listUsers ha un limite di paginazione predefinito (50 utenti)
      const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (authError) {
        console.error('Auth fetch error:', authError)
        // Se fallisce il recupero email, restituiamo comunque i profili senza email
      }

      // Unisce i dati dei profili con le email dell'auth e decifra la password
      const clientsWithEmail = (profiles || []).map(profile => {
        const authUser = (users || []).find(u => u.id === profile.id)
        return {
          ...profile,
          email: authUser ? authUser.email : '',
          password_plain: decrypt(profile.password_plain),
        }
      })

      return successResponse(200, {
        clients: clientsWithEmail,
        count: clientsWithEmail.length,
      })
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return errorResponse(500, `Errore interno del server: ${err.message}`)
  }
}
