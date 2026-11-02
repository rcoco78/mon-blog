import Link from 'next/link'
import CreditPacks from '@/components/CreditPacks'

export const metadata = { title: 'Compte' }

export default function AccountPage({ searchParams }) {
  const paid = searchParams?.paid
  const email = searchParams?.email

  return (
    <div className="mx-auto max-w-site px-5 py-16">
      <h1 className="font-display text-4xl">Ton coin</h1>
      {email ? <p className="mt-2 text-mute">{email}</p> : null}
      {paid ? (
        <p className="mt-4 border border-pine bg-cream px-4 py-3 text-sm">
          C’est bon. Tu peux emporter la suite.
        </p>
      ) : null}

      <dl className="mt-10 grid gap-8 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-widest text-mute">Ce qu’il te reste</dt>
          <dd className="mt-2 font-display text-4xl">{paid ? 'Prêt' : 'Rien encore'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-widest text-mute">Tes shoots</dt>
          <dd className="mt-2 text-mute">Aucun pour l’instant</dd>
        </div>
      </dl>

      <h2 className="mt-16 font-display text-2xl">Prendre un shoot</h2>
      <CreditPacks />

      <p className="mt-10 text-sm text-mute">
        <Link href="/s/airbnb-hosts" className="underline">
          Reprendre Airbnb
        </Link>
      </p>
    </div>
  )
}
