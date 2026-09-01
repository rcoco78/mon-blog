import Link from 'next/link'

export const metadata = { title: 'Journal' }

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl">Journal</h1>
      <p className="mt-4 text-mute">
        Ce qu’on sort. Pas un discours. Le lien sous la vidéo t’envoie déjà goûter.
      </p>
      <article className="mt-12 border-t border-line pt-8">
        <p className="text-xs uppercase tracking-widest text-mute">Un shoot</p>
        <h2 className="mt-2 font-display text-2xl">Les hôtes Airbnb d’une ville</h2>
        <p className="mt-3 text-mute">
          Tu arrives. Tu goûtes 20 lignes. Tu emportes. Tu repars. Pas un fichier à 180 €.
        </p>
        <Link href="/s/airbnb-hosts" className="mt-4 inline-block text-sm underline">
          Goûter
        </Link>
      </article>
    </div>
  )
}
