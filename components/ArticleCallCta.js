import { openCalendlyPopup } from '../lib/calendly'

export default function ArticleCallCta() {
  return (
    <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
      <p className="font-semibold text-lg tracking-tighter text-neutral-900 dark:text-neutral-100">
        Un scraping ou une automatisation à livrer ?
      </p>
      <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400 tracking-tight">
        Appel de 20 min — besoin, délai et prix dans la foulée.
      </p>
      <button
        type="button"
        onClick={() => openCalendlyPopup('article_end')}
        className="mt-4 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Réserver un appel
      </button>
    </div>
  )
}
