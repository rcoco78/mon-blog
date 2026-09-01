import Link from 'next/link'
import ScraperList from '@/components/ScraperList'
import { FREE_ROWS } from '@/lib/scrapers'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-site px-5">
      <section className="max-w-3xl py-20">
        <h1 className="font-serif text-5xl leading-[1.1] text-ink sm:text-6xl">
          Lance un scraper.
          <br />
          Paie à la ligne.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-mute">
          Tu colles ce que tu as vu dans la vidéo. {FREE_ROWS} résultats sans compte. La suite, des crédits Stripe. Ça tourne sur Render.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/s/airbnb-hosts"
            className="rounded-full bg-pine px-5 py-2.5 text-sm text-cream hover:bg-pineHover"
          >
            Essayer Airbnb hôtes
          </Link>
          <Link href="/scrapers" className="rounded-full border border-line px-5 py-2.5 text-sm hover:border-ink">
            Tous les scrapers
          </Link>
        </div>
      </section>

      <section className="pb-16">
        <h2 className="mb-4 font-serif text-2xl">Quelques scrapers</h2>
        <ScraperList featuredOnly />
      </section>

      <section className="grid gap-10 border-t border-line py-16 sm:grid-cols-3">
        <div>
          <p className="font-serif text-xl">1. La vidéo</p>
          <p className="mt-2 text-sm text-mute">Un lien, une fiche. Pas de catalogue à traverser.</p>
        </div>
        <div>
          <p className="font-serif text-xl">2. {FREE_ROWS} lignes</p>
          <p className="mt-2 text-sm text-mute">Sans compte. Tu vois si ça sort ce que tu veux.</p>
        </div>
        <div>
          <p className="font-serif text-xl">3. Stripe</p>
          <p className="mt-2 text-sm text-mute">Un pack de crédits, un wallet, tous les scrapers.</p>
        </div>
      </section>
    </div>
  )
}
