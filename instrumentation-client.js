// Client-side Sentry init (Next.js instrumentation-client convention)
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  enabled: !!(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
  // Bruit navigateurs in-app (Instagram/iOS WebView) — pas notre code
  // Fixes CORENTIN-BLOG-7
  ignoreErrors: [
    /webkit\.messageHandlers/i,
    /sendPageHideMessage/i,
    /sendDataToNative/i,
  ],
  denyUrls: [
    /^app:\/\//i,
  ],
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
