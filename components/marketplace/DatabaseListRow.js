/**
 * Ligne de liste pour une base marketplace — style blog (pas de carte).
 */

import ContentListRow from '../ContentListRow'
import {
  marketplaceHomeTitle,
  marketplaceBenefit,
  formatEuros,
  priceHT,
  priceTTC,
} from '../../lib/marketplace-display'
import { categoryToSlug } from '../../lib/marketplace-helpers'
import { formatViewCount } from '../../lib/view-label'

export default function DatabaseListRow({ tool, showCategory = true, rank = null, variant = 'list', views = null }) {
  if (!tool) return null

  const href =
    tool.link ||
    (tool.slug && tool.category
      ? `/marketplace/${categoryToSlug(tool.category)}/${tool.slug}`
      : '#')
  const title = marketplaceHomeTitle(tool)
  const benefit = marketplaceBenefit(tool)
  const price =
    tool.isPaid && (tool.annualPrice || tool.price)
      ? (
          <span className="inline-flex flex-col items-end leading-tight">
            <span>{formatEuros(priceTTC(tool.annualPrice || tool.price))} €</span>
            <span className="text-xs font-normal text-neutral-500">
              {formatEuros(priceHT(tool.annualPrice || tool.price))} € HT
            </span>
          </span>
        )
      : 'Gratuit'
  const rows =
    tool.rowCount > 0 ? `${Number(tool.rowCount).toLocaleString('fr-FR')} entrées` : null
  const source = views != null ? views : tool.views
  const viewsLabel = source == null || source === '' ? null : formatViewCount(source)

  const meta = [
    showCategory && tool.category ? tool.category : null,
    rows,
    viewsLabel,
    tool.isPaid ? null : 'Gratuit',
  ].filter(Boolean)

  const displayTitle =
    rank != null ? (
      <>
        <span className="text-neutral-400 dark:text-neutral-500 font-normal mr-2 tabular-nums">
          {rank}.
        </span>
        {title}
      </>
    ) : (
      title
    )

  return (
    <ContentListRow
      href={href}
      title={displayTitle}
      meta={meta}
      description={benefit}
      trailing={price}
      variant={variant}
    />
  )
}
