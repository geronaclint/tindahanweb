/**
 * Navigation component — shared sidebar/bottom nav for all protected pages
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { useTransition, useState, useEffect } from 'react'

const navLinks = [
  { href: '/', label: '🏪 POS', title: 'Point of Sale' },
  { href: '/inventory', label: '📦 Inventory', title: 'Inventory' },
  { href: '/sales', label: '💰 Sales', title: 'Sales Records' },
  { href: '/logs', label: '📋 Logs', title: 'Activity Logs' },
  { href: '/settings', label: '⚙️ Settings', title: 'Store Profile' },
]

export default function Navigation({ storeName, profilePhoto }: { storeName?: string, profilePhoto?: string | null }) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  function toggleDarkMode() {
    setIsDarkMode((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      return next
    })
  }

  function handleLogoutConfim() {
    setShowLogoutModal(false)
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-screen fixed top-0 left-0 z-10 transition-colors">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Store" className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 text-xl font-bold border border-blue-200 dark:border-blue-800 flex-shrink-0">
              {storeName ? storeName.charAt(0).toUpperCase() : '🛒'}
            </div>
          )}
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-blue-700 dark:text-blue-400 truncate w-full">{storeName || 'Tindahan POS'}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">Store Management</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.title}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors flex justify-between items-center"
          >
            <span>{isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
            <span className="text-xs text-gray-400">{isDarkMode ? 'ON' : 'OFF'}</span>
          </button>
          
          {/* Logout */}
          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={isPending}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? 'Logging out...' : '🚪 Logout'}
          </button>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-10 flex">
        {navLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span className="text-lg leading-none">{link.label.split(' ')[0]}</span>
              <span className="mt-0.5">{link.title}</span>
            </Link>
          )
        })}
        {/* Mobile Settings dropdown toggle (Replaces raw logout for real estate) */}
        <button
          onClick={toggleDarkMode}
          className="flex-1 flex flex-col items-center justify-center py-2 text-xs text-gray-500 hover:text-gray-700  dark:text-gray-400 dark:hover:text-gray-200 font-medium"
        >
          <span className="text-lg leading-none">{isDarkMode ? '🌙' : '☀️'}</span>
          <span className="mt-0.5">Theme</span>
        </button>
        
        <button
          onClick={() => setShowLogoutModal(true)}
          disabled={isPending}
          className="flex-1 flex flex-col items-center justify-center py-2 text-xs text-red-500 font-medium"
        >
          <span className="text-lg leading-none">🚪</span>
          <span className="mt-0.5">Logout</span>
        </button>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Confirm Logout</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-5">
              Are you sure you want to completely log out of the POS system?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfim}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
              >
                {isPending ? 'Logging Out...' : 'Yes, Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
