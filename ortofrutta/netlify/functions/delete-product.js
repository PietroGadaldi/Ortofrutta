/**
 * Netlify Function: Delete product
 * 
 * Method: DELETE
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * Body: { productId }
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

  if (event.httpMethod !== 'DELETE') {
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
      return errorResponse(403, 'Solo i titolari possono eliminare i prodotti')
    }

    // Parse body
    const { productId } = JSON.parse(event.body)

    if (!productId) {
      return errorResponse(400, 'Missing productId')
    }

    // Use Supabase Admin client to delete product
    const { error } = await supabaseAdmin
      .from('prodotti')
      .delete()
      .eq('id', productId)

    if (error) {
      return errorResponse(500, error.message || 'Failed to delete product')
    }

    return successResponse(200, {
      message: 'Product deleted successfully',
      productId,
    })
  } catch (err) {
    console.error(err)
    return errorResponse(500, 'Internal server error')
  }
}
