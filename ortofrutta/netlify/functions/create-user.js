/**
 * Netlify Function: Create new user (cliente or titolare)
 * 
 * Method: POST
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * Body: { email, password, nome, ruolo }
 * 
 * Note: In production, use Supabase Admin API with service_role key
 * This is a placeholder for the actual implementation
 */

import { verifyAuth, errorResponse, successResponse } from './auth.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
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
    const { email, password, nome, ruolo } = JSON.parse(event.body)

    if (!email || !password || !nome || !ruolo) {
      return errorResponse(400, 'Missing required fields')
    }

    // TODO: Use Supabase Admin API to create user
    // const { data, error } = await supabaseAdmin.auth.admin.createUser({
    //   email,
    //   password,
    //   email_confirm: true,
    // })

    // TODO: Create profilo in DB
    // await supabaseAdmin.from('profili').insert({
    //   id: data.user.id,
    //   nome,
    //   ruolo,
    // })

    return successResponse(201, {
      message: 'User created successfully',
      userId: 'placeholder-user-id',
    })
  } catch (err) {
    console.error(err)
    return errorResponse(500, 'Internal server error')
  }
}
