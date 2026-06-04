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
    store_id: user.id,
  })

  // Redirect to the POS (homepage)
  redirect('/')
}

// Logout: delete session and redirect to login
export async function logout() {
  await deleteSession()
  redirect('/login')
}

// Register: create a new store account
export async function register(formData: FormData) {
  const username = (formData.get('username') as string)?.trim()
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Store name and password are required.' }
  }

  if (username.length < 2) {
    return { error: 'Store name must be at least 2 characters.' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  // Check if store name is already taken
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    return { error: 'This store name is already taken. Please choose another.' }
  }

  // Hash password and create user
  const password_hash = await bcrypt.hash(password, 10)

  const { error } = await supabaseAdmin.from('users').insert({
    username,
    password_hash,
  })

  if (error) {
    return { error: 'Failed to create account. Please try again.' }
  }

  return { success: true }
}
