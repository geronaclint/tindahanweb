/**
 * Supabase client configuration
 * - Client-side: uses anon key (safe to expose)
 * - Server-side: uses service role key (never expose to the browser)
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Public client — safe for use in the browser (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client — only use on the server (service role bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
