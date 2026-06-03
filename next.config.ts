/**
 * next.config.ts — Next.js 16 configuration
 * Uses @ducanh2912/next-pwa for PWA support (Turbopack compatible)
 */
import type { NextConfig } from 'next'
const withPWA = require('@ducanh2912/next-pwa').default

const nextConfig: NextConfig = {
  // Add an empty turbopack config to silence the webpack warning
  turbopack: {},
}

module.exports = withPWA({
  dest: 'public',           // Service worker output directory
  cacheOnFrontEndNav: true, // Cache pages when navigating
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development', // Disable in dev for faster restarts
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig)
