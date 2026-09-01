import ScraperList from '@/components/ScraperList'

export const metadata = {
  title: 'Scrapers',
}

export default function ScrapersPage() {
  return (
    <div className="mx-auto max-w-site px-5 py-16">
      <h1 className="font-serif text-4xl">Scrapers</h1>
      <p className="mt-3 max-w-xl text-mute">
        Un compte, un solde. Chaque fiche indique le coût d’une ligne réussie. YouTube pointe directement sur{' '}
        <code className="text-sm">/s/…</code>.
      </p>
      <div className="mt-10">
        <ScraperList />
      </div>
    </div>
  )
}
