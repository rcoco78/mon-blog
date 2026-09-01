import ScraperList from '@/components/ScraperList'

export const metadata = {
  title: 'Le menu',
}

export default function ScrapersPage() {
  return (
    <div className="mx-auto max-w-site px-5 py-16">
      <h1 className="font-display text-4xl">Le menu</h1>
      <p className="mt-3 max-w-xl text-mute">
        Tu choisis. Tu prends. Tu repars. La vidéo t’envoie déjà sur la bonne fiche.
      </p>
      <div className="mt-10">
        <ScraperList />
      </div>
    </div>
  )
}
