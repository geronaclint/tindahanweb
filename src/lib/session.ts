/**
 * Session management using Jose (JWT) stored in httpOnly cookies
 * This file runs server-only — never imported by client components
 */
import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// Encode the secret key for signing JWTs
const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

export type SessionPayload = {
  userId: string
  username: string
  expiresAt: Date
}

// Create a signed JWT containing the session payload
export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

// Verify and decode a session JWT
export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch {
    // Token invalid or expired
    return null
  }
}

// Store a session cookie after successful login
export async function createSession(userId: string, username: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const session = await encrypt({ userId, username, expiresAt })
  const cookieStore = await cookies()

  cookieStore.set('session', session, {
    httpOnly: true,               // JS can't read it (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

// Read the current session from the cookie
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  return await decrypt(session)
}

// Delete the session cookie (logout)
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
