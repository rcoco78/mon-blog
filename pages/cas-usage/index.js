import Link from 'next/link'
import SEOHead from '../../components/seo/SEOHead'
import StructuredData from '../../components/seo/StructuredData'
import { generatePageSEO } from '../../lib/seo'
import { siteConfig } from '../../lib/config'
import { caseStudies, getAllSectors, getCaseStudiesBySector } from '../../lib/case-studies'
import { useState } from 'react'

export default function CaseStudiesIndex() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSector, setSelectedSector] = useState(null)

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

  const pageSEO = generatePageSEO({
    title: 'Cas d\'usage scraping et automatisation par secteur | Corentin Robert',
    description: `Découvrez comment le scraping et l'automatisation peuvent transformer votre business. ${caseStudies.length.toLocaleString('fr-FR')}+ cas d'usage concrets par secteur : immobilier, santé, artisanat, e-commerce, finance, restauration...`,
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
                  Plus de {caseStudies.length.toLocaleString('fr-FR')} cas d'usage concrets par secteur avec exemples réels et données extractibles.
                </p>

                {/* Search et Filtres */}
                <div className="mb-8">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un cas d'usage..."
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent mb-4"
                  />
                  
                  {/* Filtres par secteur */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedSector(null)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSector === null
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                          : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      Tous les secteurs
                    </button>
                    {sectors.map(sector => (
                      <button
                        key={sector}
                        onClick={() => setSelectedSector(sector)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedSector === sector
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {sector}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {studies.slice(0, 10).map(cs => (
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
                        {studies.length > 10 && (
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

