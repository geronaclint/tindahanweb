/**
 * Login Page — the only public page in the app
 * Has a simple form that submits to the login Server Action
 */
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  // Handle form submission
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await login(formData)
      // If login returns an error (success redirects, no return)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-[360px]">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--text)', color: 'var(--bg)' }}
          >
            <span className="text-base font-semibold tracking-tight">T</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            Sign in to Tindahan
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Welcome back. Enter your details to continue.
          </p>
        </div>

        {/* Login Card */}
        <div className="surface p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div
                className="p-3 rounded-lg text-[13px]"
                style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid transparent' }}
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="field-label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary btn-block btn-lg"
            >
              {isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] mt-6" style={{ color: 'var(--text-subtle)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium" style={{ color: 'var(--accent)' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
