import Link from 'next/link'
import { useState, useEffect } from 'react'
import LookAtAvatar from '../components/LookAtAvatar'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { pickFeaturedDatabases } from '../lib/marketplace-catalog'
import { toEmbedVideoUrl } from '../lib/marketplace-videos'
import FAQ from '../components/FAQ'
import DatabaseListRow from '../components/marketplace/DatabaseListRow'
import MarketplaceStoryBand from '../components/marketplace/MarketplaceStoryBand'
import { MarketplaceListsSkeleton } from '../components/QuietSkeleton'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import { averageStarRating } from '../lib/rating'
import { openCalendlyPopup } from '../lib/calendly'

const SORT_OPTIONS = [
  { value: 'date', label: 'Plus récents' },
  { value: 'price_desc', label: 'Prix' },
  { value: 'views', label: 'Vues' },
]

export default function Marketplace({
  dynamicDatabases = [],
  marketplaceReviews = [],
}) {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedPricing, setSelectedPricing] = useState(null) // '<100' | '100-200' | '200+' | 'free' | null
  const [sortBy, setSortBy] = useState('date')
  const [searchQuery, setSearchQuery] = useState('')
  const [displayedCount, setDisplayedCount] = useState(8)
  const ITEMS_PER_PAGE = 8
  const datareacherHref = siteConfig.network.datareacher.href
  const hasCatalog = (dynamicDatabases || []).length > 0
  const [catalogSettled, setCatalogSettled] = useState(hasCatalog)

  useEffect(() => {
    if (hasCatalog) {
      setCatalogSettled(true)
      return
    }
    const timer = window.setTimeout(() => setCatalogSettled(true), 4000)
    return () => window.clearTimeout(timer)
  }, [hasCatalog])

  const showCatalogSkeleton = !hasCatalog && !catalogSettled

  const pricingRanges = [
    { value: null, label: 'Tous' },
    { value: 'free', label: 'Gratuit' },
    { value: '<100', label: '< 100€', min: 1, max: 99 },
    { value: '100-200', label: '100-200€', min: 100, max: 200 },
    { value: '200+', label: '200€+', min: 201, max: Infinity }
  ]

  // Cette page ne liste que les bases Google Sheets. Les scripts sont sur Datareacher.
  const allTools = dynamicDatabases || []
  
  // Extraire les catégories uniques dynamiquement depuis les bases de données uniquement
  const categories = Array.from(
    new Set(
      (dynamicDatabases || [])
        .map(tool => tool.category)
        .filter(category => category && category.trim() !== '')
    )
  ).sort() // Trier par ordre alphabétique
  
  // Filtrer les bases de données (catégorie, prix, recherche texte)
  const filteredTools = allTools
    .filter(tool => {
      const matchesCategory = selectedCategory === null || tool.category === selectedCategory
      let matchesPricing = true
      if (selectedPricing !== null) {
        if (selectedPricing === 'free') {
          matchesPricing = !tool.isPaid || (tool.annualPrice || tool.price || 0) === 0
        } else {
          const priceRange = pricingRanges.find(r => r.value === selectedPricing)
          if (priceRange?.min != null) {
            const toolPrice = tool.annualPrice || tool.price || 0
            matchesPricing = tool.isPaid && toolPrice >= priceRange.min && toolPrice <= priceRange.max
          }
        }
      }
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch = !q ||
        (tool.name || '').toLowerCase().includes(q) ||
        (tool.description || '').toLowerCase().includes(q) ||
        (tool.shortDescription || '').toLowerCase().includes(q) ||
        (tool.category || '').toLowerCase().includes(q)
      return matchesCategory && matchesPricing && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'price_desc') {
        const pa = a.isPaid ? (a.annualPrice || a.price || 0) : 0
        const pb = b.isPaid ? (b.annualPrice || b.price || 0) : 0
        return pb - pa
      }
      if (sortBy === 'views') {
        const va = a.views || 0
        const vb = b.views || 0
        if (vb !== va) return vb - va
      }
      const getDate = (tool) => {
        if (tool.lastEnriched) return new Date(tool.lastEnriched)
        return tool.date ? new Date(tool.date) : new Date(0)
      }
      return getDate(b) - getDate(a)
    })

  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE)
  }, [selectedCategory, selectedPricing, sortBy, searchQuery])

  const openCalendly = () => openCalendlyPopup('marketplace')

  // Structured Data pour la marketplace
  const toolsStructuredData = {
    name: 'Marketplace — Bases Google Sheets',
    description: 'Bases de données Google Sheets pour la prospection et l’analyse business. Achat Stripe, copie dans votre Drive.',
    numberOfItems: allTools.length,
    items: allTools.map((tool, index) => {
      const item = {
        '@type': tool.type === 'database' ? 'Dataset' : 'SoftwareApplication',
        name: tool.name,
        description: tool.description,
        applicationCategory: 'BusinessApplication',
        offers: {
          '@type': 'Offer',
          price: tool.isPaid ? (tool.annualPrice || tool.price || 0).toString() : '0',
          priceCurrency: 'EUR',
          availability: tool.isPaid ? 'https://schema.org/InStock' : 'https://schema.org/InStock',
          priceValidUntil: (() => {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            return date.toISOString().split('T')[0];
          })()
        },
        url: `${siteConfig.url}${tool.link}`
      }
      
      // Ajouter les champs license et creator pour les bases de données (Dataset)
      if (tool.type === 'database') {
        item.license = 'https://creativecommons.org/licenses/by/4.0/'
        item.creator = {
          '@type': 'Person',
          name: siteConfig.author,
          url: siteConfig.url
        }
      }
      
      return {
        '@type': 'ListItem',
        position: index + 1,
        item
      }
    })
  }

  // Structured Data pour FAQ
  const faqData = {
    questions: [
      {
        '@type': 'Question',
        name: 'Comment utiliser concrètement les bases de données ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '1) Ouvrez la fiche de la base, 2) Payez en un clic via Stripe (Google Sheets), 3) Sur la page de confirmation, cliquez sur « Copier sur Google Sheets » pour créer une copie dans votre Drive, 4) Utilisez le Sheet tel quel ou exportez en CSV / Excel vers votre CRM. Aucune compétence technique requise.'
        }
      },
      {
        '@type': 'Question',
        name: 'Quelle est la qualité et la fraîcheur des données ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Chaque base affiche sa date de dernière mise à jour et, quand c’est disponible, le nombre de contacts renseignés (email, téléphone, LinkedIn…). L’achat Google Sheets livre le snapshot à cette date. Pour lancer un script à la demande, les scripts sont sur Datareacher.'
        }
      },
      {
        '@type': 'Question',
        name: 'Où trouver les scripts de scraping ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cette page vend uniquement des bases Google Sheets. Les scripts de scraping sont sur Datareacher (datareacher.fr).'
        }
      },
      {
        '@type': 'Question',
        name: 'Puis-je avoir une base de données sur-mesure adaptée à mon secteur ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Oui. Une base spécifique peut être cadrée puis livrée en Google Sheets, CSV ou Excel selon les données et le format attendus.'
        }
      }
    ]
  }

  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.outils.title,
    description: siteConfig.seo.pages.outils.description,
    path: '/marketplace',
    keywords: siteConfig.seo.pages.outils.keywords
  })

  const getPriceValidUntil = () => {
    const date = new Date()
    date.setFullYear(date.getFullYear() + 1)
    return date.toISOString().split('T')[0]
  }

  // Note moyenne réelle (1 décimale) — Number() pour éviter la concat string ("5"+"5"=55)
  const avgRating =
    marketplaceReviews.length > 0
      ? String(averageStarRating(marketplaceReviews.map((r) => r.rating)))
      : null
  const displayStars = (n) => {
    const filled = Math.min(5, Math.max(0, Math.round(n)))
    return '★'.repeat(filled) + '☆'.repeat(5 - filled)
  }

  return (
    <>
      <SEOHead {...pageSEO} />
      
      <StructuredData
        type="Product"
        data={{
          name: 'Bases de données B2B',
          description: 'Fichiers B2B en Google Sheets. Achat, puis copie dans votre Drive.',
          url: `${siteConfig.url}/marketplace`,
          brand: { '@type': 'Brand', name: siteConfig.author, url: siteConfig.url },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            priceValidUntil: getPriceValidUntil()
          },
          ...(marketplaceReviews.length > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: avgRating,
              reviewCount: String(marketplaceReviews.length),
              bestRating: '5',
              worstRating: '1'
            },
            review: marketplaceReviews.map((review) => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: review.authorName },
              reviewRating: {
                '@type': 'Rating',
                ratingValue: String(review.rating),
                bestRating: '5',
                worstRating: '1'
              },
              reviewBody: review.reviewBody,
              ...(review.createdAt && { datePublished: review.createdAt })
            }))
          })
        }}
      />
      <StructuredData type="ItemList" data={toolsStructuredData} />
      <StructuredData type="FAQPage" data={faqData} />
      <main className="min-w-0 mt-6 flex flex-col overflow-x-hidden">
        <header className="mb-8">
          <h1 className="font-semibold text-2xl mb-3 tracking-tighter">
            Bases de données B2B
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 tracking-tight max-w-2xl">
            Choisir une base, payer, copier le Google Sheet. Les scripts sont sur{' '}
            <a
              href={datareacherHref}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              datareacher.fr
            </a>
            .
          </p>
          {marketplaceReviews.length > 0 && (
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-500">
              <a href="#avis" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                {marketplaceReviews.length} avis
              </a>
            </p>
          )}
        </header>

        <section className="mb-8 overflow-x-hidden">
          <div className="mb-6">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setDisplayedCount(8)
              }}
              placeholder="Rechercher une base…"
              aria-label="Rechercher une base de données"
              className="w-full px-0 py-2 text-sm border-0 border-b border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-500 transition-colors"
            />
          </div>

          <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex flex-nowrap gap-x-4 overflow-x-auto pb-1 text-sm scrollbar-hide">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 whitespace-nowrap pb-1 border-b border-dashed ${
                  selectedCategory === null
                    ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                Tous ({(dynamicDatabases || []).length})
              </button>
              {categories.map((category) => {
                const count = (dynamicDatabases || []).filter((tool) => tool.category === category).length
                const active = selectedCategory === category
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`shrink-0 whitespace-nowrap pb-1 border-b border-dashed ${
                      active
                        ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                        : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    {category} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          <div
            id="marketplace-sort"
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
            role="group"
            aria-label="Trier"
          >
            <span className="text-neutral-500 dark:text-neutral-500">Trier</span>
            {SORT_OPTIONS.map(({ value, label }) => {
              const active = sortBy === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSortBy(value)}
                  aria-pressed={active}
                  className={`shrink-0 whitespace-nowrap pb-1 border-b border-dashed ${
                    active
                      ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        {showCatalogSkeleton ? (
          <MarketplaceListsSkeleton />
        ) : (() => {
          const showFeatured = !searchQuery.trim() && selectedCategory === null && selectedPricing === null
          const featured = showFeatured ? pickFeaturedDatabases(dynamicDatabases || []) : []
          const storyTools = featured.filter((tool) =>
            Boolean(toEmbedVideoUrl(tool?.videoUrl || tool?.enrichedData?.videoUrl))
          )
          const storySlugs = new Set(storyTools.map((tool) => tool.slug))
          const enCeMoment = featured.filter((tool) => !storySlugs.has(tool.slug))
          const enCeMomentSlugs = new Set(enCeMoment.map((tool) => tool.slug))
          const rest = showFeatured
            ? filteredTools.filter((tool) => !enCeMomentSlugs.has(tool.slug))
            : filteredTools
          if (filteredTools.length === 0) {
            return (
              <section className="mb-16">
                <div className="py-12">
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    Aucune base ne correspond.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory(null)
                      setSelectedPricing(null)
                      setSortBy('date')
                      setSearchQuery('')
                    }}
                    className="text-sm text-neutral-900 dark:text-neutral-100 underline hover:no-underline"
                  >
                    Réinitialiser
                  </button>
                </div>
              </section>
            )
          }
          return (
            <>
              {storyTools.length > 0 && (
                <MarketplaceStoryBand tools={storyTools} />
              )}
              {enCeMoment.length > 0 && (
                <section className="mb-12">
                  <h2 className="font-semibold text-xl mb-4 tracking-tighter">En ce moment</h2>
                  <div className="flex flex-col">
                    {enCeMoment.map((tool) => (
                      <DatabaseListRow key={tool.slug || tool.name} tool={tool} />
                    ))}
                  </div>
                </section>
              )}
              <section className="mb-16">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  {showFeatured ? 'Toutes' : `${rest.length} base${rest.length > 1 ? 's' : ''}`}
                </p>
                <div className="flex flex-col">
                  {rest.slice(0, displayedCount).map((tool) => (
                    <DatabaseListRow key={tool.slug || tool.name} tool={tool} />
                  ))}
                </div>
                {displayedCount < rest.length && (
                  <div className="mt-8">
                    <button
                      onClick={() =>
                        setDisplayedCount((prev) => Math.min(prev + ITEMS_PER_PAGE, rest.length))
                      }
                      className="text-sm text-neutral-600 dark:text-neutral-400 underline underline-offset-4 hover:no-underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    >
                      Voir plus ({rest.length - displayedCount})
                    </button>
                  </div>
                )}
              </section>
            </>
          )
        })()}

        {/* Avis clients marketplace */}
        {marketplaceReviews.length > 0 && (
          <section id="avis" className="mb-16 scroll-mt-8" aria-label="Avis clients">
            <h2 className="font-semibold text-xl mb-6 tracking-tighter">
              Avis clients
              <span className="ml-2 text-base font-normal text-neutral-500 dark:text-neutral-400">
                ({marketplaceReviews.length})
              </span>
            </h2>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border-t border-neutral-200 dark:border-neutral-800">
              {marketplaceReviews.map((r) => {
                const ProductTag = r.productLink ? Link : 'span'
                const productProps = r.productLink ? { href: r.productLink } : {}
                const dateStr = r.createdAt
                  ? (() => {
                      const d = new Date(r.createdAt)
                      const diff = Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24))
                      if (diff === 0) return "Aujourd'hui"
                      if (diff === 1) return 'Hier'
                      if (diff < 7) return `Il y a ${diff} jours`
                      if (diff < 30) return `Il y a ${Math.floor(diff / 7)} sem.`
                      return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                    })()
                  : null
                return (
                  <blockquote key={r.id} className="py-5">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      « {r.reviewBody} »
                    </p>
                    <footer className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-500">
                      {r.linkedinUrl && !/linkedin\.com\/in\/cycling-corsica/i.test(r.linkedinUrl) ? (
                        <a
                          href={r.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="font-medium text-neutral-900 dark:text-neutral-100 hover:underline"
                        >
                          {r.authorName}
                        </a>
                      ) : (
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {r.authorName}
                        </span>
                      )}
                      <span aria-hidden title={`${r.rating}/5`} className="text-neutral-400">
                        {displayStars(r.rating)}
                      </span>
                      {r.productName && (
                        <ProductTag
                          {...productProps}
                          className={
                            r.productLink
                              ? 'hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors'
                              : ''
                          }
                        >
                          {r.productName}
                        </ProductTag>
                      )}
                      {dateStr && <span>{dateStr}</span>}
                    </footer>
                  </blockquote>
                )
              })}
            </div>
          </section>
        )}

        <section className="mb-16">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Questions fréquentes</h2>
          <FAQ
            items={[
              {
                question: "Comment utiliser concrètement les bases de données ?",
                answer: "1) Ouvrez la fiche de la base, 2) Payez en un clic via Stripe (Google Sheets), 3) Sur la page de confirmation, cliquez sur « Copier sur Google Sheets » pour créer une copie dans votre Drive, 4) Utilisez le Sheet tel quel ou exportez en CSV / Excel vers votre CRM. Aucune compétence technique requise."
              },
              {
                question: "Quelle est la qualité et la fraîcheur des données ?",
                answer: "Chaque base affiche sa date de dernière mise à jour et, quand c’est disponible, le nombre de contacts renseignés (email, téléphone, LinkedIn…). L’achat Google Sheets livre le snapshot à cette date. Pour lancer un script à la demande, les scripts sont sur Datareacher."
              },
              {
                question: "Où trouver les scripts de scraping ?",
                answer: "Cette page vend uniquement des bases Google Sheets. Les scripts de scraping sont sur Datareacher (datareacher.fr)."
              },
              {
                question: "Puis-je avoir une base de données sur-mesure adaptée à mon secteur ?",
                answer: "Oui. Une base spécifique peut être cadrée puis livrée en Google Sheets, CSV ou Excel selon les données et le format attendus."
              }
            ]}
          />
        </section>

        <section className="mb-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center" aria-label="Contact">
          <div className="flex flex-col items-center mb-6">
            <div className="mb-4">
              <LookAtAvatar
                src={siteConfig.profileImage}
                alt="Photo de profil de Corentin Robert"
                size={64}
                objectPosition="center 28%"
                lookBasePath={siteConfig.profileLook?.basePath}
                lookDirections={siteConfig.profileLook?.directions || []}
                lookExt={siteConfig.profileLook?.ext || 'jpg'}
                showRing
              />
            </div>
            
            <h2 className="font-semibold text-xl mb-4 tracking-tighter">Besoin d'une base de données sur-mesure ?</h2>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
            Si vous avez besoin d'une base de données personnalisée pour votre secteur d'activité, je peux créer une base adaptée à vos besoins spécifiques.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={openCalendly}
              className="px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              Discutons de votre projet
            </button>
            <Link 
              href={siteConfig.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Me contacter sur LinkedIn
            </Link>
          </div>
        </section>
    </main>
    </>
  )
}

async function getMarketplaceViewEvents() {
  try {
    const { list } = await import('@vercel/blob')
    const blobs = await list({ prefix: 'marketplace-views-events.json' })
    const blob = blobs.blobs.find((b) => b.pathname === 'marketplace-views-events.json')
    if (blob) {
      const res = await fetch(blob.url, { next: { revalidate: 300 } })
      if (res.ok) {
        const data = await res.json()
        return Array.isArray(data) ? data : []
      }
    }
    return []
  } catch {
    return []
  }
}

// Charger les bases de données dynamiques côté serveur
export async function getServerSideProps({ query }) {
  const tabParam = typeof query?.tab === 'string' ? query.tab : ''
  if (tabParam === 'tools' || tabParam === 'scrapers') {
    return {
      redirect: {
        destination: siteConfig.network.datareacher.href,
        permanent: true,
      },
    }
  }

  const { getDatabasesAsTools } = await import('../lib/marketplace-databases')
  const { getMarketplaceVideoMapping } = await import('../lib/marketplace-videos')
  let dynamicDatabases = []
  
  try {
    dynamicDatabases = await getDatabasesAsTools()
    const [events, videoMapping] = await Promise.all([
      getMarketplaceViewEvents(),
      getMarketplaceVideoMapping(),
    ])
    const viewsMap = {}
    events.forEach((e) => {
      if (e.slug && e.category) {
        const k = `${e.category}/${e.slug}`
        viewsMap[k] = (viewsMap[k] || 0) + 1
      }
    })
    dynamicDatabases = dynamicDatabases.map((db) => ({
      ...db,
      views: viewsMap[`${db.category}/${db.slug}`] || 0,
      videoUrl: videoMapping[db.slug] || null,
    }))
  } catch (error) {
    console.error('❌ Erreur chargement bases de données:', error.message)
  }
  
  let marketplaceReviews = []
  try {
    const { getMarketplaceReviews } = await import('../lib/marketplace-reviews')
    const { categoryToSlug } = await import('../lib/marketplace-helpers')
    const raw = await getMarketplaceReviews()
    marketplaceReviews = raw
      .filter((review) => {
        const author = `${review.authorName || ''} ${review.companyName || ''}`.trim()
        const linkedIn = review.linkedinUrl || ''
        return (
          author &&
          review.reviewBody?.trim() &&
          review.productSlug &&
          /linkedin\.com\/(in|company)\//i.test(linkedIn) &&
          !/corentin\s+robert/i.test(author) &&
          !/linkedin\.com\/in\/(robertcorentin|cycling-corsica)/i.test(linkedIn)
        )
      })
      .map(({ id, authorName, companyName, reviewBody, productName, productSlug, linkedinUrl, createdAt, rating }) => {
      const tool = dynamicDatabases?.find((t) => t.slug === productSlug)
      const productLink = tool ? `/marketplace/${categoryToSlug(tool.category)}/${productSlug}` : null
      const r = parseInt(rating, 10)
      const displayName = [authorName, companyName].filter(Boolean).join(' — ') || authorName || ''
      return {
        id,
        authorName: displayName,
        reviewBody,
        productName: productName || null,
        productLink,
        linkedinUrl: linkedinUrl || null,
        createdAt,
        rating: (r >= 1 && r <= 5) ? r : 5
      }
      })
  } catch (err) {
    console.warn('Erreur chargement avis marketplace:', err?.message)
  }

  return {
    props: {
      dynamicDatabases,
      marketplaceReviews,
    }
  }
}

