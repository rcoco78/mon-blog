/**
 * Filtres Sentry pour le bruit injecté par les WebViews natives
 * (Instagram / Facebook / Android) et les extensions navigateur.
 *
 * ignoreErrors ne matche que le message d'exception — pas les noms
 * de fonctions de stack. CORENTIN-BLOG-9 passait donc à travers :
 * message = "Error invoking postMessage: Java object is gone"
 * (logger Android, beforeunload, pont Java déjà détruit).
 */

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
