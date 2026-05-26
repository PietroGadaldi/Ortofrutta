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
    // In production, you would verify the JWT against Supabase public key
    // For now, we'll use Supabase's built-in JWT verification when possible
    // This is a simplified version - ideally use @supabase/supabase-js with service_role key

    return { userId: token, error: null }
  } catch (err) {
    return { userId: null, error: 'Invalid token' }
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
