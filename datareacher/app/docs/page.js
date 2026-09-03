import Link from 'next/link'
import { FREE_ROWS } from '@/lib/scrapers'

export const metadata = {
  title: 'Comment ça marche',
  description:
    'Tu choisis une fiche, tu goûtes 20 lignes, tu emportes la suite. Datareacher, c’est des listes pour entrepreneurs. Pas d’abonnement.',
}

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl">Comment ça marche</h1>
      <p className="mt-4 text-mute">
        Tu es entrepreneur. Tu n’as pas une après-midi. Tu viens, tu prends ton shoot, tu repars. Que tu arrives d’une
        vidéo, de Google, ou d’un copain.
      </p>

      <h2 className="mt-12 font-display text-2xl">Tu choisis</h2>
      <p className="mt-3 text-mute">
        Le menu, ou une fiche directe. Tu colles ce que tu as — une ville, une liste, un nom. Airbnb, Instagram,
        entreprises France, hôtels.
      </p>

      <h2 className="mt-12 font-display text-2xl">Tu goûtes</h2>
      <p className="mt-3 text-mute">
        {FREE_ROWS} lignes. Tout de suite. Sans compte. Tu vois si c’est ça.
      </p>

      <h2 className="mt-12 font-display text-2xl">Tu emportes. Tu repars.</h2>
      <p className="mt-3 text-mute">
        La suite, tu la prends. Un shoot à 20 €, une tournée à 50, un stock à 150. Ensuite tu t’en vas. On ne te retient
        pas.
      </p>

      <p className="mt-12">
        <Link href="/scrapers" className="rounded-full bg-pine px-5 py-2.5 text-sm text-white hover:bg-pineHover">
          Voir le menu
        </Link>
      </p>
    </div>
  )
}
