import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local')
}

/**
 * Singleton Supabase client instance
 * @type {ReturnType<typeof createClient>}
 */
export const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
