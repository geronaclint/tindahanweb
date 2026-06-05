'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'

function IconMail({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 4L12 13 2 4" />
    </svg>
  )
}

function IconStore({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 9l1.2-4.2A2 2 0 0 1 6.13 3.2h11.74a2 2 0 0 1 1.93 1.6L21 9" />
      <path d="M3 9v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" />
      <path d="M3 9h18" />
      <path d="M8 13v4M16 13v4" />
    </svg>
  )
}

function IconLock({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconEye({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function IconSun({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function IconMoon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function IconCheck({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6L9 17l-5-5" style={{ strokeDasharray: 24, strokeDashoffset: 24, animation: 'check-draw 350ms 120ms ease forwards' }} />
    </svg>
  )
}

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('theme')
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (isDark) document.documentElement.classList.add('dark')
    return isDark
  })
  const [animError, setAnimError] = useState(false)

  function toggleTheme() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setAnimError(false)
    const formData = new FormData(e.currentTarget)

    const password = formData.get('password') as string
    const confirm = formData.get('confirm_password') as string

    if (password !== confirm) {
      setError('Passwords do not match.')
      setAnimError(true)
      setTimeout(() => setAnimError(false), 500)
      return
    }

    startTransition(async () => {
      const result = await register(formData)
      if (result?.error) {
        setError(result.error)
        setAnimError(true)
        setTimeout(() => setAnimError(false), 500)
      } else {
        setSuccess('Store created! Redirecting to sign in…')
        setTimeout(() => { window.location.href = '/login' }, 1800)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative" style={{ backgroundColor: 'var(--bg)' }}>
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--text) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <button onClick={toggleTheme} className="theme-toggle absolute top-5 right-5 z-10" title={dark ? 'Light mode' : 'Dark mode'}>
        {dark ? <IconSun /> : <IconMoon />}
      </button>

      <div className="w-full max-w-[380px] animate-float-in">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-5 group">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
              style={{ backgroundColor: 'var(--text)', color: 'var(--bg)', animation: 'pulse-ring 2.5s infinite' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                <path d="M3 9l1.2-4.2A2 2 0 0 1 6.13 3.2h11.74a2 2 0 0 1 1.93 1.6L21 9" />
                <path d="M3 9v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" />
                <path d="M3 9h18" />
                <path d="M8 13v4M16 13v4" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            Create your store
          </h1>
          <p className="text-[13px] mt-1.5 max-w-[260px]" style={{ color: 'var(--text-muted)' }}>
            Set up your Tindahan POS account
          </p>
        </div>

        {/* Register card */}
        <div className={`surface p-6 ${animError ? 'animate-shake' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error / Success */}
            {error && (
              <div className="p-3 rounded-lg text-[12.5px] font-medium flex items-center gap-2" style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg text-[12.5px] font-medium flex items-center gap-2" style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}>
                <IconCheck />
                {success}
              </div>
            )}

            {/* Email */}
            <div className="float-input">
              <input id="email" name="email" type="email" autoComplete="email" required placeholder=" " className="input" style={{ paddingLeft: 38 }} />
              <div className="absolute left-[13px] top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-subtle)' }}>
                <IconMail />
              </div>
              <span className="float-label">Email address</span>
            </div>

            {/* Store name */}
            <div className="float-input">
              <input id="username" name="username" type="text" autoComplete="organization" required placeholder=" " className="input" style={{ paddingLeft: 38 }} />
              <div className="absolute left-[13px] top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-subtle)' }}>
                <IconStore />
              </div>
              <span className="float-label">Store name</span>
            </div>

            {/* Password */}
            <div className="float-input">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={6} placeholder=" " className="input" style={{ paddingLeft: 38, paddingRight: 42 }} />
              <div className="absolute left-[13px] top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-subtle)' }}>
                <IconLock />
              </div>
              <span className="float-label">Password</span>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-[10px] top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md transition-colors" style={{ color: 'var(--text-subtle)' }} tabIndex={-1}>
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>

            {/* Confirm password */}
            <div className="float-input">
              <input id="confirm_password" name="confirm_password" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" required minLength={6} placeholder=" " className="input" style={{ paddingLeft: 38, paddingRight: 42 }} />
              <div className="absolute left-[13px] top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-subtle)' }}>
                <IconLock />
              </div>
              <span className="float-label">Confirm password</span>
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-[10px] top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md transition-colors" style={{ color: 'var(--text-subtle)' }} tabIndex={-1}>
                {showConfirm ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>

            <button type="submit" disabled={isPending || !!success} className="btn btn-primary btn-block btn-lg" style={{ marginTop: 8 }}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[12.5px] mt-6 animate-float-in-delay" style={{ color: 'var(--text-subtle)' }}>
          Already have a store?{' '}
          <Link href="/login" className="font-medium transition-colors hover:underline" style={{ color: 'var(--accent)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
