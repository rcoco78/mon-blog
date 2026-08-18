import { trackCalendlyOpened } from './posthog-client'

export const CALENDLY_URL = 'https://calendly.com/corentinrobert/20min'

export function openCalendlyPopup(source) {
  if (typeof window === 'undefined') return

  trackCalendlyOpened({ source })

  const openWidget = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({ url: CALENDLY_URL })
    }
  }

  if (window.Calendly) {
    openWidget()
    return
  }

  if (!document.querySelector('link[href*="calendly.com"]')) {
    const link = document.createElement('link')
    link.href = 'https://assets.calendly.com/assets/external/widget.css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }

  const existingScript = document.querySelector(
    'script[src*="assets.calendly.com/assets/external/widget.js"]'
  )
  if (existingScript) {
    if (existingScript.getAttribute('data-loaded') === '1') {
      openWidget()
      return
    }
    existingScript.addEventListener('load', openWidget, { once: true })
    return
  }

  const script = document.createElement('script')
  script.src = 'https://assets.calendly.com/assets/external/widget.js'
  script.type = 'text/javascript'
  script.async = true
  script.onload = () => {
    script.setAttribute('data-loaded', '1')
    openWidget()
  }
  document.body.appendChild(script)
}
