import Link from 'next/link'
import ScraperList from '@/components/ScraperList'
import { FREE_ROWS } from '@/lib/scrapers'

export default function HomePage() {
  return (
    <div>
      <section className="border-b border-line bg-wash/70">
        <div className="mx-auto max-w-site px-5 py-20">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl leading-[1.1] text-ink sm:text-6xl">
              Tu prends ton shoot.
              <br />
              Tu repars.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-mute">
              Tu colles ce que tu as vu dans la vidéo. {FREE_ROWS} lignes pour goûter. Tu emportes la suite. Tu t’en vas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/s/airbnb-hosts"
                className="rounded-full bg-pine px-5 py-2.5 text-sm text-white hover:bg-pineHover"
              >
                Goûter Airbnb
              </Link>
              <Link href="/scrapers" className="rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm hover:border-ink">
                Voir le menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-site px-5">
        <section className="py-16">
          <h2 className="mb-4 font-display text-2xl">Quelques shoots</h2>
          <ScraperList featuredOnly />
        </section>

        <section className="grid gap-10 border-t border-line py-16 sm:grid-cols-3">
          <div>
            <p className="font-display text-xl">1. Tu arrives</p>
            <p className="mt-2 text-sm text-mute">Le lien de la vidéo. Tu es déjà sur la bonne fiche.</p>
          </div>
          <div>
            <p className="font-display text-xl">2. Tu goûtes</p>
            <p className="mt-2 text-sm text-mute">{FREE_ROWS} lignes. Tu vois si c’est ce que tu voulais.</p>
          </div>
          <div>
            <p className="font-display text-xl">3. Tu repars</p>
            <p className="mt-2 text-sm text-mute">Tu emportes la suite. Pas de rendez-vous. Pas de discours.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
