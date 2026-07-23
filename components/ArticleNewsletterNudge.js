import { useState, useEffect } from 'react'

const STORAGE_KEY = 'cr-newsletter-nudge-dismissed'

/**
 * Nudge newsletter discret après ~55 % de lecture.
 * Pas de modal : barre basse, une fois, dismissible.
 * Objectif : valeur perçue (notes terrain), pas "communauté" pushy.
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

    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = document.documentElement
        const scrollTop = el.scrollTop || document.body.scrollTop
        const max = Math.max((el.scrollHeight || document.body.scrollHeight) - el.clientHeight, 1)
        const progress = (scrollTop / max) * 100

        // Milieu de lecture : assez engagé, pas encore en bas
        if (progress >= 55 && progress < 88) {
          setVisible(true)
        } else if (progress >= 88) {
          // Le formulaire de fin d'article prend le relais
          setVisible(false)
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
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
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
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
      className="fixed bottom-0 inset-x-0 z-40 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-[2px]"
      role="region"
      aria-label="Newsletter"
    >
      <div className="relative max-w-2xl mx-auto px-4 py-3 pr-10 sm:pr-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tracking-tight">
            La suite de ce type de retour d&apos;expérience
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">
            1 email / semaine max — notes terrain scraping &amp; automatisation.
          </p>
          {status === 'success' ? (
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Inscrit — merci.</p>
          ) : null}
          {status === 'already' ? (
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Vous êtes déjà inscrit.</p>
          ) : null}
          {status === 'error' ? (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Erreur, réessayez.</p>
          ) : null}
        </div>

        {status !== 'success' && status !== 'already' ? (
          <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
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
              className="flex-1 sm:w-48 px-3 py-1.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
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
          className="absolute top-2 right-3 sm:static sm:ml-1 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
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
