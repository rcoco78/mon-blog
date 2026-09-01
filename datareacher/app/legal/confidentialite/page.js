export const metadata = { title: 'Confidentialité' }

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-serif text-4xl">Confidentialité</h1>
      <div className="mt-8 space-y-4 text-mute">
        <p>
          Compte : email et identifiants. Paiement : Stripe (nous ne stockons pas les numéros de carte). Runs : input et résultats le temps du job, pour te les renvoyer.
        </p>
        <p>
          Pas de revente de tes fichiers de run. Les données que tu extrais d’une source tierce restent sous ta responsabilité.
        </p>
        <p>Contact : hello@datareacher.com</p>
      </div>
    </div>
  )
}
