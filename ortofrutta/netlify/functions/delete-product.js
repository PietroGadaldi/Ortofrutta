/**
 * Netlify Function: Delete product
 * 
 * Method: DELETE
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * Body: { productId }
 */

import { verifyAuth, errorResponse, successResponse } from './auth.js'

export async function handler(event) {
  if (event.httpMethod !== 'DELETE') {
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
    const { productId } = JSON.parse(event.body)

    if (!productId) {
      return errorResponse(400, 'Missing productId')
    }

    // TODO: Use Supabase to delete product
    // const { error } = await supabase
    //   .from('prodotti')
    //   .delete()
    //   .eq('id', productId)

    return successResponse(200, {
      message: 'Product deleted successfully',
      productId,
    })
  } catch (err) {
    console.error(err)
    return errorResponse(500, 'Internal server error')
  }
}
