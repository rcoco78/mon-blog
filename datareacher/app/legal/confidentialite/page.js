export const metadata = { title: 'Confidentialité' }

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl">Confidentialité</h1>
      <div className="mt-8 space-y-4 text-mute">
        <p>
          Compte : ton email. Paiement : un prestataire s’en charge, on ne garde pas tes numéros de carte. Tes listes : le temps de te les donner.
        </p>
        <p>
          On ne revend pas ce que tu sors. Ce que tu extraits d’un site, c’est à toi d’en faire un usage propre.
        </p>
        <p>Contact : hello@datareacher.com</p>
      </div>
    </div>
  )
}
