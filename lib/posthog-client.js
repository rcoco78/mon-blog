import posthog from 'posthog-js'

function getInitOptions() {
  return {
    api_host: '/ingest',
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://eu.posthog.com',
    defaults: '2026-05-30',
    session_recording: {
      maskAllInputs: true,
    },
  }
}

export function initPostHog() {
  if (typeof window === 'undefined' || posthog.__loaded) return

  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (!token) return

  posthog.init(token, getInitOptions())
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
