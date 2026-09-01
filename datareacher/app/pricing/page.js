import CreditPacks from '@/components/CreditPacks'

export const metadata = { title: 'Tarifs' }

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-site px-5 py-16">
      <h1 className="font-display text-4xl">Tu prends. Tu t’en vas.</h1>
      <p className="mt-4 max-w-xl text-mute">
        Pas d’abonnement. Un shoot, tu l’utilises où tu veux, tu repars. Ce qui ne sort pas, tu ne le paies pas.
      </p>
      <CreditPacks />
      <p className="mt-10 max-w-xl text-sm text-mute">
        Les 20 premières lignes, c’est pour goûter. Sans carte. Sans compte.
      </p>
    </div>
  )
}
