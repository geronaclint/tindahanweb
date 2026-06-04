import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Safely fetch user trying to get profile photo (fails gracefully if column doesn't exist)
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('username, profile_photo')
    .eq('id', session.userId)
    .maybeSingle()

  if (error || !user) {
    // If table column doesn't exist, just return the session username
    return NextResponse.json({ username: session.username })
  }

  return NextResponse.json({ 
    username: user.username,
    profile_photo: user.profile_photo || null 
  })
}
