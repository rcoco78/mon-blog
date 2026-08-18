import posthog from 'posthog-js'

let initialized = false

export function initPostHog() {
  if (typeof window === 'undefined' || initialized) return

  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (!token) return

  posthog.init(token, {
    api_host: '/ingest',
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://eu.posthog.com',
    defaults: '2026-01-30',
    capture_pageview: 'history_change',
    capture_exceptions: true,
    person_profiles: 'identified_only',
    session_recording: {
      maskAllInputs: true,
    },
    loaded: (client) => {
      if (process.env.NODE_ENV === 'development') {
        client.debug()
      }
    },
  })

  initialized = true
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
  if (typeof window === 'undefined' || !email || !initialized) return

  try {
    posthog.identify(email, { email })
  } catch {
    // no-op
  }
}

export function trackCalendlyOpened({ source } = {}) {
  if (typeof window === 'undefined' || !initialized) return

  try {
    posthog.capture('calendly_opened', { source })
  } catch {
    // no-op
  }
}
