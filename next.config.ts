/**
 * next.config.ts — Next.js configuration
 * Includes PWA setup using next-pwa
 */
import type { NextConfig } from 'next'

const withPWA = require('next-pwa')({
  dest: 'public',         // Service worker output directory
  register: true,         // Auto-register service worker
  skipWaiting: true,      // Install new SW immediately
  disable: process.env.NODE_ENV === 'development', // Disable in dev for faster restarts
})

const nextConfig: NextConfig = {
  // No special config needed — App Router is the default
}

module.exports = withPWA(nextConfig)
