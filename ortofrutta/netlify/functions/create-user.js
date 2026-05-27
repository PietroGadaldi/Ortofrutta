/**
 * Netlify Function: Create new user (cliente or titolare)
 * 
 * Method: POST
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * Body: { email, password, nome, ruolo }
 * 
 * Uses Supabase Admin API with service_role key for secure user creation
 * Only allows titolare (owner) to create new users
 */

import { createClient } from '@supabase/supabase-js'
import { verifyAuth, verifyUserRole, errorResponse, successResponse } from './auth.js'

// Initialize Supabase Admin client with service_role key (server-side secret)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'Method not allowed')
  }

  try {
    // Verify auth - ensure user is logged in
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
      return errorResponse(403, 'Solo i titolari possono creare nuovi utenti')
    }

    // Parse body
    const { email, password, nome, ruolo } = JSON.parse(event.body)

    // Validate required fields
    if (!email || !password || !nome || !ruolo) {
      return errorResponse(400, 'Missing required fields: email, password, nome, ruolo')
    }

    // Validate ruolo
    if (!['cliente', 'titolare'].includes(ruolo)) {
      return errorResponse(400, 'Invalid ruolo: must be "cliente" or "titolare"')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return errorResponse(400, 'Invalid email format')
    }

    // Validate password length
    if (password.length < 6) {
      return errorResponse(400, 'Password must be at least 6 characters')
    }

    // Create user in Supabase Auth
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email
    })

    if (authCreateError) {
      console.error('Auth creation error:', authCreateError)
      
      // Handle specific Supabase errors
      if (authCreateError.message.includes('User already exists')) {
        return errorResponse(409, 'Utente con questa email esiste già')
      }
      
      return errorResponse(500, `Errore creazione utente: ${authCreateError.message}`)
    }

    const newUserId = authData.user.id

    // Create profile in database
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profili')
      .insert({
        id: newUserId,
        nome,
        ruolo,
      })
      .select()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      
      // If profile creation fails, delete the user we just created to keep things consistent
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      
      return errorResponse(500, `Errore creazione profilo: ${profileError.message}`)
    }

    return successResponse(201, {
      message: 'Utente creato con successo',
      userId: newUserId,
      email,
      nome,
      ruolo,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return errorResponse(500, `Errore interno del server: ${err.message}`)
  }
}
