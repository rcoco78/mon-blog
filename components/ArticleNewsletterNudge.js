import { useState, useEffect } from 'react'
import { getPosthogIdentityHeaders, identifySubscriber, captureCta } from '../lib/posthog-client'
import { FLOW } from '../lib/posthog-events'

const STORAGE_KEY = 'cr-newsletter-nudge-dismissed'

/**
 * Nudge newsletter desktop uniquement (barre basse discrète).
 * Sur mobile : pas de barre fixe — le formulaire de fin d'article suffit
 * (évite l'effet popup qui mange l'écran).
 */
export default function ArticleNewsletterNudge() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(null) // success | error | already

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return
    } catch {
      // ignore
    }

    // Mobile / tablette étroite : pas de nudge fixed
    const mq = window.matchMedia('(max-width: 767px)')
    if (mq.matches) return

    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (mq.matches) {
          setVisible(false)
          return
        }
        const el = document.documentElement
        const scrollTop = el.scrollTop || document.body.scrollTop
        const max = Math.max((el.scrollHeight || document.body.scrollHeight) - el.clientHeight, 1)
        const progress = (scrollTop / max) * 100

        if (progress >= 55 && progress < 88) {
          setVisible(true)
        } else if (progress >= 88) {
          setVisible(false)
        }
      })
    }

    const onMq = () => {
      if (mq.matches) setVisible(false)
      else onScroll()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    mq.addEventListener?.('change', onMq)
    onScroll()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      mq.removeEventListener?.('change', onMq)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus(null)
    try {
      captureCta({ flow: FLOW.newsletter, source: 'article_nudge', cta: 'subscribe' })
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getPosthogIdentityHeaders(),
        },
        body: JSON.stringify({ email, source: 'article_nudge' }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        identifySubscriber(email)
        setStatus(data.alreadySubscribed ? 'already' : 'success')
        setEmail('')
        window.setTimeout(dismiss, 1600)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div
      className="hidden md:block fixed bottom-0 inset-x-0 z-40 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95"
      role="region"
      aria-label="Newsletter"
    >
      <div className="relative max-w-2xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tracking-tight">
            La suite de ce type de retour d&apos;expérience
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            1 email / semaine max
            {status === 'success' ? ' · Inscrit — merci.' : null}
            {status === 'already' ? ' · Déjà inscrit.' : null}
            {status === 'error' ? ' · Erreur, réessayez.' : null}
          </p>
        </div>

        {status !== 'success' && status !== 'already' ? (
          <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
            <label className="sr-only" htmlFor="article-nudge-email">
              Adresse email
            </label>
            <input
              id="article-nudge-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={isLoading}
              className="w-44 px-3 py-1.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? '…' : "S'inscrire"}
            </button>
          </form>
        ) : null}

        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          aria-label="Fermer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
