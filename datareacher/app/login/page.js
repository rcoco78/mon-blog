import Link from 'next/link'

export const metadata = { title: 'Connexion' }

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="font-serif text-4xl">Connexion</h1>
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
            className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2 outline-none focus:border-pine"
          />
        </label>
        <button type="submit" className="w-full rounded-full bg-pine py-2.5 text-sm text-white hover:bg-pineHover">
          Entrer
        </button>
      </form>
      <p className="mt-6 text-sm text-mute">
        Pas encore de compte ?{' '}
        <Link href="/signup" className="text-ink underline">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
