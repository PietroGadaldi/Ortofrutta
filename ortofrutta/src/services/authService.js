import { supabase } from './supabaseClient'

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user, session, error}>}
 */
export const signInWithPassword = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { user: null, session: null, error }
  }
  
  return { user: data.user, session: data.session, error: null }
}

/**
 * Sign out current user
 * @returns {Promise<{error}>}
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get current user and their profile/role
 * @param {object} user - Supabase auth user
 * @returns {Promise<{profile, role, error}>}
 */
export const getCurrentUserProfile = async (user) => {
  if (!user) {
    return { profile: null, role: null, error: new Error('No user') }
  }

  try {
    // Fetch profilo from DB
    const { data, error } = await supabase
      .from('profili')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      return { profile: null, role: null, error }
    }

    return { profile: data, role: data?.ruolo, error: null }
  } catch (err) {
    return { profile: null, role: null, error: err }
  }
}

/**
 * Get current session
 * @returns {Promise<{session, error}>}
 */
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  return { session: data?.session, error }
}

/**
 * Listen to auth state changes
 * @param {function} callback - Called with {user, session}
 * @returns {function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback({ user: session?.user, session })
  })
  
  return data.subscription.unsubscribe
}

export default {
  signInWithPassword,
  signOut,
  getCurrentUserProfile,
  getSession,
  onAuthStateChange,
}
