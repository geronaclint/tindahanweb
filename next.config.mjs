import withPWAInit from '@ducanh2912/next-pwa'

const nextConfig = {
  // Add an empty turbopack config to silence the webpack warning
  turbopack: {},
}

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
})

export default withPWA(nextConfig)
