import Link from 'next/link'
import { siteConfig } from '../lib/config'
import { getArticleDoor, pickArticleDoor } from '../lib/article-door'

const COPY = {
  marketplace: {
    kicker: 'Dans le même fil — données',
    line: 'Les bases que je vends sont sur la marketplace : tu choisis, tu paies, tu copies le Sheet.',
    cta: 'Voir les bases',
  },
  outreacher: {
    kicker: 'Dans le même fil — outbound',
    line: 'Outreacher prolonge ces notes avec mes ressources consacrées aux campagnes.',
    cta: 'Voir les ressources sur Outreacher',
  },
}

/**
 * Note de fin d’article : une ressource contextuelle selon le sujet.
 */
export default function ArticleDoorCard({ post }) {
  const doorId = pickArticleDoor(post) === 'outreacher' ? 'outreacher' : 'marketplace'
  const door = doorId === 'outreacher' ? getArticleDoor(post, siteConfig.network) : null
  const copy = COPY[doorId]

  const linkClass =
    'underline underline-offset-2 decoration-neutral-300 dark:decoration-neutral-600 hover:decoration-neutral-900 dark:hover:decoration-neutral-100 text-neutral-900 dark:text-neutral-100 font-medium transition-colors'

  return (
    <aside
      className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800"
      aria-label={copy.kicker}
    >
      <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mb-3">
        {copy.kicker}
      </p>
      <div className="flex items-start gap-3">
        {door?.icon ? (
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
          {doorId === 'marketplace' ? (
            <Link href="/marketplace" className={linkClass}>
              {copy.cta}
            </Link>
          ) : (
            <a href={door.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {copy.cta}
            </a>
          )}
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 tracking-tight">
            {copy.line}
          </p>
        </div>
      </div>
    </aside>
  )
}
