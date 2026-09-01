import Link from 'next/link'
import CreditPacks from '@/components/CreditPacks'

export const metadata = { title: 'Compte' }

export default function AccountPage({ searchParams }) {
  const paid = searchParams?.paid
  const email = searchParams?.email

  return (
    <div className="mx-auto max-w-site px-5 py-16">
      <h1 className="font-serif text-4xl">Compte</h1>
      {email ? <p className="mt-2 text-mute">{email}</p> : null}
      {paid ? (
        <p className="mt-4 border border-pine bg-cream px-4 py-3 text-sm">
          Pack {paid} : retour Stripe (branche le webhook pour créditer le solde en dur).
        </p>
      ) : null}

      <dl className="mt-10 grid gap-8 sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-widest text-mute">Solde</dt>
          <dd className="mt-2 font-serif text-4xl">{paid ? '…' : '0'} crédits</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-widest text-mute">Clé API</dt>
          <dd className="mt-2 font-mono text-sm">dr_live_…</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-widest text-mute">Runs</dt>
          <dd className="mt-2 text-mute">Aucun pour l’instant</dd>
        </div>
      </dl>

      <h2 className="mt-16 font-serif text-2xl">Recharger</h2>
      <CreditPacks />

      <p className="mt-10 text-sm text-mute">
        <Link href="/s/airbnb-hosts" className="underline">
          Reprendre le scraper
        </Link>
      </p>
    </div>
  )
}
