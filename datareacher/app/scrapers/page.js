import MenuCards from '@/components/MenuCards'

export const metadata = {
  title: 'Le menu',
  description:
    'Listes Airbnb, Instagram, Booking, entreprises France, ORIAS. Tu choisis, tu goûtes, tu emportes, tu repars.',
}

export default function ScrapersPage() {
  return (
    <div className="mx-auto max-w-site px-5 py-16">
      <h1 className="font-display text-4xl">Le menu</h1>
      <p className="mt-3 max-w-xl text-mute">
        Tu choisis. Tu prends. Tu repars. Hôtes, @, entreprises, hôtels — selon ce dont tu as besoin ce soir.
      </p>
      <div className="mt-10">
        <MenuCards />
      </div>
    </div>
  )
}
