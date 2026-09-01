import Link from 'next/link'

export const metadata = { title: 'Créer un compte' }

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="font-serif text-4xl">Compte</h1>
      <p className="mt-3 text-mute">
        Après les 20 lignes. Email + Stripe pour garder le solde et relancer.
      </p>
      <form className="mt-8 space-y-4" action="/account" method="get">
        <label className="block text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2 outline-none focus:border-pine"
          />
        </label>
        <label className="block text-sm">
          Mot de passe
          <input
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2 outline-none focus:border-pine"
          />
        </label>
        <button type="submit" className="w-full rounded-full bg-pine py-2.5 text-sm text-white hover:bg-pineHover">
          Continuer
        </button>
      </form>
      <p className="mt-6 text-sm text-mute">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-ink underline">
          Connexion
        </Link>
      </p>
    </div>
  )
}
