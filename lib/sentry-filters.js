/**
 * Filtres Sentry pour le bruit injecté par les WebViews natives
 * (Instagram / Facebook / Android), les extensions navigateur, et un
 * invariant Next.js sans impact utilisateur.
 *
 * ignoreErrors ne matche que le message d'exception — pas les noms
 * de fonctions de stack. CORENTIN-BLOG-9 passait donc à travers :
 * message = "Error invoking postMessage: Java object is gone"
 * (logger Android, beforeunload, pont Java déjà détruit).
 *
 * CORENTIN-BLOG-A : Instagram in-app ouvre /?utm_… puis Next tente un
 * hard-nav vers la même URL (échec /_next/data). La page SSR est déjà là.
 */

const SAME_URL_HARD_NAV =
  /Invariant: attempted to hard navigate to the same URL/i

export function isNextSameUrlNavigationMessage(message) {
  return SAME_URL_HARD_NAV.test(String(message || ''))
}

export function isNextSameUrlNavigationNoise(event) {
  const values = event.exception?.values || []
  return values.some((value) =>
    isNextSameUrlNavigationMessage(`${value.type || ''} ${value.value || ''}`)
  )
}

export function isNativeWebViewBridgeNoise(event) {
  const values = event.exception?.values || []

  for (const value of values) {
    const message = `${value.type || ''} ${value.value || ''}`
    if (
      /Java object is gone/i.test(message) ||
      /Error invoking postMessage/i.test(message) ||
      /webkit\.messageHandlers/i.test(message)
    ) {
      return true
    }

    const frames = value.stacktrace?.frames || []
    if (
      frames.some((frame) => {
        const file = frame.filename || ''
        const fn = frame.function || ''
        return (
          /navigation_performance_logger/i.test(file) ||
          /sendDataToNative|sendBeforeUnloadMessage|sendPageHideMessage/i.test(fn)
        )
      })
    ) {
      return true
    }
  }

  return false
}

export function shouldDropSentryEvent(event) {
  return isNativeWebViewBridgeNoise(event) || isNextSameUrlNavigationNoise(event)
}

export function preventSameUrlHardNavigationNoise() {
  if (typeof window === 'undefined') return () => {}

  const onUnhandled = (event) => {
    const message = event.reason?.message || String(event.reason || '')
    if (isNextSameUrlNavigationMessage(message)) {
      event.preventDefault()
    }
  }

  window.addEventListener('unhandledrejection', onUnhandled)
  return () => window.removeEventListener('unhandledrejection', onUnhandled)
}
