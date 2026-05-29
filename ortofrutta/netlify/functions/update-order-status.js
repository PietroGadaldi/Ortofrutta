/**
 * Netlify Function: Update order status
 * 
 * Method: PATCH
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * Body: { ordineId, completato }
 */

import { verifyAuth, errorResponse, successResponse } from './auth.js'

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
    // Verify auth
    const { userId, error: authError } = await verifyAuth(
      event.headers.authorization
    )

    if (authError) {
      return errorResponse(401, authError)
    }

    // Parse body
    const { ordineId, completato } = JSON.parse(event.body)

    if (!ordineId || typeof completato !== 'boolean') {
      return errorResponse(400, 'Missing or invalid fields')
    }

    // TODO: Use Supabase to update ordine
    // const { data, error } = await supabase
    //   .from('ordini')
    //   .update({ completato })
    //   .eq('id', ordineId)
    //   .select()

    return successResponse(200, {
      message: 'Order updated successfully',
      ordineId,
      completato,
    })
  } catch (err) {
    console.error(err)
    return errorResponse(500, 'Internal server error')
  }
}
