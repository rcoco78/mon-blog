/**
 * Ligne de liste pour une base marketplace — style blog (pas de carte).
 */

import Link from 'next/link'
import {
  shortMarketplaceTitle,
  marketplaceBenefit,
  marketplacePriceLabel,
} from '../../lib/marketplace-display'
import { categoryToSlug } from '../../lib/marketplace-helpers'

export default function DatabaseListRow({ tool, showCategory = true, rank = null }) {
  if (!tool) return null

  const href =
    tool.link ||
    (tool.slug && tool.category
      ? `/marketplace/${categoryToSlug(tool.category)}/${tool.slug}`
      : '#')
  const title = shortMarketplaceTitle(tool.name)
  const benefit = marketplaceBenefit(tool)
  const price = marketplacePriceLabel(tool)
  const rows =
    tool.rowCount > 0 ? `${Number(tool.rowCount).toLocaleString('fr-FR')} entrées` : null

  const meta = [
    showCategory && tool.category ? tool.category : null,
    rows,
    tool.isPaid ? null : 'Gratuit',
  ].filter(Boolean)

  return (
    <Link
      href={href}
      className="group flex items-start justify-between gap-4 py-4 border-b border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-base tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
          {rank != null && (
            <span className="text-neutral-400 dark:text-neutral-500 font-normal mr-2 tabular-nums">
              {rank}.
            </span>
          )}
          {title}
        </h2>
        {meta.length > 0 && (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
            {meta.join(' · ')}
          </p>
        )}
        {benefit && (
          <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
            {benefit}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 text-right pt-0.5">
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap">
          {price}
        </span>
      </div>
    </Link>
  )
}
