import { openCalendlyPopup } from '../lib/calendly'

export default function ArticleCallCta() {
  return (
    <p className="mt-10 text-neutral-600 dark:text-neutral-400 tracking-tight">
      Une mission à cadrer, 20 minutes.{' '}
      <button
        type="button"
        onClick={() => openCalendlyPopup('article_end')}
        className="underline underline-offset-2 text-neutral-900 dark:text-neutral-100"
      >
        Réserver un appel
      </button>
      .
    </p>
  )
}
