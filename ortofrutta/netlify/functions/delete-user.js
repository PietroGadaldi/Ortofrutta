import { createClient } from '@supabase/supabase-js'
import { verifyAuth, verifyUserRole, errorResponse, successResponse } from './auth.js'

// Inizializza il client Supabase Admin
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
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  }

  if (event.httpMethod !== 'DELETE') {
    return errorResponse(405, 'Metodo non consentito')
  }

  try {
    // 1. Verifica autenticazione
    const { userId: requesterId, error: authError } = await verifyAuth(
      event.headers.authorization
    )
    if (authError) return errorResponse(401, authError)

    // 2. Verifica ruolo titolare
    const { hasRole, error: roleError } = await verifyUserRole(
      supabaseAdmin,
      requesterId,
      'titolare'
    )
    if (roleError || !hasRole) {
      return errorResponse(403, 'Solo i titolari possono eliminare utenti')
    }

    // 3. Analisi ID utente da eliminare
    const { userId } = JSON.parse(event.body)
    if (!userId) return errorResponse(400, 'ID utente mancante')
    
    if (userId === requesterId) {
      return errorResponse(400, 'Non puoi eliminare il tuo stesso account')
    }

    // 4. Eliminazione da Supabase Auth
    // Grazie alla FK ON DELETE CASCADE nello schema SQL, questo rimuoverà automaticamente 
    // il profilo e tutti gli ordini associati nel DB.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      throw deleteError
    }

    return successResponse(200, { message: 'Utente e dati associati eliminati con successo' })
  } catch (error) {
    console.error('Delete error:', error)
    return errorResponse(500, `Errore durante l'eliminazione: ${error.message}`)
  }
}