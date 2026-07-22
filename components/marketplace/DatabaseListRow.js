/**
 * Ligne de liste pour une base marketplace — style blog (pas de carte).
 */

import ContentListRow from '../ContentListRow'
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
    />
  )
}
