import Link from 'next/link'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-site flex-col gap-6 px-5 py-10 text-sm text-mute sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" aria-label="Datareacher, accueil">
          <Logo />
        </Link>
        <div className="flex flex-wrap gap-4">
          <Link href="/docs" className="hover:text-ink">
            Docs
          </Link>
          <Link href="/blog" className="hover:text-ink">
            Blog
          </Link>
          <Link href="/legal/cgu" className="hover:text-ink">
            CGU
          </Link>
          <Link href="/legal/confidentialite" className="hover:text-ink">
            Confidentialité
          </Link>
        </div>
      </div>
    </footer>
  )
}
