export const metadata = { title: 'Comment ça marche' }

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl">Comment ça marche</h1>
      <p className="mt-4 text-mute">
        Tu es entrepreneur. Tu n’as pas une après-midi. Tu viens, tu prends ton shoot, tu repars.
      </p>

      <h2 className="mt-12 font-display text-2xl">Tu arrives</h2>
      <p className="mt-3 text-mute">
        Le lien sous la vidéo. Tu es déjà sur la fiche. Tu colles ce que tu as — une ville, une liste, un nom.
      </p>

      <h2 className="mt-12 font-display text-2xl">Tu goûtes</h2>
      <p className="mt-3 text-mute">
        20 lignes. Tout de suite. Sans compte. Tu vois si c’est ça.
      </p>

      <h2 className="mt-12 font-display text-2xl">Tu emportes. Tu repars.</h2>
      <p className="mt-3 text-mute">
        La suite, tu la prends. Un shoot à 20 €, une tournée à 50, un stock à 150. Ensuite tu t’en vas. On ne te retient pas.
      </p>
    </div>
  )
}
