import Link from 'next/link'
import { scrapers } from '@/lib/scrapers'

export default function MenuCards({ featuredOnly = false }) {
  const items = featuredOnly ? scrapers.filter((item) => item.featured) : scrapers

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={item.youtubePath}
            className="flex h-full flex-col border border-line bg-paper p-5 transition-colors hover:border-ink"
          >
            <p className="text-xs uppercase tracking-widest text-mute">{item.category}</p>
            <p className="mt-2 font-display text-xl text-ink">{item.name}</p>
            <p className="mt-2 flex-1 text-sm text-mute">{item.promise}</p>
            <p className="mt-4 text-sm text-ink">Goûter →</p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
