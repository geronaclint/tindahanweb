'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const formData = new FormData(e.currentTarget)

    const password = formData.get('password') as string
    const confirm = formData.get('confirm_password') as string

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const result = await register(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess('Store registered successfully! Redirecting to login...')
        setTimeout(() => (window.location.href = '/login'), 1500)
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
            Create your store
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Register a new Tindahan POS account.
          </p>
        </div>

        <div className="surface p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="p-3 rounded-lg text-[13px]"
                style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                className="p-3 rounded-lg text-[13px]"
                style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}
              >
                {success}
              </div>
            )}

            <div>
              <label htmlFor="email" className="field-label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="username" className="field-label">Store name</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="e.g. Aling Nena's Store"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="confirm_password" className="field-label">Confirm password</label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                minLength={6}
                placeholder="Re-enter your password"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary btn-block btn-lg"
            >
              {isPending ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] mt-6" style={{ color: 'var(--text-subtle)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium" style={{ color: 'var(--accent)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
