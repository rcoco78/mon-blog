import Link from 'next/link'
import SEOHead from '../../components/seo/SEOHead'
import StructuredData from '../../components/seo/StructuredData'
import { generatePageSEO } from '../../lib/seo'
import { siteConfig } from '../../lib/config'
import { caseStudies, getAllSectors, getCaseStudiesBySector } from '../../lib/case-studies'
import { useState, useEffect } from 'react'
import CaseStudyViewCounter from '../../components/CaseStudyViewCounter'

export default function CaseStudiesIndex() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSector, setSelectedSector] = useState(null)
  const [topCaseStudies, setTopCaseStudies] = useState([])
  const [loading, setLoading] = useState(true)

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

  // Grouper par secteur
  const caseStudiesBySector = sectors.reduce((acc, sector) => {
    const studies = getCaseStudiesBySector(sector)
    if (studies.length > 0) {
      acc[sector] = studies
    }
    return acc
  }, {})

  // Charger les top 3 case studies les plus lus
  useEffect(() => {
    const fetchTopCaseStudies = async () => {
      try {
        setLoading(true)
        // Récupérer tous les slugs
        const slugs = caseStudies.map(cs => cs.slug).join(',')
        
        // Récupérer toutes les vues
        const response = await fetch(`/api/case-studies-views/all?slugs=${slugs}`)
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des vues')
        }
        
        const viewsMap = await response.json()
        
        // Ajouter les vues aux case studies et trier
        const caseStudiesWithViews = caseStudies.map(cs => ({
          ...cs,
          views: viewsMap[cs.slug] || 0
        }))
        
        // Trier par nombre de vues (ordre décroissant) et prendre les 3 premiers
        const sorted = caseStudiesWithViews
          .sort((a, b) => b.views - a.views)
          .slice(0, 3)
        
        setTopCaseStudies(sorted)
      } catch (error) {
        console.error('Erreur lors de la récupération des vues:', error)
        // Fallback : afficher les 3 premiers case studies sans les vues
        setTopCaseStudies(caseStudies.slice(0, 3).map(cs => ({ ...cs, views: 0 })))
      } finally {
        setLoading(false)
      }
    }

    fetchTopCaseStudies()
  }, [])

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
              url: `${siteConfig.url}/cas-usage/${cs.slug}`
            }
          }))
        }}
      />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col min-h-screen mt-8 sm:mt-8">
          <div>
            <main className="flex-auto min-w-0 mt-6 flex flex-col">
              {/* Header */}
              <section className="mb-12">
                <h1 className="text-3xl font-bold tracking-tighter mb-4">
                  Cas d'usage scraping et automatisation
                </h1>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
                  Découvrez comment le scraping et l'automatisation peuvent transformer votre business. 
                  Plus de 6 500+ cas d'usage concrets par secteur avec exemples réels et données extractibles.
                </p>

                {/* Search et Filtres */}
                <div className="mb-8 relative z-10">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un cas d'usage..."
                      className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent relative z-10"
                      style={{ pointerEvents: 'auto' }}
                    />
                    
                    {/* Filtre par secteur - Select dropdown */}
                    <select
                      value={selectedSector || ''}
                      onChange={(e) => setSelectedSector(e.target.value || null)}
                      className="px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent cursor-pointer sm:w-auto w-full appearance-none relative z-10"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <option value="">Tous les secteurs</option>
                      {sectors.map(sector => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Top 3 Case Studies */}
              {!selectedSector && !searchQuery && (
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold mb-6 tracking-tighter">
                    Les plus consultés
                  </h2>
                  <div className="space-y-4">
                    {loading ? (
                      // Skeleton pendant le chargement
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 animate-pulse">
                          <div className="h-6 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded mb-2"></div>
                          <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded mb-2"></div>
                          <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                        </div>
                      ))
                    ) : topCaseStudies.length > 0 ? (
                      topCaseStudies.map((cs, index) => (
                        <Link
                          key={cs.slug}
                          href={`/cas-usage/${cs.slug}`}
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
                                <span className="px-2 py-1 rounded text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
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

              {/* Liste des cas d'usage */}
              {selectedSector ? (
                // Affichage par secteur sélectionné
                <section className="mb-16">
                  <h2 className="text-2xl font-semibold mb-6 tracking-tighter">
                    {selectedSector} ({filteredCaseStudies.length} cas d'usage)
                  </h2>
                  <div className="space-y-6">
                    {filteredCaseStudies.map(cs => (
                      <Link
                        key={cs.slug}
                        href={`/cas-usage/${cs.slug}`}
                        className="block p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h3 className="text-xl font-semibold group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                            {cs.title}
                          </h3>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 whitespace-nowrap flex-shrink-0">
                            {cs.sector}
                          </span>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                          {cs.description}
                        </p>
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
                      </Link>
                    ))}
                  </div>
                </section>
              ) : (
                // Affichage groupé par secteur
                <section className="mb-16">
                  {sectors.map(sector => {
                    const studies = getCaseStudiesBySector(sector).filter(cs => {
                      if (!searchQuery) return true
                      return cs.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        cs.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        cs.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
                    })

                    if (studies.length === 0) return null

                    return (
                      <div key={sector} className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-2xl font-semibold tracking-tighter">
                            {sector}
                          </h2>
                          <span className="text-sm text-neutral-500 dark:text-neutral-500">
                            {studies.length} cas d'usage
                          </span>
                        </div>
                        <div className="space-y-4">
                          {studies.slice(0, 6).map(cs => (
                            <Link
                              key={cs.slug}
                              href={`/cas-usage/${cs.slug}`}
                              className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                            >
                              <h3 className="text-lg font-semibold mb-2 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                                {cs.title}
                              </h3>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed line-clamp-2">
                                {cs.description}
                              </p>
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
                            </Link>
                          ))}
                        </div>
                        {studies.length > 6 && (
                          <div className="mt-4 text-center">
                            <button
                              onClick={() => setSelectedSector(sector)}
                              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors underline"
                            >
                              Voir tous les {studies.length} cas d'usage en {sector.toLowerCase()} →
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </section>
              )}

              {/* CTA */}
              <section className="mb-16 p-6 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <h2 className="text-xl font-semibold mb-3 tracking-tighter">
                  Besoin d'un cas d'usage spécifique ?
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                  Si votre secteur ou votre besoin n'est pas couvert, je peux développer une solution sur-mesure. 
                  Discutons de votre projet lors d'un appel de 20 minutes.
                </p>
                <a
                  href="https://calendly.com/corentinrobert/20min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors text-sm font-medium"
                >
                  Réserver un appel gratuit
                </a>
              </section>
            </main>
          </div>
        </div>
      </div>
    </>
  )
}

