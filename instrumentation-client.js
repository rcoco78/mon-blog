// Client-side Sentry + PostHog init (Next.js instrumentation-client convention)
import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import { POSTHOG_PROJECT_TOKEN, posthogInitOptions } from './lib/posthog-config'
import { isNativeWebViewBridgeNoise } from './lib/sentry-filters'

if (POSTHOG_PROJECT_TOKEN) {
  posthog.init(POSTHOG_PROJECT_TOKEN, posthogInitOptions)
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  enabled: !!(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
  // Bruit tiers (WebView / extensions) — pas notre code
  // Fixes CORENTIN-BLOG-7 (Instagram iOS), CORENTIN-BLOG-8 (MetaMask),
  // CORENTIN-BLOG-9 (Instagram Android / pont Java)
  ignoreErrors: [
    /webkit\.messageHandlers/i,
    /sendPageHideMessage/i,
    /sendDataToNative/i,
    /Java object is gone/i,
    /Error invoking postMessage/i,
    /Failed to connect to MetaMask/i,
    /MetaMask extension not found/i,
    /MetaMask/i,
  ],
  denyUrls: [
    /navigation_performance_logger/i,
    /^app:\/\//i,
    /scripts\/inpage\.js/i,
    /extensions\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
  ],
  beforeSend(event) {
    if (isNativeWebViewBridgeNoise(event)) {
      return null
    }
    return event
  },
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
