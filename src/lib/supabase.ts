/**
 * Supabase client configuration
 * - Client-side: uses anon key (safe to expose)
 * - Server-side: uses service role key (never expose to the browser)
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fiqnbxloykhojlsimmbd.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpcW5ieGxveWtob2psc2ltbWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTcxNzIsImV4cCI6MjA5NjA5MzE3Mn0.OADK5f2I4qipmuF86pFkcIyLxmInPcV1tHHjDQlNKNw'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpcW5ieGxveWtob2psc2ltbWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDUxNzE3MiwiZXhwIjoyMDk2MDkzMTcyfQ.__zSBtfqh6717z4eSm4yiV5CkBjtTImF-a0Vheurs10'

// Public client — safe for use in the browser (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client — only use on the server (service role bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
