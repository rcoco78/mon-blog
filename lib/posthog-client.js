import posthog from 'posthog-js'
import { POSTHOG_PROJECT_TOKEN, posthogInitOptions } from './posthog-config'

export function initPostHog() {
  if (typeof window === 'undefined' || posthog.__loaded) return
  if (!POSTHOG_PROJECT_TOKEN) return

  posthog.init(POSTHOG_PROJECT_TOKEN, posthogInitOptions)
}

export function getPosthogIdentityHeaders() {
  if (typeof window === 'undefined') return {}

  try {
    const distinctId = posthog.get_distinct_id?.()
    const sessionId = posthog.get_session_id?.()
    const headers = {}
    if (distinctId) headers['X-POSTHOG-DISTINCT-ID'] = distinctId
    if (sessionId) headers['X-POSTHOG-SESSION-ID'] = sessionId
    return headers
  } catch {
    return {}
  }
}

export function identifySubscriber(email) {
  if (typeof window === 'undefined' || !email || !posthog.__loaded) return

  try {
    posthog.identify(email, { email })
  } catch {
    // no-op
  }
}

export function trackCalendlyOpened({ source } = {}) {
  if (typeof window === 'undefined' || !posthog.__loaded) return

  try {
    posthog.capture('calendly_opened', { source })
  } catch {
    // no-op
  }
}
