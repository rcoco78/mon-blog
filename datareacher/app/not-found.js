import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24">
      <h1 className="font-serif text-4xl">Page introuvable</h1>
      <p className="mt-4 text-mute">Cette fiche n’existe pas encore.</p>
      <Link href="/scrapers" className="mt-6 inline-block text-sm underline">
        Voir les scrapers
      </Link>
    </div>
  )
}
