import CreditPacks from '@/components/CreditPacks'

export const metadata = { title: 'Tarifs' }

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-site px-5 py-16">
      <h1 className="font-serif text-4xl">Un wallet, tous les scrapers</h1>
      <p className="mt-4 max-w-xl text-mute">
        Tu achètes des crédits. Une ligne réussie en brûle. Un échec ou un vide : 0. Pas d’abonnement, pas de tarif par scraper en euros.
      </p>
      <CreditPacks />
      <p className="mt-10 max-w-xl text-sm text-mute">
        Les 20 premières lignes d’une fiche restent gratuites, sans carte. Stripe n’intervient qu’après.
      </p>
    </div>
  )
}
