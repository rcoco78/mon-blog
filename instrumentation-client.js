// Client-side Sentry init (Next.js instrumentation-client convention)
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  enabled: !!(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
  // Bruit tiers (WebView / extensions) — pas notre code
  // Fixes CORENTIN-BLOG-7 (Instagram), CORENTIN-BLOG-8 (MetaMask)
  ignoreErrors: [
    /webkit\.messageHandlers/i,
    /sendPageHideMessage/i,
    /sendDataToNative/i,
    /Failed to connect to MetaMask/i,
    /MetaMask extension not found/i,
    /MetaMask/i,
  ],
  denyUrls: [
    /^app:\/\//i,
    /scripts\/inpage\.js/i,
    /extensions\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
  ],
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
