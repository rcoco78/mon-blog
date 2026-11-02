/**
 * Ligne de liste pour une base marketplace — style blog (pas de carte).
 */

import ContentListRow from '../ContentListRow'
import {
  marketplaceHomeTitle,
  marketplaceBenefit,
  formatEuros,
  priceHT,
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
  const amount = tool.annualPrice || tool.price
  const price =
    tool.isPaid && amount
      ? `${formatEuros(priceHT(amount))} € HT`
      : 'Gratuit'
  const rows =
    tool.rowCount > 0 ? `${Number(tool.rowCount).toLocaleString('fr-FR')} entrées` : null
  const source = views != null ? views : tool.views
  const viewCount = Number(source)
  const viewsLabel =
    Number.isFinite(viewCount) && viewCount > 0 ? formatViewCount(viewCount) : null

  const meta = [
    rows,
    showCategory && tool.category ? tool.category : null,
    viewsLabel,
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
