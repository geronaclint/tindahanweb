/**
 * Server Actions for Authentication
 * These run on the server and handle login/logout securely
 */
'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { createSession, deleteSession } from '@/lib/session'

// Login: verify credentials and create a session
export async function login(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  // Basic validation
  if (!username || !password) {
    return { error: 'Username and password are required.' }
  }

  // Look up the user by username
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, username, password_hash')
    .eq('username', username.trim())
    .single()

  if (error || !user) {
    return { error: 'Invalid username or password.' }
  }

  // Compare the submitted password with the stored hash
  const passwordMatch = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatch) {
    return { error: 'Invalid username or password.' }
  }

  // Create the session cookie
  await createSession(user.id, user.username)

  // Log the login action
  await supabaseAdmin.from('activity_logs').insert({
    action: 'Login',
    description: `User "${user.username}" logged in.`,
  })

  // Redirect to the POS (homepage)
  redirect('/')
}

// Logout: delete session and redirect to login
export async function logout() {
  await deleteSession()
  redirect('/login')
}
