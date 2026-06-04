/**
 * Protected layout — wraps all authenticated pages
 * Shows the navigation sidebar/bottom bar
 */
import Navigation from '@/components/Navigation'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  // Safely attempt to read profile photo (fail gracefully if column missing)
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('username, profile_photo')
    .eq('id', session.userId)
    .maybeSingle()
    
  const storeName = user?.username || session.username
  const profilePhoto = user?.profile_photo || null

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <Navigation storeName={storeName} profilePhoto={profilePhoto} />

      {/* Main content area — offset by sidebar width on desktop */}
      <main className="flex-1 md:ml-52 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
