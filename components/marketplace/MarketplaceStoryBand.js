/**
 * Bande horizontale « story » — DA journal, scroll-snap, une slide ≈ largeur colonne.
 */

import Link from 'next/link'
import { siteConfig } from '../../lib/config'
import {
  marketplaceHomeTitle,
  marketplaceBenefit,
  formatEuros,
  priceHT,
  priceTTC,
} from '../../lib/marketplace-display'
import { categoryToSlug } from '../../lib/marketplace-helpers'
import { formatViewCount } from '../../lib/view-label'
import { toEmbedVideoUrl } from '../../lib/marketplace-videos'

function StoryMedia({ tool, title }) {
  const embedUrl = toEmbedVideoUrl(tool?.videoUrl || tool?.enrichedData?.videoUrl)

  if (embedUrl) {
    return (
      <div className="relative w-full aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <iframe
          className="absolute top-0 left-0 w-full h-full border-0"
          src={embedUrl}
          allowFullScreen
          title={`Présentation ${title}`}
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden border border-neutral-200 dark:border-neutral-800">
      <img
        src={siteConfig.profileImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover object-[center_28%] blur-md"
      />
      <div className="absolute inset-0 bg-white/55 dark:bg-neutral-950/60" aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-sm text-neutral-800 dark:text-neutral-200">
          Vidéo en cours de création
        </p>
      </div>
    </div>
  )
}

function storyViewsLabel(tool) {
  const source = tool?.views
  if (source == null || source === '') return null
  return formatViewCount(source)
}

function StorySlide({ tool, carousel }) {
  const title = marketplaceHomeTitle(tool)
  const benefit = marketplaceBenefit(tool)
  const viewsLabel = storyViewsLabel(tool)
  const rows =
    tool.rowCount > 0 ? `${Number(tool.rowCount).toLocaleString('fr-FR')} entrées` : null
  const meta = [tool.category, rows, viewsLabel].filter(Boolean)
  const href =
    tool.link ||
    (tool.slug && tool.category
      ? `/marketplace/${categoryToSlug(tool.category)}/${tool.slug}`
      : '#')
  const priceAmount = tool.annualPrice || tool.price
  const price = tool.isPaid && priceAmount != null && priceAmount !== ''
    ? (
        <span className="inline-flex flex-col items-end leading-tight tabular-nums">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {formatEuros(priceTTC(priceAmount))} €
          </span>
          <span className="text-xs font-normal text-neutral-500">
            {formatEuros(priceHT(priceAmount))} € HT
          </span>
        </span>
      )
    : (
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          Gratuit
        </span>
      )

  return (
    <article
      className={carousel ? 'w-full min-w-full shrink-0 snap-start snap-always pr-0' : 'w-full'}
    >
      <StoryMedia tool={tool} title={title} />
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base tracking-tight text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>
          {meta.length > 0 && (
            <p className="mt-1 text-xs text-neutral-500">{meta.join(' · ')}</p>
          )}
          <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
            {benefit}
          </p>
          <Link
            href={href}
            className="mt-3 inline-block text-sm text-neutral-900 dark:text-neutral-100 underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600 hover:decoration-neutral-900 dark:hover:decoration-neutral-100 transition-colors"
          >
            Voir la base
          </Link>
        </div>
        <div className="flex-shrink-0 pt-0.5 text-right">{price}</div>
      </div>
    </article>
  )
}

export default function MarketplaceStoryBand({ tools = [] }) {
  if (!tools.length) return null

  const carousel = tools.length > 1

  return (
    <section className="mb-10" aria-label="Présentation des bases">
      {carousel ? (
        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0">
          {tools.map((tool) => (
            <StorySlide key={tool.slug || tool.name} tool={tool} carousel />
          ))}
        </div>
      ) : (
        <StorySlide tool={tools[0]} carousel={false} />
      )}
    </section>
  )
}
