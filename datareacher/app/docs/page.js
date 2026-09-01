export const metadata = { title: 'Docs' }

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-serif text-4xl">Docs</h1>
      <p className="mt-4 text-mute">
        Une route. Une clé. Des crédits. Le détail d’input est sur la fiche scraper.
      </p>

      <h2 className="mt-12 font-serif text-2xl">Run</h2>
      <pre className="mt-4 overflow-x-auto border border-line bg-cream p-4 text-sm">
        {`POST /api/run
Content-Type: application/json

{
  "slug": "airbnb-hosts",
  "input": "Paris"
}`}
      </pre>

      <h2 className="mt-12 font-serif text-2xl">Plus tard</h2>
      <p className="mt-3 text-mute">
        <code className="text-sm">POST https://api.datareacher.com/v1/run</code> avec{' '}
        <code className="text-sm">x-api-key</code>. Le worker Render exécute. Stripe recharge le solde.
      </p>
    </div>
  )
}
