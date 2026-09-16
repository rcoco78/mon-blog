import Link from 'next/link'
import { siteConfig } from '../lib/config'

/** Petite carte réseau en fin d’article — marketplace + Datareacher, pas un second catalogue. */
export default function ArticleNetworkHint() {
  return (
    <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-500 tracking-tight">
      Bases Google Sheets :{' '}
      <Link
        href="/marketplace"
        className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        marketplace
      </Link>
      {' · '}
      Scripts :{' '}
      <a
        href={siteConfig.network.datareacher.href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        Datareacher
      </a>
      .
    </p>
  )
}
