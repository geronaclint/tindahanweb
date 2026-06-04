/**
 * Protected layout — wraps all authenticated pages
 * Shows the navigation sidebar/bottom bar
 */
import Navigation from '@/components/Navigation'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Double-check session (middleware also guards, but belts and suspenders)
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <Navigation storeName={session?.username} />

      {/* Main content area — offset by sidebar width on desktop */}
      <main className="flex-1 md:ml-52 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
