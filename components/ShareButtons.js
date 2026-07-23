import { useMemo, useState } from 'react'

const iconClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900'

export default function ShareButtons({ url, title }) {
  const shareUrl = useMemo(() => encodeURIComponent(url), [url])
  const shareTitle = useMemo(() => encodeURIComponent(title), [title])
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Fallback silencieux
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className={iconClass}
        aria-label="Partager sur X"
        title="Partager sur X"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.831L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <a
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className={iconClass}
        aria-label="Partager sur LinkedIn"
        title="Partager sur LinkedIn"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </a>
      <button
        type="button"
        onClick={copyLink}
        className={iconClass}
        aria-label={copied ? 'Lien copié' : 'Copier le lien'}
        title={copied ? 'Lien copié' : 'Copier le lien'}
      >
        {copied ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        )}
      </button>
      {copied ? (
        <span className="text-xs text-neutral-500 dark:text-neutral-400 animate-[fade-in_0.2s_ease-out]">
          Copié
        </span>
      ) : null}
    </div>
  )
}
