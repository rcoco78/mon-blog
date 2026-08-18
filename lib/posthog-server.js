import { randomUUID } from 'crypto'
import { PostHog } from 'posthog-node'

let posthogClient = null

function getProjectToken() {
  return process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || ''
}

export function getPostHogClient() {
  const token = getProjectToken()
  if (!token) return null

  if (!posthogClient) {
    posthogClient = new PostHog(token, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    })
  }

  return posthogClient
}

export function getDistinctId(req, fallback) {
  const header = req?.headers?.['x-posthog-distinct-id']
  if (typeof header === 'string' && header.trim()) return header.trim()
  if (fallback) return fallback
  return randomUUID()
}

export function getSessionId(req) {
  const header = req?.headers?.['x-posthog-session-id']
  return typeof header === 'string' && header.trim() ? header.trim() : undefined
}

export async function captureServerEvent(req, event, properties = {}, distinctIdFallback) {
  const posthog = getPostHogClient()
  if (!posthog) return

  const distinctId = getDistinctId(req, distinctIdFallback)
  const sessionId = getSessionId(req)

  posthog.capture({
    distinctId,
    event,
    properties: {
      ...properties,
      ...(sessionId ? { $session_id: sessionId } : {}),
    },
  })

  await posthog.flush()
}

export async function identifyServerUser(distinctId, properties = {}) {
  const posthog = getPostHogClient()
  if (!posthog || !distinctId) return

  posthog.identify({
    distinctId,
    properties,
  })

  await posthog.flush()
}

export async function captureServerException(error, req, extra = {}) {
  const posthog = getPostHogClient()
  if (!posthog) return

  try {
    posthog.captureException(error, getDistinctId(req), extra)
    await posthog.flush()
  } catch {
    // no-op: analytics must never break the API
  }
}
