import Link from 'next/link'
import { useState, useEffect } from 'react'
import SEOHead from '../../../components/seo/SEOHead'
import { generatePageSEO } from '../../../lib/seo'
import { getDatabasesByCategory, getDatabasesAsTools } from '../../../lib/marketplace-databases'
import { slugToCategory, categoryToSlug } from '../../../lib/marketplace-helpers'
import { list } from '@vercel/blob'

const VIEWS_EVENTS_FILENAME = 'marketplace-views-events.json'

async function getViewEvents() {
  try {
    const blobs = await list({ prefix: VIEWS_EVENTS_FILENAME })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === VIEWS_EVENTS_FILENAME)

    if (existingBlob) {
      const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const response = await fetch(`${existingBlob.url}?t=${cacheBuster}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          Pragma: 'no-cache',
        },
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

const INITIAL_BATCH = 60
const ITEMS_PER_PAGE = 20

export default function CategoryMarketplace({ category, categoryDatabases, totalCount = 0, topDatabases: initialTopDatabases = [] }) {
  const [topDatabases] = useState(initialTopDatabases || [])
  const [categoryDatabasesList, setCategoryDatabasesList] = useState(categoryDatabases || [])
  const [mounted, setMounted] = useState(false)
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Vérification de sécurité
  const safeTopDatabases = Array.isArray(topDatabases) ? topDatabases : []
  const topSlugs = new Set(safeTopDatabases.map(db => db.slug))

  const baseList = searchQuery ? (searchResults || []) : categoryDatabasesList
  const regularDatabases = Array.isArray(baseList) ? baseList.filter(db => !topSlugs.has(db.slug)) : []
  const sortedDatabases = [...regularDatabases].sort((a, b) => {
    const dateA = a.lastEnriched ? new Date(a.lastEnriched) : (a.date ? new Date(a.date) : new Date(0))
    const dateB = b.lastEnriched ? new Date(b.lastEnriched) : (b.date ? new Date(b.date) : new Date(0))
    return dateB - dateA
  })

  const displayedDatabases = sortedDatabases.slice(0, displayedCount)
  const hasMore = displayedCount < sortedDatabases.length
  const canLoadMore = !searchQuery && categoryDatabasesList.length < totalCount
  const categorySlug = categoryToSlug(category)

  // Recherche : fetch API avec debounce
  useEffect(() => {
    if (!searchQuery.trim() || !mounted) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/marketplace/category/${categorySlug}?search=${encodeURIComponent(searchQuery)}&limit=200`)
        const data = await res.json()
        setSearchResults(data.items || [])
        setDisplayedCount(ITEMS_PER_PAGE)
      } catch (err) {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, mounted, categorySlug])

  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE)
  }, [searchQuery])

  // Charger plus : scroll (données locales) ou fetch API
  useEffect(() => {
    if (searchQuery || !mounted) return

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || isLoading) return
        if (displayedCount < sortedDatabases.length) {
          setIsLoading(true)
          setTimeout(() => {
            setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, sortedDatabases.length))
            setIsLoading(false)
          }, 300)
        } else if (canLoadMore && categoryDatabasesList.length < totalCount) {
          setIsLoading(true)
          try {
            const res = await fetch(`/api/marketplace/category/${categorySlug}?offset=${categoryDatabasesList.length}&limit=60`)
            const data = await res.json()
            if (data.items?.length) {
              setCategoryDatabasesList(prev => [...prev, ...data.items])
              setDisplayedCount(prev => prev + data.items.length)
            }
          } catch (err) {
            console.error('Erreur chargement databases:', err)
          } finally {
            setIsLoading(false)
          }
        }
      },
      { threshold: 0.1 }
    )

    const sentinel = document.getElementById('load-more-sentinel')
    if (sentinel) observer.observe(sentinel)
    return () => sentinel && observer.unobserve(sentinel)
  }, [hasMore, canLoadMore, searchQuery, mounted, isLoading, displayedCount, sortedDatabases.length, categoryDatabasesList.length, totalCount, categorySlug])

  const effectiveTotal = searchQuery ? sortedDatabases.length : totalCount

  const pageSEO = generatePageSEO({
    title: `Bases de données ${category} | Marketplace`,
    description: `Découvrez toutes les bases de données ${category.toLowerCase()} disponibles. ${effectiveTotal} bases de données prêtes à l'emploi pour votre prospection et votre analyse.`,
    path: `/marketplace/${categorySlug}`,
    keywords: [`bases de données ${category.toLowerCase()}`, `marketplace ${category.toLowerCase()}`, 'prospection', 'données B2B']
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      
      <main className="min-w-0 mt-6 flex flex-col">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Fil d'Ariane">
          <ol className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li>
              <Link href="/marketplace" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Marketplace
              </Link>
            </li>
            <li className="flex items-center space-x-2">
              <span className="mx-1">/</span>
              <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                {category}
              </span>
            </li>
          </ol>
        </nav>

        <section className="mb-8">
          <div className="mb-4">
            <Link 
              href="/marketplace"
              className="text-sm text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1"
            >
              ← Toutes les bases de données
            </Link>
          </div>
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">
            Bases de données {category}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 tracking-tight">
            <strong className="text-neutral-900 dark:text-neutral-100">{effectiveTotal} bases de données</strong> disponibles pour le secteur <strong className="text-neutral-900 dark:text-neutral-100">{category.toLowerCase()}</strong>.
          </p>
        </section>

        {/* Barre de recherche */}
        <section className="mb-8">
          <label htmlFor="marketplace-search" className="sr-only">
            Rechercher une base de données
          </label>
          <input
            id="marketplace-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Rechercher parmi ${effectiveTotal} bases ${category.toLowerCase()}...`}
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

        {/* Top 3 Databases - Les plus consultées */}
        {safeTopDatabases.length > 0 && (
          <section className="mb-12">
            <h2 className="font-semibold text-xl mb-6 tracking-tighter">
              Les plus consultées
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
              Les bases de données les plus populaires pour {category.toLowerCase()}, basées sur les consultations réelles
            </p>
            <div className="space-y-4">
              {safeTopDatabases.map((db, index) => (
                <Link
                  key={db.slug}
                  href={db.link || `/marketplace/${categorySlug}/${db.slug}`}
                  className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
                          #{index + 1}
                        </span>
                        <h3 className="text-lg font-semibold group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                          {db.name}
                        </h3>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed line-clamp-2">
                        {db.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Séparateur fin et métadonnées */}
                  <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="px-2 py-1 rounded text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {db.category}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">
                          {db.views || 0} {db.views <= 1 ? 'vue' : 'vues'}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">
                          • {db.isPaid ? `${db.price || 0}€` : 'Gratuit'}
                        </span>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-shrink-0">
                        <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Liste des bases de données */}
        {searchLoading ? (
          <section className="mb-16">
            <p className="text-neutral-600 dark:text-neutral-400 animate-pulse">Recherche en cours...</p>
          </section>
        ) : displayedDatabases.length > 0 ? (
          <section className="mb-16">
            <h2 className="font-semibold text-xl mb-6 tracking-tighter">
              {searchQuery ? `Résultats (${sortedDatabases.length})` : `Toutes les bases de données ${category}`}
            </h2>
            <div className="space-y-4">
              {displayedDatabases.map((db) => (
                <Link
                  key={db.slug}
                  href={db.link || `/marketplace/${categorySlug}/${db.slug}`}
                  className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="mb-1">
                        <h2 className="font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                          {db.name}
                        </h2>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {db.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Séparateur fin et prix */}
                  <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">
                          {db.isPaid ? `À partir de ${db.price || 0}€` : 'Gratuit'}
                        </span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-shrink-0">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                      </div>
                      {db.lastEnriched && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-500 flex-shrink-0">
                          {new Date(db.lastEnriched).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })} {new Date(db.lastEnriched).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {!db.lastEnriched && db.date && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-500 flex-shrink-0">
                          {new Date(db.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })} {new Date(db.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Sentinel pour lazy loading */}
            {(hasMore || canLoadMore) && (
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
            
            {(hasMore || canLoadMore) && (
              <div className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-500">
                {displayedCount} sur {searchQuery ? sortedDatabases.length : totalCount} bases affichées
              </div>
            )}
          </section>
        ) : searchQuery ? (
          <section className="mb-16">
            <div className="text-center py-12">
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Aucune base trouvée pour &quot;{searchQuery}&quot;
              </p>
              <button onClick={() => setSearchQuery('')} className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors underline">
                Réinitialiser la recherche
              </button>
            </div>
          </section>
        ) : (
          <section className="mb-16">
            <div className="text-center py-12">
              <p className="text-neutral-600 dark:text-neutral-400">
                Aucune base de données disponible pour cette catégorie.
              </p>
            </div>
          </section>
        )}
      </main>
    </>
  )
}

export async function getStaticPaths() {
  const { getAllDatabases } = await import('../../../lib/marketplace-databases')
  const { categoryToSlug } = await import('../../../lib/marketplace-helpers')
  
  const databases = await getAllDatabases()
  
  // Extraire les catégories uniques
  const categories = Array.from(new Set(databases.map(db => db.category).filter(Boolean)))
  
  const paths = categories.map(category => ({
    params: { category: categoryToSlug(category) }
  }))

  return {
    paths,
    fallback: 'blocking'
  }
}

export async function getStaticProps({ params }) {
  const { slugToCategory } = await import('../../../lib/marketplace-helpers')
  
  const category = slugToCategory(params.category)
  
  if (!category) {
    return {
      notFound: true
    }
  }

  // Charger les bases de données de cette catégorie
  let categoryDatabases = []
  try {
    categoryDatabases = await getDatabasesByCategory(category)
  } catch (error) {
    console.error('Erreur lors du chargement des bases de données:', error)
    categoryDatabases = []
  }

  // Convertir en format tools pour avoir les liens avec catégorie
  const databasesAsTools = await getDatabasesAsTools()
  const { categoryToSlug } = await import('../../../lib/marketplace-helpers')
  const categorySlug = categoryToSlug(category) || 'autres'
  
  const categoryDatabasesWithLinks = categoryDatabases.map(db => {
    const tool = databasesAsTools.find(t => t.slug === db.slug)
    const link = tool?.link || (db.slug ? `/marketplace/${categorySlug}/${db.slug}` : null)
    const desc = tool?.description || db.description || db.shortDescription || ''
    return {
      ...db,
      link: link || null,
      description: desc,
    }
  })

  const totalCount = categoryDatabasesWithLinks.length
  const MAX_DESC_LEN = 120
  const initialBatch = categoryDatabasesWithLinks.slice(0, INITIAL_BATCH).map(db => ({
    slug: db.slug,
    name: db.name,
    description: (db.description || '').slice(0, MAX_DESC_LEN) + (db.description?.length > MAX_DESC_LEN ? '…' : ''),
    category: db.category,
    link: db.link,
    isPaid: db.isPaid,
    price: db.price,
    lastEnriched: db.lastEnriched || null,
    date: db.date || null,
  }))

  // Calculer les top 3 bases de données les plus consultées de cette catégorie
  let topDatabases = []
  let viewsMap = {}
  try {
    const events = await getViewEvents()
    
    // Calculer les vues pour toutes les bases (format: category/slug)
    events.forEach(event => {
      if (event.slug && event.category === category) {
        const key = `${event.category}/${event.slug}`
        viewsMap[key] = (viewsMap[key] || 0) + 1
      }
    })
    
    // Ajouter les vues aux bases de données et trier
    const databasesWithViews = categoryDatabasesWithLinks.map(db => {
      const viewKey = `${category}/${db.slug}`
      return {
        ...db,
        views: viewsMap[viewKey] || 0
      }
    })
    
    // Trier par nombre de vues (ordre décroissant) et prendre les top 3
    const sorted = databasesWithViews
      .sort((a, b) => {
        if (b.views !== a.views) {
          return b.views - a.views
        }
        return (a.name || '').localeCompare(b.name || '')
      })
      .slice(0, 3)

    topDatabases = sorted.map(db => ({
      ...db,
      link: db.link || null // S'assurer que link n'est jamais undefined
    }))
  } catch (error) {
    console.error('Erreur lors du calcul des top databases:', error)
    // Fallback : les 3 premiers sans vues
    topDatabases = categoryDatabasesWithLinks.slice(0, 3).map(db => ({ 
      ...db, 
      views: 0,
      link: db.link || null // S'assurer que link n'est jamais undefined
    }))
  }

  return {
    props: {
      category,
      categoryDatabases: initialBatch,
      totalCount,
      topDatabases: topDatabases.map(db => ({
        ...db,
        link: db.link || null
      }))
    },
    revalidate: 3600
  }
}

