/**
 * Helpers Sentry optionnels — no-op si le SDK n'est pas chargé.
 */

export function captureDataError(error, { source, tags = {}, extra = {} } = {}) {
  try {
    // Import dynamique pour ne pas casser le build sans @sentry/nextjs
    // eslint-disable-next-line global-require
    const Sentry = require('@sentry/nextjs')
    if (!Sentry?.captureException) return

    Sentry.captureException(error, {
      tags: {
        source: source || 'unknown',
        ...tags,
      },
      extra,
    })
  } catch {
    // Sentry non installé ou indisponible
  }
}
