/**
 * Helper function to verify JWT token and extract user info
 * @param {string} authHeader - Authorization header value
 * @returns {Promise<{userId: string, error: string | null}>}
 */
export async function verifyAuth(authHeader) {
  if (!authHeader) {
    return { userId: null, error: 'Missing Authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    // Decode JWT to get user ID
    // JWT structure: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { userId: null, error: 'Invalid token format' }
    }

    // Decode payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString()
    )

    // Check token expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return { userId: null, error: 'Token expired' }
    }

    return { userId: payload.sub, error: null }
  } catch (err) {
    console.error('Token verification error:', err)
    return { userId: null, error: 'Invalid token' }
  }
}

/**
 * Verify user role from Supabase database
 * @param {object} supabaseAdmin - Supabase admin client
 * @param {string} userId - User ID to check
 * @param {string|string[]} requiredRole - Required role(s)
 * @returns {Promise<{hasRole: boolean, error: string | null}>}
 */
export async function verifyUserRole(supabaseAdmin, userId, requiredRole) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profili')
      .select('ruolo')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return { hasRole: false, error: 'User profile not found' }
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const hasRole = roles.includes(data.ruolo)

    return { hasRole, error: null }
  } catch (err) {
    console.error('Role verification error:', err)
    return { hasRole: false, error: 'Error verifying user role' }
  }
}

/**
 * Check if user has required role
 * @param {string} userRole - User's role from profile
 * @param {string|string[]} requiredRole - Required role(s)
 * @returns {boolean}
 */
export function checkRole(userRole, requiredRole) {
  if (!requiredRole) return true

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  return roles.includes(userRole)
}

/**
 * Return error response
 * @param {number} statusCode
 * @param {string} error
 * @returns {object}
 */
export function errorResponse(statusCode, error) {
  return {
    statusCode,
    body: JSON.stringify({ error }),
    headers: { 'Content-Type': 'application/json' },
  }
}

/**
 * Return success response
 * @param {number} statusCode
 * @param {object} data
 * @returns {object}
 */
export function successResponse(statusCode, data) {
  return {
    statusCode,
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  }
}
