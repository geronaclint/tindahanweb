import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Use Inter font for clean, readable UI
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tindahan POS | Store Management System',
  description: 'Point of sale and inventory management system for Filipino retail stores',
  manifest: '/manifest.json',
  // PWA meta tags for iOS
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tindahan POS',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom on input focus on mobile
  themeColor: '#1d4ed8',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
