import Link from 'next/link'
import { scrapers } from '@/lib/scrapers'

export default function ScraperList({ featuredOnly = false }) {
  const items = featuredOnly ? scrapers.filter((item) => item.featured) : scrapers

  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <li key={item.slug}>
          <Link href={item.youtubePath} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
            <span className="text-ink">{item.name}</span>
            <span className="text-sm text-mute sm:text-right">{item.promise}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
