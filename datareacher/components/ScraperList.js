import Link from 'next/link'
import { scrapers } from '@/lib/scrapers'

const CATEGORY_ORDER = ['Voyage', 'Réseaux', 'Entreprises', 'Immo']

function List({ items }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={item.youtubePath}
            className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
          >
            <span className="text-ink">{item.name}</span>
            <span className="text-sm text-mute sm:text-right">{item.promise}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function ScraperList({ featuredOnly = false, grouped = false }) {
  const items = featuredOnly ? scrapers.filter((item) => item.featured) : scrapers

  if (!grouped) {
    return <List items={items} />
  }

  const categories = CATEGORY_ORDER.filter((cat) => items.some((item) => item.category === cat))

  return (
    <div className="space-y-10">
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="mb-3 font-display text-lg text-ink">{cat}</h3>
          <List items={items.filter((item) => item.category === cat)} />
        </div>
      ))}
    </div>
  )
}
