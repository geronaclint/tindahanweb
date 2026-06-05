/**
 * Navigation component — shared sidebar/bottom nav for all protected pages
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { useTransition, useState, useEffect } from 'react'

const navLinks = [
  { href: '/',          label: 'POS',       icon: 'storefront',   title: 'Point of Sale' },
  { href: '/inventory', label: 'Inventory', icon: 'package',      title: 'Inventory' },
  { href: '/sales',     label: 'Sales',     icon: 'receipt',      title: 'Sales Records' },
  { href: '/logs',      label: 'Logs',      icon: 'list',         title: 'Activity Logs' },
  { href: '/settings',  label: 'Settings',  icon: 'settings',     title: 'Store Profile' },
]

// Inline icons — stroke-based, 18px, minimal style
function NavIcon({ name, className = 'w-[18px] h-[18px]' }: { name: string; className?: string }) {
  const stroke = 'currentColor'
  const sw = 1.6
  switch (name) {
    case 'storefront':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M3 9l1.2-4.2A2 2 0 0 1 6.13 3.2h11.74a2 2 0 0 1 1.93 1.6L21 9" />
          <path d="M3 9v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" />
          <path d="M3 9h18" />
          <path d="M8 13v4M16 13v4" />
        </svg>
      )
    case 'package':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
          <path d="M3 8l9 5 9-5" />
          <path d="M12 13v8" />
        </svg>
      )
    case 'receipt':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2V3z" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      )
    case 'list':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M8 6h13M8 12h13M8 18h13" />
          <circle cx="4" cy="6" r="1.2" />
          <circle cx="4" cy="12" r="1.2" />
          <circle cx="4" cy="18" r="1.2" />
        </svg>
      )
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.4.6 1 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      )
    case 'logout':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      )
    default: return null
  }
}

export default function Navigation({ storeName, profilePhoto }: { storeName?: string, profilePhoto?: string | null }) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  // Initialize dark mode on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  function handleLogoutConfirm() {
    setShowLogoutModal(false)
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-[232px] fixed top-0 left-0 h-screen z-20 border-r"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Brand + store */}
        <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ backgroundColor: 'var(--text)', color: 'var(--bg)' }}
            >
              <span className="text-sm font-semibold tracking-tight">T</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight truncate" style={{ color: 'var(--text)' }}>
                {storeName || 'Tindahan POS'}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'var(--text-subtle)' }}>
                Store Management
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.title}
                className="flex items-center gap-2.5 px-2.5 h-9 rounded-md text-[13.5px] font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--bg-subtle)' : 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--text-muted)',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isActive ? 'var(--accent)' : 'transparent' }}
                  aria-hidden
                />
                <NavIcon name={link.icon} />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer / Profile */}
        <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5 px-1.5 mb-2">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Store" className="w-7 h-7 rounded-full object-cover" style={{ border: '1px solid var(--border)' }} />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                {storeName ? storeName.charAt(0).toUpperCase() : '🛒'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium truncate" style={{ color: 'var(--text)' }}>
                {storeName || 'Store'}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'var(--text-subtle)' }}>
                Signed in
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={isPending}
            className="btn btn-secondary btn-block"
            style={{ height: 34, fontSize: '13px' }}
          >
            <NavIcon name="logout" className="w-[15px] h-[15px]" />
            <span>{isPending ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="grid grid-cols-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
                style={{ color: isActive ? 'var(--text)' : 'var(--text-muted)' }}
              >
                <NavIcon name={link.icon} className="w-[19px] h-[19px]" />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={isPending}
            className="flex flex-col items-center justify-center py-2 gap-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <NavIcon name="logout" className="w-[19px] h-[19px]" />
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-backdrop" onClick={() => setShowLogoutModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <h3 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
                Log out?
              </h3>
              <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
                You&apos;ll need to sign in again to access your store.
              </p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="btn btn-danger-solid"
                style={{ flex: 1 }}
              >
                {isPending ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
