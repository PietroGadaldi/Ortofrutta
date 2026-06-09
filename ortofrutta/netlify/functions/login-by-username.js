import { createClient } from '@supabase/supabase-js'
import { errorResponse, successResponse } from './auth.js'

// Client Admin per cercare il profilo e recuperare l'email (sola lettura)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SERVICE_ROLE_KEY
)

// Inizializza un client standard per verificare la password (richiede anon key)
const supabaseStandard = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

export async function handler(event) {
  // Gestione CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'Metodo non consentito')
  }

  // Messaggio di errore generico come richiesto per sicurezza
  const GENERIC_ERROR = 'Nome utente non trovato o non valido.'

  try {
    const { username, password } = JSON.parse(event.body)

    if (!username || !password) {
      return errorResponse(400, 'Nome utente e password richiesti')
    }

    // 1. Cerca l'ID nel database 'profili' tramite il nome (case-insensitive)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profili')
      .select('id')
      .ilike('nome', username.trim())
      .maybeSingle()

    if (profileError || !profile) { 
      return errorResponse(401, GENERIC_ERROR)
    }

    // 2. Recupera l'email reale dell'utente dal sistema Auth usando l'ID trovato
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id)
    
    if (authError || !authUser?.user?.email) {
      return errorResponse(401, 'Errore nel recupero dati account')
    }

    const email = authUser.user.email

    // 3. Verifica la password tentando un login standard
    // Usiamo il client standard (non admin) per simulare l'accesso dell'utente
    const { data: signInData, error: signInError } = await supabaseStandard.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      return errorResponse(401, GENERIC_ERROR)
    }

    // 4. Restituisci la sessione al frontend
    return successResponse(200, {
      session: signInData.session,
      user: signInData.user
    })

  } catch (err) {
    console.error('Unexpected error in login-by-username:', err)
    return errorResponse(500, 'Errore interno del server')
  }
}