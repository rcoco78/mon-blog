import posthog from 'posthog-js'
import { POSTHOG_PROJECT_TOKEN, posthogInitOptions } from './posthog-config'
import { EVENT, FLOW, enrichEventProperties } from './posthog-events'

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

export function captureClientEvent(event, properties = {}) {
  if (typeof window === 'undefined' || !posthog.__loaded) return

  try {
    posthog.capture(event, enrichEventProperties(event, {
      path: window.location.pathname,
      ...properties,
    }))
  } catch {
    // no-op
  }
}

export function captureCta({ flow, source, cta, ...rest } = {}) {
  captureClientEvent(EVENT.ctaClicked, { flow, source, cta, ...rest })
}

export function trackCalendlyOpened({ source } = {}) {
  captureClientEvent(EVENT.calendlyOpened, {
    flow: FLOW.freelance,
    source,
    cta: 'calendly',
  })
}

export function trackCalendlyScheduled({ source } = {}) {
  captureClientEvent(EVENT.calendlyScheduled, {
    flow: FLOW.freelance,
    source,
    cta: 'calendly',
  })
}

export function trackFaqOpened({ question, source } = {}) {
  captureClientEvent(EVENT.faqOpened, {
    flow: FLOW.freelance,
    source,
    question,
  })
}
