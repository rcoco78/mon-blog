import Link from 'next/link'

/**
 * Bandeau série en tête d’article — pour tous les posts rattachés à une série.
 */
export default function SeriesBanner({ series, isHub = false }) {
  if (!series) return null

  return (
    <div className="mb-8 rounded-lg border border-neutral-200 dark:border-neutral-800 px-4 py-3.5 text-sm text-neutral-600 dark:text-neutral-400">
      <p>
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          Série {series.title}
        </span>
        {series.description ? (
          <span className="text-neutral-500 dark:text-neutral-500"> — {series.description}</span>
        ) : null}
      </p>
      {!isHub && series.hub ? (
        <p className="mt-1.5">
          Point d’entrée :{' '}
          <Link
            href={`/blog/${series.hub}`}
            className="text-neutral-900 dark:text-neutral-100 underline underline-offset-2 hover:no-underline"
          >
            voir le hub de la série
          </Link>
        </p>
      ) : (
        <p className="mt-1.5 text-neutral-500 dark:text-neutral-500">
          Tu es sur le hub — les autres volets sont listés en bas de page.
        </p>
      )}
    </div>
  )
}
