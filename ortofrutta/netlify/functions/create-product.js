/**
 * Netlify Function: Create new product
 * 
 * Method: POST
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * Body: { nome, tipologie_possibili }
 * 
 * Uses Supabase Admin API with service_role key to bypass RLS
 * Only allows titolare (owner) to create new products
 */

import { createClient } from '@supabase/supabase-js'
import { verifyAuth, verifyUserRole, errorResponse, successResponse } from './auth.js'

// Initialize Supabase Admin client with service_role key (server-side secret)
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
      return errorResponse(403, 'Solo i titolari possono creare nuovi prodotti')
    }

    // Parse body
    const { nome, tipologie_possibili } = JSON.parse(event.body)

    // Validate required fields
    if (!nome) {
      return errorResponse(400, 'Missing required field: nome')
    }

    if (!tipologie_possibili) {
      return errorResponse(400, 'Missing required field: tipologie_possibili')
    }

    // Validate nome format
    const nomeString = nome.trim()
    if (nomeString.length < 1 || nomeString.length > 255) {
      return errorResponse(400, 'Nome must be between 1 and 255 characters')
    }

    // Create product in database
    const { data: productData, error: productError } = await supabaseAdmin
      .from('prodotti')
      .insert({
        nome: nomeString,
        tipologie_possibili: tipologie_possibili.trim(),
      })
      .select()

    if (productError) {
      console.error('Product creation error:', productError)
      return errorResponse(500, `Errore creazione prodotto: ${productError.message}`)
    }

    return successResponse(201, productData[0])
  } catch (error) {
    console.error('Unexpected error:', error)
    return errorResponse(500, 'Internal server error')
  }
}
