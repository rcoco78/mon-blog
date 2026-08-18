import { captureCta, trackCalendlyOpened, trackCalendlyScheduled } from './posthog-client'
import { FLOW } from './posthog-events'

export const CALENDLY_URL = 'https://calendly.com/corentinrobert/20min'

const SOURCE_KEY = 'ph_calendly_source'

function rememberSource(source) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SOURCE_KEY, source || '')
  } catch {
    // no-op
  }
}

function readSource() {
  if (typeof window === 'undefined') return undefined
  try {
    return sessionStorage.getItem(SOURCE_KEY) || undefined
  } catch {
    return undefined
  }
}

function bindCalendlyMessages() {
  if (typeof window === 'undefined' || window.__phCalendlyBound) return
  window.__phCalendlyBound = true

  window.addEventListener('message', (event) => {
    const name = event.data?.event
    if (name !== 'calendly.event_scheduled') return
    trackCalendlyScheduled({ source: readSource() })
  })
}

export function trackInlineCalendly(source) {
  if (typeof window === 'undefined') return
  rememberSource(source)
  bindCalendlyMessages()
  captureCta({ flow: FLOW.freelance, source, cta: 'calendly_embed' })
  trackCalendlyOpened({ source })
}

export function openCalendlyPopup(source) {
  if (typeof window === 'undefined') return

  rememberSource(source)
  bindCalendlyMessages()
  captureCta({ flow: FLOW.freelance, source, cta: 'calendly' })
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
