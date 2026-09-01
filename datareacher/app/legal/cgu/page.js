export const metadata = { title: 'Conditions générales' }

export default function CguPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-serif text-4xl">Conditions générales</h1>
      <div className="mt-8 space-y-4 text-mute">
        <p>
          Datareacher fournit un logiciel self-serve : tu lances un scraper, tu reçois des lignes, tu paies des crédits Stripe pour le volume au-delà de l’essai.
        </p>
        <p>
          L’exécution est assurée par notre worker (Render). Tu restes responsable de l’usage que tu fais des résultats (RGPD, prospection B2B, CGU des sources).
        </p>
        <p>
          Une ligne n’est débitée que si le run la retourne. Les échecs ne sont pas facturés. L’essai (20 lignes / fiche) ne nécessite pas de compte.
        </p>
        <p>Contact : hello@datareacher.com</p>
      </div>
    </div>
  )
}
