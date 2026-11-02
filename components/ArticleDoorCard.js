import Link from 'next/link'
import { siteConfig } from '../lib/config'
import { pickArticleDoor } from '../lib/article-door'

const linkClass =
  'underline underline-offset-2 text-neutral-900 dark:text-neutral-100'

/**
 * Porte du sujet, au même poids qu’un lien dans le fil.
 */
export default function ArticleDoorCard({ post }) {
  const id = pickArticleDoor(post)
  const door = siteConfig.network[id] || siteConfig.network.datareacher
  const label = door?.title || 'Datareacher'

  return (
    <p className="text-neutral-800 dark:text-neutral-200 tracking-tight">
      La suite de ce sujet :{' '}
      {door?.external ? (
        <a href={door.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {label}
        </a>
      ) : (
        <Link href={door?.href || '/marketplace'} className={linkClass}>
          {label}
        </Link>
      )}.
    </p>
  )
}
