/**
 * Next.js Proxy — Protects all routes except /login
 * (Renamed from middleware.ts — Next.js 16 renamed this to proxy.ts)
 * Runs before every request to check authentication
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/register']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths without a session check
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  // Read the session cookie
  const sessionCookie = request.cookies.get('session')?.value

  if (!sessionCookie) {
    // No session — redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify the JWT is valid and not expired
  const session = await decrypt(sessionCookie)
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Session is valid — allow the request
  return NextResponse.next()
}

// Apply proxy to all routes except static files and Next.js internals
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-).*)'],
}
