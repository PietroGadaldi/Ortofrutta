import { createClient } from '@supabase/supabase-js'
import { verifyAuth, verifyUserRole, errorResponse, successResponse } from './auth.js'

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SERVICE_ROLE_KEY
)

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  }

  if (event.httpMethod !== 'PATCH') {
    return errorResponse(405, 'Method not allowed')
  }

  try {
    // 1. Verifica autenticazione (JWT valido)
    const { userId: requesterId, error: authError } = await verifyAuth(
      event.headers.authorization
    )
    if (authError) return errorResponse(401, authError)

    // 2. Verifica che chi richiede sia un titolare
    const { hasRole, error: roleError } = await verifyUserRole(
      supabaseAdmin,
      requesterId,
      'titolare'
    )
    if (roleError || !hasRole) {
      return errorResponse(403, 'Solo i titolari possono modificare gli utenti')
    }

    // 3. Analisi dei dati in ingresso
    const { userId, email, password, nome, ruolo } = JSON.parse(event.body)

    if (!userId) return errorResponse(400, 'ID utente mancante')

    // 4. Aggiornamento in Supabase Auth (Email e opzionalmente Password)
    const authUpdate = {
      email: email,
      email_confirm: true // Evita email di conferma per modifiche amministrative
    }
    
    if (password && password.trim() !== '') {
      authUpdate.password = password
    }

    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      authUpdate
    )

    if (updateAuthError) {
      console.error('Auth update error:', updateAuthError)
      return errorResponse(500, `Errore Auth: ${updateAuthError.message}`)
    }

    // 5. Aggiornamento nella tabella Profili
    const { error: profileError } = await supabaseAdmin
      .from('profili')
      .update({
        nome: nome.trim(),
        ruolo: ruolo
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return errorResponse(500, `Errore Profilo: ${profileError.message}`)
    }

    return successResponse(200, { message: 'Utente aggiornato con successo' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return errorResponse(500, 'Errore interno del server')
  }
}