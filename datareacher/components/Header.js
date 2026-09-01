import Link from 'next/link'

const links = [
  { href: '/scrapers', label: 'Scrapers' },
  { href: '/pricing', label: 'Tarifs' },
  { href: '/docs', label: 'Docs' },
]

export default function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-site items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="font-serif text-xl tracking-tight text-ink">
          Datareacher
        </Link>
        <nav className="flex max-w-[70%] flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm text-mute">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
          <Link href="/login" className="hover:text-ink">
            Compte
          </Link>
          <Link
            href="/s/airbnb-hosts"
            className="rounded-full bg-pine px-3.5 py-1.5 text-cream hover:bg-pineHover"
          >
            Essayer
          </Link>
        </nav>
      </div>
    </header>
  )
}
