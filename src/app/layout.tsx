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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Apply dark mode before paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var saved = localStorage.getItem('theme');
            if (saved !== 'light') {
              document.documentElement.classList.add('dark');
            }
          })();
        ` }} />
        {/* PWA icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
