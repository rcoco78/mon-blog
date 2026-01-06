import Link from 'next/link'
import { useState } from 'react'
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

export default function CategoryMarketplace({ category, categoryDatabases, topDatabases: initialTopDatabases = [] }) {
  const [topDatabases] = useState(initialTopDatabases || [])

  // Vérification de sécurité
  const safeCategoryDatabases = Array.isArray(categoryDatabases) ? categoryDatabases : []
  const safeTopDatabases = Array.isArray(topDatabases) ? topDatabases : []

  // Exclure les top databases de la liste principale pour éviter les doublons
  const topSlugs = new Set(safeTopDatabases.map(db => db.slug))
  const regularDatabases = safeCategoryDatabases.filter(db => !topSlugs.has(db.slug))

  // Trier par date (plus récent en premier)
  const sortedDatabases = regularDatabases.sort((a, b) => {
    const dateA = a.lastEnriched ? new Date(a.lastEnriched) : (a.date ? new Date(a.date) : new Date(0))
    const dateB = b.lastEnriched ? new Date(b.lastEnriched) : (b.date ? new Date(b.date) : new Date(0))
    return dateB - dateA
  })

  const categorySlug = categoryToSlug(category)

  const pageSEO = generatePageSEO({
    title: `Bases de données ${category} | Marketplace`,
    description: `Découvrez toutes les bases de données ${category.toLowerCase()} disponibles. ${safeCategoryDatabases.length} bases de données prêtes à l'emploi pour votre prospection et votre analyse.`,
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
            <strong className="text-neutral-900 dark:text-neutral-100">{safeCategoryDatabases.length} bases de données</strong> disponibles pour le secteur <strong className="text-neutral-900 dark:text-neutral-100">{category.toLowerCase()}</strong>.
          </p>
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
        {sortedDatabases.length > 0 && (
          <section className="mb-16">
            <h2 className="font-semibold text-xl mb-6 tracking-tighter">
              Toutes les bases de données {category}
            </h2>
            <div className="space-y-4">
              {sortedDatabases.map((db) => (
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
          </section>
        )}

        {/* Message si aucune base de données */}
        {sortedDatabases.length === 0 && (
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
    // S'assurer que link est toujours défini (string ou null, jamais undefined)
    const link = tool?.link || (db.slug ? `/marketplace/${categorySlug}/${db.slug}` : null)
    return {
      ...db,
      link: link || null, // Forcer null au lieu de undefined pour la sérialisation JSON
      description: tool?.description || db.description || db.shortDescription || ''
    }
  })

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
      categoryDatabases: categoryDatabasesWithLinks.map(db => ({
        ...db,
        link: db.link || null // S'assurer que link n'est jamais undefined dans les props
      })),
      topDatabases: topDatabases.map(db => ({
        ...db,
        link: db.link || null // S'assurer que link n'est jamais undefined dans les props
      }))
    },
    revalidate: 3600
  }
}

