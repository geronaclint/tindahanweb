/**
 * Navigation component — shared sidebar/bottom nav for all protected pages
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { useTransition } from 'react'

const navLinks = [
  { href: '/', label: '🏪 POS', title: 'Point of Sale' },
  { href: '/inventory', label: '📦 Inventory', title: 'Inventory' },
  { href: '/sales', label: '💰 Sales', title: 'Sales Records' },
  { href: '/logs', label: '📋 Logs', title: 'Activity Logs' },
]

export default function Navigation() {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 bg-white border-r border-gray-200 min-h-screen fixed top-0 left-0 z-10">
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-blue-700">🛒 Tindahan POS</h1>
          <p className="text-xs text-gray-400 mt-0.5">Store Management</p>
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
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? '...' : '🚪 Logout'}
          </button>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 flex">
        {navLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-lg leading-none">{link.label.split(' ')[0]}</span>
              <span className="mt-0.5">{link.title}</span>
            </Link>
          )
        })}
        {/* Mobile logout button */}
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="flex-1 flex flex-col items-center justify-center py-2 text-xs text-red-500 font-medium"
        >
          <span className="text-lg leading-none">🚪</span>
          <span className="mt-0.5">Logout</span>
        </button>
      </nav>
    </>
  )
}
