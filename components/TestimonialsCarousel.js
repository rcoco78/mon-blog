import { useRef, useState } from 'react'
import Link from 'next/link'
import { testimonials } from '../lib/testimonials'

const SOURCE_BADGE = {
  LinkedIn: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  Fiverr: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  Malt: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
}

function sourceBadgeClass(source) {
  return (
    SOURCE_BADGE[source] ||
    'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
  )
}

const HOME_TESTIMONIALS = [...testimonials]
  .sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished))
  .slice(0, 5)

/**
 * Carrousel témoignages — translation contrôlée (pas de scroll natif).
 * Flèches + dots + swipe tactile.
 */
export default function TestimonialsCarousel({ count = 5 }) {
  const items = HOME_TESTIMONIALS.slice(0, count)
  const [index, setIndex] = useState(0)
  const touchStartX = useRef(null)
  const touchDeltaX = useRef(0)

  const max = items.length - 1
  const goTo = (i) => setIndex(Math.max(0, Math.min(i, max)))
  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(max, i + 1))

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
  }

  const onTouchMove = (e) => {
    if (touchStartX.current == null) return
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }

  const onTouchEnd = () => {
    const delta = touchDeltaX.current
    touchStartX.current = null
    touchDeltaX.current = 0
    if (Math.abs(delta) < 40) return
    if (delta < 0) next()
    else prev()
  }

  if (items.length === 0) return null

  return (
    <section className="relative" aria-label="Témoignages clients">
      <h2 className="font-semibold text-xl mb-2 tracking-tighter">Témoignages</h2>
      <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
        Avis clients Malt, Fiverr et LinkedIn.
      </p>

      <div
        className="relative rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50"
        role="region"
        aria-roledescription="carousel"
        aria-label="Carrousel de témoignages"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            prev()
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            next()
          }
        }}
      >
        <div
          className="overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex transition-transform duration-300 ease-out will-change-transform"
            style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
          >
            {items.map((t, i) => (
              <figure
                key={`${t.authorName}-${t.datePublished}-${i}`}
                className="w-full shrink-0 grow-0 basis-full px-12 py-5 sm:px-14 sm:py-6 flex flex-col min-h-[200px]"
                aria-hidden={i !== index}
              >
                <blockquote className="flex-1">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 italic leading-relaxed line-clamp-6">
                    « {t.reviewBody} »
                  </p>
                </blockquote>
                <figcaption className="mt-4 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                      {t.authorName}
                    </p>
                    {t.authorJob && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 truncate">
                        {t.authorJob}
                      </p>
                    )}
                  </div>
                  {t.source && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${sourceBadgeClass(t.source)}`}
                    >
                      {t.source}
                    </span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 text-neutral-700 dark:text-neutral-200 shadow-sm disabled:opacity-25 disabled:pointer-events-none hover:bg-white dark:hover:bg-neutral-900 transition-colors"
          aria-label="Témoignage précédent"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={next}
          disabled={index === max}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 text-neutral-700 dark:text-neutral-200 shadow-sm disabled:opacity-25 disabled:pointer-events-none hover:bg-white dark:hover:bg-neutral-900 transition-colors"
          aria-label="Témoignage suivant"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"
            />
          </svg>
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="Navigation témoignages">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={index === i}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              index === i
                ? 'w-6 bg-neutral-900 dark:bg-neutral-100'
                : 'w-1.5 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600'
            }`}
            aria-label={`Témoignage ${i + 1} sur ${items.length}`}
          />
        ))}
      </div>

      <p className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-500 tabular-nums" aria-live="polite">
        {index + 1} / {items.length}
      </p>

      <div className="mt-4 text-center">
        <Link
          href="/temoignages"
          className="text-sm font-normal text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
        >
          Voir tous les témoignages
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z"
              fill="currentColor"
            />
          </svg>
        </Link>
      </div>
    </section>
  )
}
