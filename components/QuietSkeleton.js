/**
 * Squelettes « quiet luxury » : même silhouette que le contenu (filets, titres, meta),
 * fond neutre très léger, respiration d’opacité lente. Pas de shimmer, bounce, ni ombre.
 */

const TITLE_WIDTHS = ['72%', '64%', '78%', '58%', '70%', '66%']
const META_WIDTHS = ['38%', '32%', '44%', '28%', '36%', '40%']
const DESC_WIDTHS = ['92%', '84%', '88%', '76%', '90%', '80%']
const POST_TITLE_WIDTHS = ['58%', '72%', '48%', '66%', '54%', '70%', '62%', '50%']

export function QuietBone({ className = '', style, inline = false }) {
  return (
    <span
      className={`quiet-bone ${inline ? 'quiet-bone--inline' : ''} ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  )
}

function SkeletonStatus({ label = 'Chargement' }) {
  return <span className="sr-only">{label}</span>
}

export function QuietSkeletonRow({ variant = 'list', index = 0 }) {
  const i = index % 6

  if (variant === 'post') {
    const titleW = POST_TITLE_WIDTHS[index % POST_TITLE_WIDTHS.length]
    return (
      <div className="w-full flex flex-col md:flex-row mb-4">
        <div className="flex flex-col md:flex-row md:items-center w-full">
          <QuietBone className="h-3.5 w-24 shrink-0" />
          <span
            className="hidden md:inline-block w-0.5 h-0.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-2 shrink-0"
            aria-hidden="true"
          />
          <QuietBone className="h-4 mt-2 md:mt-0 md:max-w-[60%] w-full" style={{ maxWidth: titleW }} />
          <QuietBone className="h-3.5 w-14 md:ml-auto shrink-0 mt-2 md:mt-0" />
        </div>
      </div>
    )
  }

  if (variant === 'spotify') {
    return (
      <div className="flex items-center gap-3 py-3 border-b border-dashed border-neutral-300 dark:border-neutral-700">
        <QuietBone className="h-3 w-4 shrink-0" />
        <QuietBone className="h-8 w-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <QuietBone className="h-3.5 w-2/3 mb-1.5" />
          <QuietBone className="h-2.5 w-1/3" />
        </div>
      </div>
    )
  }

  if (variant === 'rule') {
    return (
      <div className="py-3 border-b border-dashed border-neutral-300 dark:border-neutral-700">
        <QuietBone className="h-[11px]" style={{ width: TITLE_WIDTHS[i] }} />
      </div>
    )
  }

  if (variant === 'prose') {
    return (
      <div className="mb-3">
        <QuietBone className="h-3.5 w-full mb-2" />
        <QuietBone className="h-3.5" style={{ width: DESC_WIDTHS[i] }} />
      </div>
    )
  }

  if (variant === 'kr') {
    return (
      <div className="py-4 border-b border-dashed border-neutral-300 dark:border-neutral-700">
        <QuietBone className="h-3.5 mb-2" style={{ width: TITLE_WIDTHS[i] }} />
        <QuietBone className="h-2.5" style={{ width: META_WIDTHS[i] }} />
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-dashed border-neutral-300 dark:border-neutral-700">
      <div className="min-w-0 flex-1">
        <QuietBone className="h-4" style={{ width: TITLE_WIDTHS[i] }} />
        <QuietBone className="h-2.5 mt-2" style={{ width: META_WIDTHS[i] }} />
        <QuietBone className="h-3 mt-2" style={{ width: DESC_WIDTHS[i] }} />
      </div>
      <QuietBone className="h-4 w-12 shrink-0 mt-0.5" />
    </div>
  )
}

export function QuietSkeletonList({
  count = 6,
  variant = 'list',
  className = '',
  label = 'Chargement',
}) {
  return (
    <div className={className} role="status" aria-live="polite" aria-busy="true">
      <SkeletonStatus label={label} />
      {Array.from({ length: count }, (_, index) => (
        <QuietSkeletonRow key={index} variant={variant} index={index} />
      ))}
    </div>
  )
}

export function MarketplaceListsSkeleton() {
  return (
    <>
      <section className="mb-12" aria-busy="true">
        <h2 className="font-semibold text-xl mb-4 tracking-tighter">Les plus vues</h2>
        <QuietSkeletonList count={6} variant="list" label="Chargement des bases" />
      </section>
      <section className="mb-16" aria-busy="true">
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Toutes</p>
        <QuietSkeletonList count={6} variant="list" label="Chargement du catalogue" />
      </section>
    </>
  )
}

export function QuietRoutePlaceholder({ path = '' }) {
  const pathname = path.split('#')[0].split('?')[0]

  if (pathname === '/marketplace') {
    return (
      <main className="min-w-0 mt-6 flex flex-col overflow-x-hidden">
        <header className="mb-8">
          <h1 className="font-semibold text-2xl mb-3 tracking-tighter">Bases de données B2B</h1>
          <p className="text-neutral-600 dark:text-neutral-400 tracking-tight max-w-2xl">
            Choisir une base, payer, copier le Google Sheet.
          </p>
        </header>
        <MarketplaceListsSkeleton />
      </main>
    )
  }

  if (pathname === '/blog') {
    return (
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="mb-8">
          <h1 className="font-semibold text-2xl mb-3 tracking-tighter">Journal</h1>
          <p className="text-neutral-600 dark:text-neutral-400 tracking-tight">
            Notes de terrain sur la data, l’outbound et le freelance.
          </p>
        </section>
        <section className="mb-16">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Articles</h2>
          <QuietSkeletonList count={8} variant="post" label="Chargement des articles" />
        </section>
      </main>
    )
  }

  if (pathname === '/spotify') {
    return (
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="mb-8">
          <h1 className="font-semibold text-2xl mb-3 tracking-tighter">Musique</h1>
          <p className="text-neutral-600 dark:text-neutral-400 tracking-tight">
            Découvrez ce que j&apos;écoute en ce moment et mes musiques préférées.
          </p>
        </section>
        <QuietSkeletonList count={5} variant="rule" label="Chargement Spotify" />
      </main>
    )
  }

  if (pathname === '/objectifs') {
    return (
      <main className="flex-auto min-w-0 mt-6 flex flex-col overflow-x-hidden">
        <section className="mb-8">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">Objectifs 2026</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-2 tracking-tight">
            Journal public de ma progression métier : scraping, automatisation, data et CA cumulé.
          </p>
        </section>
        <section className="mb-12 pb-8 border-b border-dashed border-neutral-300 dark:border-neutral-700">
          <QuietBone className="h-3 w-28 mb-3" />
          <QuietBone className="h-9 w-36 mb-4" />
          <QuietBone className="h-3.5 w-48 mb-2" />
          <QuietBone className="h-3.5 w-40 mb-2" />
          <QuietBone className="h-3.5 w-52" />
        </section>
        <section>
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Liste des objectifs</h2>
          <QuietSkeletonList count={6} variant="kr" label="Chargement des objectifs" />
        </section>
      </main>
    )
  }

  if (pathname.startsWith('/blog/')) {
    return (
      <article className="flex-auto min-w-0 mt-6 flex flex-col">
        <QuietBone className="h-8 w-4/5 mb-6" />
        <QuietBone className="h-3 w-40 mb-8" />
        <QuietSkeletonList count={8} variant="prose" label="Chargement de l’article" />
      </article>
    )
  }

  if (pathname.startsWith('/marketplace/')) {
    return (
      <main className="min-w-0 mt-6 flex flex-col">
        <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-6">Marketplace</p>
        <QuietBone className="h-7 w-56 mb-8" />
        <QuietSkeletonList count={6} variant="list" label="Chargement des bases" />
      </main>
    )
  }

  if (pathname.startsWith('/cas-usage')) {
    return (
      <main className="min-w-0 mt-6 flex flex-col">
        <h1 className="font-semibold text-2xl mb-4 tracking-tighter">Cas d&apos;usage</h1>
        <QuietSkeletonList count={6} variant="list" label="Chargement des cas d’usage" />
      </main>
    )
  }

  return null
}
