import { siteConfig } from '../lib/config'
import { getArticleDoor } from '../lib/article-door'

const COPY = {
  datareacher: {
    kicker: 'Pour aller plus loin',
    line: 'Listes, scripts, data — tu as ta liste ce soir.',
    cta: 'Ouvrir Datareacher',
  },
  outreacher: {
    kicker: 'Pour aller plus loin',
    line: 'Outbound : une campagne en 14 jours, tu appuies sur envoi.',
    cta: 'Ouvrir Outreacher',
  },
}

/**
 * Encart de fin d’article : une porte unique (lien souligné, noir / blanc).
 */
export default function ArticleDoorCard({ post }) {
  const door = getArticleDoor(post, siteConfig.network)
  const copy = COPY[door.id] || COPY.datareacher

  return (
    <aside
      className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800"
      aria-label={copy.kicker}
    >
      <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mb-3">
        {copy.kicker}
      </p>
      <div className="flex items-start gap-3">
        {door.icon ? (
          <span
            className={`mt-0.5 inline-flex w-6 h-6 shrink-0 items-center justify-center overflow-hidden ${
              door.iconShape === 'round' ? '' : 'rounded-md'
            } ${door.iconOnDark === 'plate' ? 'dark:bg-white dark:p-[3px]' : ''}`}
          >
            <img
              src={door.icon}
              alt=""
              width={24}
              height={24}
              className={`w-full h-full ${
                door.iconShape === 'round' ? 'rounded-full object-cover' : 'rounded-md object-contain'
              }`}
            />
          </span>
        ) : null}
        <div className="min-w-0">
          <a
            href={door.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 decoration-neutral-300 dark:decoration-neutral-600 hover:decoration-neutral-900 dark:hover:decoration-neutral-100 text-neutral-900 dark:text-neutral-100 font-medium transition-colors"
          >
            {copy.cta}
          </a>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 tracking-tight">
            {copy.line}
          </p>
        </div>
      </div>
    </aside>
  )
}
