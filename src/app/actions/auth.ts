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
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Basic validation
  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  // Look up the user by email
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, username, password_hash')
    .eq('email', email.trim())
    .single()

  if (error || !user) {
    return { error: 'Invalid email or password.' }
  }


  // Compare the submitted password with the stored hash
  const passwordMatch = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatch) {
    return { error: 'Invalid email or password.' }
  }

  // Create the session cookie using store name (username)
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
  const email = (formData.get('email') as string)?.trim()
  const username = (formData.get('username') as string)?.trim() // store name
  const password = formData.get('password') as string

  if (!email || !username || !password) {
    return { error: 'Email, store name, and password are required.' }
  }


  if (username.length < 2) {
    return { error: 'Store name must be at least 2 characters.' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  // Check if email is already taken
  const { data: existingByEmail } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingByEmail) {
    return { error: 'This email is already registered. Please login instead.' }
  }

  // Check if store name is already taken
  const { data: existingByUsername } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existingByUsername) {
    return { error: 'This store name is already taken. Please choose another.' }
  }

  // Hash password and create user
  const password_hash = await bcrypt.hash(password, 10)

  const { error } = await supabaseAdmin.from('users').insert({
    email,
    username,
    password_hash,
  })


  if (error) {
    return { error: 'Failed to create account. Please try again.' }
  }

  return { success: true }
}
