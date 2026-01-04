import Link from 'next/link'
import SEOHead from '../../../components/seo/SEOHead'
import StructuredData from '../../../components/seo/StructuredData'
import { generatePageSEO } from '../../../lib/seo'
import { siteConfig } from '../../../lib/config'
import { caseStudies, getCaseStudiesBySector } from '../../../lib/case-studies'
import { slugToSector, sectorToSlug } from '../../../lib/case-studies-helpers'
import CaseStudyViewCounter from '../../../components/CaseStudyViewCounter'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { list } from '@vercel/blob'

const VIEWS_EVENTS_FILENAME = 'case-studies-views-events.json'

async function getViewEvents() {
  try {
    const blobs = await list({ prefix: VIEWS_EVENTS_FILENAME })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === VIEWS_EVENTS_FILENAME)

    if (existingBlob) {
      const response = await fetch(existingBlob.url, {
        method: 'GET',
        cache: 'no-store',
      })

      if (response.ok) {
        const data = await response.json()
        return Array.isArray(data) ? data : []
      }
    }
    return []
  } catch (error) {
    console.error('Error fetching view events:', error)
    return []
  }
}

export default function SectorCaseStudies({ sector, sectorCaseStudies, topCaseStudies: initialTopCaseStudies, viewsMap = {} }) {
  const router = useRouter()
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [topCaseStudies, setTopCaseStudies] = useState(initialTopCaseStudies || [])
  
  // Lazy loading au scroll
  const ITEMS_PER_PAGE = 20
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Exclure les top case studies de la liste principale pour éviter les doublons
  const topSlugs = new Set(topCaseStudies.map(cs => cs.slug))
  const regularCaseStudies = sectorCaseStudies.filter(cs => !topSlugs.has(cs.slug))
  
  // Filtrer les cas d'usage par recherche
  const filteredCaseStudies = (searchQuery ? sectorCaseStudies : regularCaseStudies).filter(cs => {
    if (!searchQuery) return true
    return cs.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cs.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cs.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cs.examples.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  // Cas d'usage à afficher (avec lazy loading si pas de recherche)
  const displayedCaseStudies = searchQuery 
    ? filteredCaseStudies 
    : filteredCaseStudies.slice(0, displayedCount)
  
  const hasMore = !searchQuery && displayedCount < filteredCaseStudies.length

  // Réinitialiser le compteur quand la recherche change
  useEffect(() => {
    if (searchQuery) {
      setDisplayedCount(ITEMS_PER_PAGE)
    }
  }, [searchQuery])

  // Intersection Observer pour charger plus au scroll
  useEffect(() => {
    if (searchQuery || !hasMore || !mounted) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setIsLoading(true)
          // Simuler un petit délai pour une meilleure UX
          setTimeout(() => {
            setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredCaseStudies.length))
            setIsLoading(false)
          }, 300)
        }
      },
      { threshold: 0.1 }
    )

    const sentinel = document.getElementById('load-more-sentinel')
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel)
      }
    }
  }, [hasMore, searchQuery, mounted, isLoading, filteredCaseStudies.length])

  if (router.isFallback) {
    return (
      <main className="min-w-0 mt-6 flex flex-col">
        {/* Skeleton Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center flex-wrap gap-x-1.5 sm:gap-x-2 gap-y-1">
            <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
            <div className="h-4 w-1 bg-neutral-300 dark:bg-neutral-700"></div>
            <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
            <div className="h-4 w-1 bg-neutral-300 dark:bg-neutral-700"></div>
            <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
          </div>
        </nav>

        {/* Skeleton Header */}
        <section className="mb-8">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-4"></div>
          <div className="h-5 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-2"></div>
          <div className="h-5 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-8"></div>
        </section>

        {/* Skeleton Top Case Studies */}
        <section className="mb-12">
          <div className="h-7 w-48 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                <div className="h-6 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Skeleton Search */}
        <section className="mb-12">
          <div className="h-7 w-48 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-4"></div>
          <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
        </section>

        {/* Skeleton Case Studies List */}
        <section className="mb-16">
          <div className="h-7 w-64 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                <div className="h-6 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-3"></div>
                <div className="flex items-center gap-4">
                  <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    )
  }

  const openCalendly = () => {
    if (!mounted) return
    // Charger Calendly seulement au premier clic (lazy load)
    if (!calendlyLoaded) {
      if (!document.querySelector('link[href*="calendly.com"]')) {
        const link = document.createElement('link')
        link.href = 'https://assets.calendly.com/assets/external/widget.css'
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }

      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.type = 'text/javascript'
      script.async = true
      script.onload = () => {
        setCalendlyLoaded(true)
        if (window.Calendly) {
          window.Calendly.initPopupWidget({
            url: 'https://calendly.com/corentinrobert/20min'
          })
        }
      }
      document.body.appendChild(script)
    } else {
      if (window.Calendly) {
        window.Calendly.initPopupWidget({
          url: 'https://calendly.com/corentinrobert/20min'
        })
      }
    }
  }


  const pageSEO = generatePageSEO({
    title: `Cas d'usage scraping ${sector} | Corentin Robert`,
    description: `Découvrez tous les cas d'usage de scraping et automatisation pour le secteur ${sector.toLowerCase()}. ${sectorCaseStudies.length} cas d'usage concrets avec exemples réels et données extractibles.`,
    path: `/cas-usage/${sectorToSlug(sector)}`,
    keywords: [`scraping ${sector.toLowerCase()}`, `automatisation ${sector.toLowerCase()}`, `extraction données ${sector.toLowerCase()}`, 'cas d\'usage scraping']
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      
      <main className="min-w-0 mt-6 flex flex-col">
        <section className="mb-8">
          <div className="mb-4">
            <Link 
              href="/cas-usage"
              className="text-sm text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1"
            >
              ← Tous les cas d'usage
            </Link>
          </div>
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">
            Cas d'usage {sector}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 tracking-tight">
            <strong className="text-neutral-900 dark:text-neutral-100">{sectorCaseStudies.length} cas d'usage concrets</strong> de <strong className="text-neutral-900 dark:text-neutral-100">scraping</strong> et <strong className="text-neutral-900 dark:text-neutral-100">automatisation</strong> pour le secteur <strong className="text-neutral-900 dark:text-neutral-100">{sector.toLowerCase()}</strong>.
          </p>
        </section>

        {/* Top 3 Case Studies - Les plus consultés */}
        {!searchQuery && topCaseStudies.length > 0 && (
          <section className="mb-12">
            <h2 className="font-semibold text-xl mb-6 tracking-tighter">
              Les plus consultés
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
              Les cas d'usage les plus populaires pour {sector.toLowerCase()}, basés sur les consultations réelles
            </p>
            <div className="space-y-4">
              {topCaseStudies.map((cs, index) => (
                <Link
                  key={cs.slug}
                  href={`/cas-usage/${sectorToSlug(sector)}/${cs.slug}`}
                  className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
                          #{index + 1}
                        </span>
                        <h3 className="text-lg font-semibold group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                          {cs.title}
                        </h3>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed line-clamp-2">
                        {cs.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="flex flex-wrap gap-1.5">
                          {cs.examples.slice(0, 3).map(example => (
                            <span
                              key={example}
                              className="px-2 py-0.5 rounded text-xs bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400"
                            >
                              {example}
                            </span>
                          ))}
                          {cs.examples.length > 3 && (
                            <span className="px-2 py-0.5 rounded text-xs bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
                              +{cs.examples.length - 3}
                            </span>
                          )}
                        </span>
                        <CaseStudyViewCounter slug={cs.slug} views={viewsMap[cs.slug]} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recherche */}
        <section className="mb-12">
          <h2 className="font-semibold text-xl mb-4 tracking-tighter">
            {searchQuery ? `Résultats (${filteredCaseStudies.length} cas d'usage)` : "Rechercher un cas d'usage"}
          </h2>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Rechercher parmi ${sectorCaseStudies.length} cas d'usage ${sector.toLowerCase()}...`}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent"
          />
          
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors underline"
            >
              Réinitialiser la recherche
            </button>
          )}
        </section>

        {/* Liste complète des case studies avec lazy loading */}
        <section className="mb-16">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">
            {searchQuery ? `Résultats (${filteredCaseStudies.length} cas d'usage)` : `Tous les cas d'usage ${sector.toLowerCase()} (${sectorCaseStudies.length})`}
          </h2>
          {displayedCaseStudies.length > 0 ? (
            <>
              <div className="space-y-4">
                {displayedCaseStudies.map(cs => (
                  <Link
                    key={cs.slug}
                    href={`/cas-usage/${sectorToSlug(sector)}/${cs.slug}`}
                    className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                  >
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                      {cs.title}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed line-clamp-2">
                      {cs.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="flex flex-wrap gap-1.5">
                        {cs.examples.slice(0, 3).map(example => (
                          <span
                            key={example}
                            className="px-2 py-0.5 rounded text-xs bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400"
                          >
                            {example}
                          </span>
                        ))}
                        {cs.examples.length > 3 && (
                          <span className="px-2 py-0.5 rounded text-xs bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
                            +{cs.examples.length - 3}
                          </span>
                        )}
                      </span>
                      <CaseStudyViewCounter slug={cs.slug} views={viewsMap[cs.slug]} />
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Sentinel pour le lazy loading */}
              {hasMore && (
                <div id="load-more-sentinel" className="py-8">
                  {isLoading && (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 animate-pulse">
                          <div className="h-6 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded mb-2"></div>
                          <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded mb-3"></div>
                          <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Indicateur de progression */}
              {!searchQuery && (
                <div className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-500">
                  {displayedCount} sur {filteredCaseStudies.length} cas d'usage affichés
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Aucun cas d'usage trouvé pour "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors underline"
              >
                Réinitialiser la recherche
              </button>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="mb-16 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center" aria-label="Contact">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Besoin d'un cas d'usage sur-mesure pour {sector.toLowerCase()} ?</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
            Si votre besoin spécifique n'est pas couvert par ces cas d'usage, je peux développer une solution sur-mesure adaptée à votre secteur. Discutons de votre projet lors d'un appel de 20 minutes gratuit.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={openCalendly}
              disabled={!mounted}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Réserver un créneau Calendly"
            >
              Réserver un créneau
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
              </svg>
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

export async function getStaticPaths() {
  const { getAllSectors } = await import('../../../lib/case-studies')
  const { sectorToSlug } = await import('../../../lib/case-studies-helpers')
  
  const sectors = getAllSectors()
  const paths = sectors.map(sector => ({
    params: { sector: sectorToSlug(sector) }
  }))

  return {
    paths,
    fallback: true // Affiche le skeleton pendant la génération
  }
}

export async function getStaticProps({ params }) {
  const { getCaseStudiesBySector } = await import('../../../lib/case-studies')
  const { slugToSector } = await import('../../../lib/case-studies-helpers')
  
  const sector = slugToSector(params.sector)
  
  if (!sector) {
    return {
      notFound: true
    }
  }

  const sectorCaseStudies = getCaseStudiesBySector(sector)

  // Pré-calculer toutes les vues pour ce secteur
  let viewsMap = {}
  let topCaseStudies = []
  try {
    const events = await getViewEvents()
    events.forEach(event => {
      if (event.slug) {
        viewsMap[event.slug] = (viewsMap[event.slug] || 0) + 1
      }
    })

    const caseStudiesWithViews = sectorCaseStudies.map(cs => ({
      ...cs,
      views: viewsMap[cs.slug] || 0
    }))

    const sorted = caseStudiesWithViews
      .sort((a, b) => {
        if (b.views !== a.views) {
          return b.views - a.views
        }
        return a.title.localeCompare(b.title)
      })
      .slice(0, 3)

    topCaseStudies = sorted
  } catch (error) {
    console.error('Error calculating top case studies:', error)
    // Fallback : les 3 premiers sans vues
    topCaseStudies = sectorCaseStudies.slice(0, 3).map(cs => ({ ...cs, views: 0 }))
  }

  return {
    props: {
      sector,
      sectorCaseStudies,
      topCaseStudies,
      viewsMap
    },
    revalidate: 3600
  }
}

