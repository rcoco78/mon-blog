// Config alignée sur le snippet officiel PostHog (EU).
// Le token projet est une write key client — même chose que le <script> HTML.
export const POSTHOG_PROJECT_TOKEN =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
  'phc_vXr8fsxKt4kLdF479ftzjnDCD9intJzyEbEQ7TEujfvD'

export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

export const POSTHOG_UI_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://eu.posthog.com'

export const posthogInitOptions = {
  api_host: POSTHOG_HOST,
  ui_host: POSTHOG_UI_HOST,
  defaults: '2026-05-30',
  person_profiles: 'identified_only',
}
