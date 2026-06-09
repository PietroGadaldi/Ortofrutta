/**
 * Netlify Function: Update product status (attivo/disattivo)
 * 
 * Method: PATCH
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * Body: { productId, attivo }
 * 
 * Uses Supabase Admin API with service_role key to bypass RLS
 * Only allows titolare (owner) to update product status
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

  if (event.httpMethod !== 'PATCH') {
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
      return errorResponse(403, 'Solo i titolari possono modificare lo stato dei prodotti')
    }

    // Parse body
    const { productId, attivo } = JSON.parse(event.body)

    // Validate required fields
    if (!productId) {
      return errorResponse(400, 'Missing required field: productId')
    }

    if (typeof attivo !== 'boolean') {
      return errorResponse(400, 'Missing or invalid field: attivo (must be boolean)')
    }

    // Update product status in database
    const { data: productData, error: productError } = await supabaseAdmin
      .from('prodotti')
      .update({
        attivo: attivo,
      })
      .eq('id', productId)
      .select()

    if (productError) {
      console.error('Product status update error:', productError)
      return errorResponse(500, `Errore modifica stato prodotto: ${productError.message}`)
    }

    if (!productData || productData.length === 0) {
      return errorResponse(404, 'Prodotto non trovato')
    }

    return successResponse(200, productData[0])
  } catch (err) {
    console.error('Handler error:', err)
    return errorResponse(500, `Errore server: ${err.message}`)
  }
}
