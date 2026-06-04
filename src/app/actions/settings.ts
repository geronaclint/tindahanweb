'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function updateSettings(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  const newName = formData.get('storeName') as string
  const password = formData.get('password') as string
  const profilePhoto = formData.get('profilePhoto') as string

  if (!newName) return { error: 'Store name is required' }

  const updates: any = {
    username: newName.trim(),
  }

  if (profilePhoto) {
     updates.profile_photo = profilePhoto
  }

  if (password && password.length > 0) {
    if (password.length < 6) return { error: 'Password must be at least 6 characters' }
    updates.password_hash = await bcrypt.hash(password, 10)
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', session.userId)

  if (error) {
    if (error.code === '42703') { // PostgreSQL code for undefined_column
       return { error: 'The profile_photo column does not exist in your database yet! Please run this SQL command in Supabase: ALTER TABLE users ADD COLUMN profile_photo TEXT;' }
    }
    // If username (store name) is already taken
    if (error.code === '23505') {
       return { error: 'This Store Name is already taken.' }
    }
    return { error: `Database error: ${error.message}` }
  }

  // Log the action
  await supabaseAdmin.from('activity_logs').insert({
    action: 'Settings Updated',
    description: `Store settings were modified.`,
  })

  return { success: true }
}
