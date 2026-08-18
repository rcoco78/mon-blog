import { randomUUID } from 'crypto'
import { PostHog } from 'posthog-node'
import { POSTHOG_HOST, POSTHOG_PROJECT_TOKEN } from './posthog-config'

let posthogClient = null

export function getPostHogClient() {
  const token = POSTHOG_PROJECT_TOKEN
  if (!token) return null

  if (!posthogClient) {
    posthogClient = new PostHog(token, {
      host: POSTHOG_HOST,
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

  await shutdownPostHog()
}

export async function identifyServerUser(distinctId, properties = {}) {
  const posthog = getPostHogClient()
  if (!posthog || !distinctId) return

  posthog.identify({
    distinctId,
    properties,
  })

  await shutdownPostHog()
}

export async function captureServerException(error, req, extra = {}) {
  const posthog = getPostHogClient()
  if (!posthog) return

  try {
    posthog.captureException(error, getDistinctId(req), extra)
    await shutdownPostHog()
  } catch {
    // no-op: analytics must never break the API
  }
}

export async function shutdownPostHog() {
  if (!posthogClient) return
  await posthogClient.shutdown()
  posthogClient = null
}
