import Link from 'next/link'
import SEOHead from '../../components/seo/SEOHead'
import StructuredData from '../../components/seo/StructuredData'
import { generatePageSEO } from '../../lib/seo'
import { siteConfig } from '../../lib/config'
import { caseStudies, getAllSectors, getCaseStudiesBySector } from '../../lib/case-studies'
import { sectorToSlug } from '../../lib/case-studies-helpers'
import { useState, useEffect } from 'react'
import CaseStudyViewCounter from '../../components/CaseStudyViewCounter'
import CustomSelect from '../../components/CustomSelect'
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

export default function CaseStudiesIndex({ topCaseStudies: initialTopCaseStudies, sectorsWithCounts }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSector, setSelectedSector] = useState(null)
  const [topCaseStudies, setTopCaseStudies] = useState(initialTopCaseStudies || [])
  const [loading, setLoading] = useState(false) // Plus besoin de charger initialement
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)

  const openCalendly = () => {
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

  const sectors = getAllSectors()

  // Filtrer les cas d'usage par recherche et secteur
  const filteredCaseStudies = caseStudies.filter(cs => {
    const matchesSearch = !searchQuery || 
      cs.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cs.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cs.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cs.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesSector = !selectedSector || cs.sector === selectedSector
    
    return matchesSearch && matchesSector
  })

  const pageSEO = generatePageSEO({
    title: 'Cas d\'usage scraping et automatisation par secteur | Corentin Robert',
    description: `Découvrez comment le scraping et l'automatisation peuvent transformer votre business. 6 500+ cas d'usage concrets par secteur : immobilier, santé, artisanat, e-commerce, finance, restauration...`,
    path: '/cas-usage',
    keywords: ['cas d\'usage scraping', 'scraping par secteur', 'automatisation business', 'extraction données', 'scraping immobilier', 'scraping santé', 'scraping e-commerce']
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      
      <StructuredData
        type="ItemList"
        data={{
          name: 'Cas d\'usage scraping et automatisation',
          description: 'Collection de cas d\'usage concrets de scraping et automatisation par secteur',
          numberOfItems: caseStudies.length,
          items: caseStudies.map((cs, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Service',
              name: cs.title,
              description: cs.description,
              url: `${siteConfig.url}/cas-usage/${sectorToSlug(cs.sector)}/${cs.slug}`
            }
          }))
        }}
      />

      <main className="min-w-0 mt-6 flex flex-col">
        <section className="mb-8">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">
            Cas d'usage scraping et automatisation
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 tracking-tight">
            Découvrez comment le <strong className="text-neutral-900 dark:text-neutral-100">scraping</strong> et l'<strong className="text-neutral-900 dark:text-neutral-100">automatisation</strong> peuvent transformer votre business. 
            Plus de <strong className="text-neutral-900 dark:text-neutral-100">6 500+ cas d'usage concrets</strong> par <strong className="text-neutral-900 dark:text-neutral-100">secteur</strong> avec exemples réels et données extractibles.
          </p>
        </section>

        {/* Top 3 Case Studies - EN PREMIER pour maximiser l'engagement */}
        {!selectedSector && !searchQuery && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 tracking-tighter">
              Les plus consultés
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
              Les cas d'usage les plus populaires, basés sur les consultations réelles
            </p>
            <div className="space-y-4">
              {topCaseStudies.length > 0 ? (
                topCaseStudies.map((cs, index) => (
                  <Link
                    key={cs.slug}
                    href={`/cas-usage/${sectorToSlug(cs.sector)}/${cs.slug}`}
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
                          <span
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              window.location.href = `/cas-usage/${sectorToSlug(cs.sector)}`
                            }}
                            className="px-2 py-1 rounded text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                          >
                            {cs.sector}
                          </span>
                          <CaseStudyViewCounter slug={cs.slug} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : null}
            </div>
          </section>
        )}

        {/* Liste des secteurs disponibles - Navigation rapide */}
        {!selectedSector && !searchQuery && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 tracking-tighter">
              Par secteur
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-6">
              Explorez les cas d'usage par secteur d'activité
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sectorsWithCounts
                .filter(item => item.count >= 3) // Afficher uniquement les secteurs avec au moins 3 cas d'usage
                .map(({ sector, count }) => (
                  <Link
                    key={sector}
                    href={`/cas-usage/${sectorToSlug(sector)}`}
                    className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors group"
                  >
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                      {sector}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">
                      {count} cas d'usage
                    </p>
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* Search et Filtres - Déplacés après les sections principales */}
        {!selectedSector && !searchQuery && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 tracking-tighter">
              Rechercher un cas d'usage
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un cas d'usage..."
                className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent relative z-10"
                style={{ pointerEvents: 'auto' }}
              />
              
              {/* Filtre par secteur - Select dropdown personnalisé */}
              <CustomSelect
                placeholder="Filtrer par secteur"
                value=""
                onChange={(sector) => {
                  if (sector) {
                    window.location.href = `/cas-usage/${sectorToSlug(sector)}`
                  }
                }}
                options={[
                  { value: '', label: 'Tous les secteurs' },
                  ...sectors.map(sector => ({ value: sector, label: sector }))
                ]}
                className="flex-1 w-full"
              />
            </div>
          </section>
        )}

        {/* Liste des cas d'usage par recherche ou filtre */}
        {(selectedSector || searchQuery) && (
          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6 tracking-tighter">
              {selectedSector ? `${selectedSector} (${filteredCaseStudies.length} cas d'usage)` : `Résultats de recherche (${filteredCaseStudies.length} cas d'usage)`}
            </h2>
            <div className="space-y-6">
              {filteredCaseStudies.map(cs => (
                <Link
                  key={cs.slug}
                  href={`/cas-usage/${sectorToSlug(cs.sector)}/${cs.slug}`}
                  className="block p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-xl font-semibold group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                      {cs.title}
                    </h3>
                    <span
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        window.location.href = `/cas-usage/${sectorToSlug(cs.sector)}`
                      }}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 whitespace-nowrap flex-shrink-0 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                      {cs.sector}
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                    {cs.description}
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {cs.examples.slice(0, 4).map(example => (
                        <span
                          key={example}
                          className="px-2 py-1 rounded text-xs bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400"
                        >
                          {example}
                        </span>
                      ))}
                      {cs.examples.length > 4 && (
                        <span className="px-2 py-1 rounded text-xs bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
                          +{cs.examples.length - 4}
                        </span>
                      )}
                    </div>
                    <CaseStudyViewCounter slug={cs.slug} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Liste des cas d'usage groupés par secteur (affichage par défaut) */}
        {!selectedSector && !searchQuery && (
          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6 tracking-tighter">
              Tous les cas d'usage par secteur
            </h2>
            {sectorsWithCounts
              .map(({ sector, count }) => {
                const studies = getCaseStudiesBySector(sector).filter(cs => {
                  if (!searchQuery) return true
                  return cs.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    cs.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    cs.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
                })
                return { sector, studies }
              })
              .filter(({ studies }) => studies.length > 0)
              .map(({ sector, studies }) => (
                <div key={sector} className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <Link
                      href={`/cas-usage/${sectorToSlug(sector)}`}
                      className="text-2xl font-semibold tracking-tighter hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
                    >
                      {sector}
                    </Link>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-500 dark:text-neutral-500">
                        {studies.length} cas d'usage
                      </span>
                      <Link
                        href={`/cas-usage/${sectorToSlug(sector)}`}
                        className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors underline"
                      >
                        Voir tout →
                      </Link>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {studies.slice(0, 6).map(cs => (
                      <Link
                        key={cs.slug}
                        href={`/cas-usage/${sectorToSlug(cs.sector)}/${cs.slug}`}
                        className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                      >
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                          {cs.title}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed line-clamp-2">
                          {cs.description}
                        </p>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex flex-wrap gap-1.5">
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
                          </div>
                          <CaseStudyViewCounter slug={cs.slug} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
          </section>
        )}

        {/* CTA */}
        <section className="mb-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center" aria-label="Contact">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Besoin d'un cas d'usage sur-mesure ?</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Si votre secteur ou votre besoin n'est pas couvert, je peux développer une solution adaptée à vos besoins spécifiques.
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

export async function getStaticProps() {
  // Pré-calculer les top 3 case studies avec leurs vues
  let topCaseStudies = []
  try {
    const events = await getViewEvents()
    const viewsMap = {}
    events.forEach(event => {
      if (event.slug) {
        viewsMap[event.slug] = (viewsMap[event.slug] || 0) + 1
      }
    })

    const caseStudiesWithViews = caseStudies.map(cs => ({
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
    topCaseStudies = caseStudies.slice(0, 3).map(cs => ({ ...cs, views: 0 }))
  }

  // Pré-calculer les secteurs avec leurs comptes (triés par ordre décroissant)
  const sectors = getAllSectors()
  const sectorsWithCounts = sectors
    .map(sector => {
      const studies = getCaseStudiesBySector(sector)
      return {
        sector,
        count: studies.length
      }
    })
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count) // Tri décroissant

  return {
    props: {
      topCaseStudies,
      sectorsWithCounts
    },
    revalidate: 3600 // Revalider toutes les heures
  }
}

