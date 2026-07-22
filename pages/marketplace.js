import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import SearchBar from '../components/SearchBar'
import SortDropdown from '../components/SortDropdown'
import FAQ from '../components/FAQ'
import DatabaseListRow from '../components/marketplace/DatabaseListRow'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import { tools } from '../lib/tools'

export default function Marketplace({ dynamicDatabases = [], apifyTools = [], marketplaceReviews = [] }) {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedPricing, setSelectedPricing] = useState(null) // '<100' | '100-200' | '200+' | 'free' | null
  const [sortBy, setSortBy] = useState('views') // 'date' | 'price_desc' | 'views' — défaut: plus consultés
  const [selectedToolCategory, setSelectedToolCategory] = useState(null)
  const [toolSortBy, setToolSortBy] = useState('users') // 'users' | 'runs' | 'date'
  const [activeTab, setActiveTab] = useState('databases') // 'databases' | 'tools'
  const [searchQuery, setSearchQuery] = useState('')
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [videoSeen, setVideoSeen] = useState(false)
  const [displayedCount, setDisplayedCount] = useState(8)
  const ITEMS_PER_PAGE = 8

  useEffect(() => {
    if (typeof window === 'undefined') return
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (tab === 'tools') setActiveTab('tools')
  }, [])

  // URL de la vidéo Tella
  const videoUrl = 'https://www.tella.tv/video/freelance-en-scrapping-et-automatisation-342e'
  const videoEmbedUrl = 'https://www.tella.tv/video/vid_cmjylsyom00bn04la9dfs342e/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0'

  // Vérifier si la vidéo a déjà été vue
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('profileVideoSeen') === 'true'
      setVideoSeen(seen)
    }
  }, [])

  // Ouvrir la popup vidéo
  const handleVideoClick = () => {
    setShowVideo(true)
  }

  // Marquer la vidéo comme vue quand on ferme la popup (après avoir regardé)
  const handleCloseVideo = () => {
    setShowVideo(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('profileVideoSeen', 'true')
      setVideoSeen(true)
    }
  }

  const pricingRanges = [
    { value: null, label: 'Tous' },
    { value: 'free', label: 'Gratuit' },
    { value: '<100', label: '< 100€', min: 1, max: 99 },
    { value: '100-200', label: '100-200€', min: 100, max: 200 },
    { value: '200+', label: '200€+', min: 201, max: Infinity }
  ]

  // Fusionner les outils statiques et les bases de données dynamiques
  const allTools = [...(dynamicDatabases || []), ...tools]
  
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

  // Catégories des outils (Apify)
  const toolCategories = Array.from(
    new Set(
      (apifyTools || [])
        .map(t => t.category)
        .filter(c => c && c.trim() !== '')
    )
  ).sort()

  // Filtrer et trier les outils
  const filteredApifyTools = (apifyTools || [])
    .filter(tool => selectedToolCategory === null || tool.category === selectedToolCategory)
    .sort((a, b) => {
      if (toolSortBy === 'users') {
        const ua = a.apifyStats?.users ?? a.apifyStats?.totalUsers ?? 0
        const ub = b.apifyStats?.users ?? b.apifyStats?.totalUsers ?? 0
        return ub - ua
      }
      if (toolSortBy === 'runs') {
        const ra = a.apifyStats?.runs ?? a.apifyStats?.totalRuns ?? 0
        const rb = b.apifyStats?.runs ?? b.apifyStats?.totalRuns ?? 0
        return rb - ra
      }
      const getDate = (t) => t.date ? new Date(t.date) : new Date(0)
      return getDate(b) - getDate(a)
    })

  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE)
  }, [selectedCategory, selectedPricing, sortBy, selectedToolCategory, toolSortBy, activeTab])

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

  // Structured Data pour la marketplace
  const toolsStructuredData = {
    name: 'Marketplace - Outils et Bases de Données',
    description: 'Collection d\'outils scraping, automatisation et bases de données pour automatiser vos processus business',
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
          text: 'Chaque base affiche sa date de dernière mise à jour et, quand c’est disponible, le nombre de contacts renseignés (email, téléphone, LinkedIn…). L’achat Google Sheets livre le snapshot à cette date. Pour des données qui évoluent en continu, choisissez l’accès API via Apify.'
        }
      },
      {
        '@type': 'Question',
        name: 'Quelle est la différence entre Google Sheets et l’API Apify ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Google Sheets = achat unique, accès immédiat, snapshot à la date indiquée, export CSV / Excel. API Apify = accès récurrent avec mises à jour automatiques, idéal si vous avez besoin d’un flux à jour en continu plutôt que d’un export ponctuel.'
        }
      },
      {
        '@type': 'Question',
        name: 'Puis-je avoir une base de données sur-mesure adaptée à mon secteur ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolument ! Si vous avez besoin d\'une base de données spécifique pour votre secteur d\'activité, je peux la créer sur-mesure. Le processus : 1) On discute de votre besoin (appel de 20 min gratuit), 2) Je vous propose une solution avec devis et délais, 3) Collecte et structuration des données selon vos critères, 4) Livraison dans le format de votre choix (Google Sheets, CSV, Excel, API). Tarifs : à partir de 2000€ selon la complexité et le volume. Contactez-moi pour discuter de votre projet.'
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

  // Note moyenne réelle (1 décimale) — fallback 5 si aucun avis
  const avgRating = marketplaceReviews.length > 0
    ? (marketplaceReviews.reduce((s, r) => s + (r.rating || 5), 0) / marketplaceReviews.length).toFixed(1)
    : '5'
  const displayStars = (n) => {
    const filled = Math.min(5, Math.max(0, Math.round(n)))
    return '★'.repeat(filled) + '☆'.repeat(5 - filled)
  }

  return (
    <>
      <SEOHead {...pageSEO} />
      
      {/* Product Schema avec aggregateRating — pour afficher ⭐ 5/5 dans Google */}
      <StructuredData
        type="Product"
        data={{
          name: 'Marketplace - Outils et Bases de Données',
          description: 'Marketplace de bases de données pour la prospection et l\'analyse business. Bases de données vérifiées, structurées et régulièrement mises à jour, prêtes à l\'emploi pour enrichir vos CRM et optimiser vos campagnes de prospection.',
          url: `${siteConfig.url}/marketplace`,
          brand: { '@type': 'Brand', name: siteConfig.author, url: siteConfig.url },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            priceValidUntil: getPriceValidUntil()
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: avgRating,
            reviewCount: String(Math.max(1, marketplaceReviews.length)),
            bestRating: '5',
            worstRating: '1'
          },
          review: {
            '@type': 'Review',
            author: { '@type': 'Person', name: siteConfig.author, url: siteConfig.url },
            reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5', worstRating: '1' },
            reviewBody: 'Marketplace de bases de données pour la prospection et l\'analyse business. Bases de données vérifiées, structurées et régulièrement mises à jour, prêtes à l\'emploi pour enrichir vos CRM et optimiser vos campagnes de prospection.',
            datePublished: '2024-01-01'
          }
        }}
      />
      <StructuredData type="ItemList" data={toolsStructuredData} />
      <StructuredData type="FAQPage" data={faqData} />
      <main className="min-w-0 mt-6 flex flex-col overflow-x-hidden">
        <header className="mb-10">
          <h1 className="font-semibold text-2xl mb-3 tracking-tighter">
            Marketplace
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 tracking-tight max-w-2xl mb-2">
            Bases Google Sheets et scrapers Apify — les mêmes livrables que pour mes clients, en libre-service.
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            {activeTab === 'databases'
              ? 'Choisir une base · Payer · Copier le Sheet'
              : 'Entrer l’input · Lancer · Débloquer les résultats'}
            {marketplaceReviews.length > 0 && (
              <>
                <span className="mx-2 text-neutral-300 dark:text-neutral-700">·</span>
                <a href="#avis" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                  {marketplaceReviews.length} avis
                </a>
              </>
            )}
          </p>
        </header>

        <section className="mb-8 overflow-x-hidden">
          {/* Onglets */}
          <div className="mb-8 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('databases')}
                className={`pb-3 text-sm transition-colors border-b-2 ${
                  activeTab === 'databases'
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-medium'
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                Bases
                <span className="ml-1.5 text-neutral-400 dark:text-neutral-500 font-normal">
                  {dynamicDatabases.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`pb-3 text-sm transition-colors border-b-2 ${
                  activeTab === 'tools'
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-medium'
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                Outils
                <span className="ml-1.5 text-neutral-400 dark:text-neutral-500 font-normal">
                  {apifyTools.length}
                </span>
              </button>
            </div>
          </div>

          {activeTab === 'databases' && (
            <div className="hidden sm:block mb-6">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setDisplayedCount(8)
                }}
                placeholder="Rechercher…"
                aria-label="Rechercher une base de données"
                className="w-full px-0 py-2 text-sm border-0 border-b border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-500 transition-colors"
              />
            </div>
          )}

          {activeTab === 'databases' && (
            <div className="flex flex-col gap-5 mb-8 min-w-0 overflow-x-hidden">
              <div className="min-w-0 w-full overflow-hidden">
                <SearchBar
                  tags={pricingRanges.filter((r) => r.value !== undefined && r.value !== null)}
                  selectedTag={selectedPricing}
                  onTagSelect={setSelectedPricing}
                  allLabel={pricingRanges.find((r) => r.value === null || r.value === undefined)?.label ?? 'Tous'}
                  allValue={null}
                />
              </div>
              <div className="min-w-0 w-full overflow-hidden">
                <SearchBar
                  tags={categories}
                  selectedTag={selectedCategory}
                  onTagSelect={setSelectedCategory}
                />
              </div>
              <SortDropdown
                id="marketplace-sort"
                label="Trier"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: 'date', label: 'Plus récents' },
                  { value: 'price_desc', label: 'Prix décroissant' },
                  { value: 'views', label: 'Plus consultés' },
                ]}
              />
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="flex flex-col gap-5 mb-8">
              <SearchBar
                tags={toolCategories}
                selectedTag={selectedToolCategory}
                onTagSelect={setSelectedToolCategory}
              />
              <SortDropdown
                id="tool-sort"
                label="Trier"
                value={toolSortBy}
                onChange={setToolSortBy}
                options={[
                  { value: 'users', label: "Plus d'utilisateurs" },
                  { value: 'runs', label: "Plus d'exécutions" },
                  { value: 'date', label: 'Plus récents' },
                ]}
              />
            </div>
          )}
        </section>

        <section className="mb-16">
          {activeTab === 'databases' ? (
            filteredTools.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Aucun résultat ne correspond à vos filtres.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setSelectedPricing(null)
                  setSortBy('views')
                }}
                className="text-sm text-neutral-900 dark:text-neutral-100 underline hover:no-underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="space-y-4">
            {/* Compteur + Réinitialiser */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {filteredTools.length} base{filteredTools.length > 1 ? 's' : ''} de données
              </p>
              {(selectedCategory !== null || selectedPricing !== null) && (
                <button
                  onClick={() => {
                    setSelectedCategory(null)
                    setSelectedPricing(null)
                  }}
                  className="text-xs text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline hover:no-underline"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
            <div className="flex flex-col">
              {filteredTools.slice(0, displayedCount).map((tool) => (
                <DatabaseListRow key={tool.slug || tool.name} tool={tool} />
              ))}
            </div>
            {displayedCount < filteredTools.length && (
              <div className="mt-8">
                <button
                  onClick={() =>
                    setDisplayedCount((prev) =>
                      Math.min(prev + ITEMS_PER_PAGE, filteredTools.length),
                    )
                  }
                  className="text-sm text-neutral-600 dark:text-neutral-400 underline underline-offset-4 hover:no-underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                >
                  Voir plus ({filteredTools.length - displayedCount})
                </button>
              </div>
            )}
            </div>
          )
        ) : (
            /* Section Outils */
            <>
            {/* Compteur + Réinitialiser pour Outils */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {filteredApifyTools.length} outil{filteredApifyTools.length > 1 ? 's' : ''}
              </p>
              {selectedToolCategory !== null && (
                <button
                  onClick={() => setSelectedToolCategory(null)}
                  className="text-xs text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline hover:no-underline"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
            <div className="flex flex-col">
              {filteredApifyTools.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    Aucun outil disponible pour le moment.
                  </p>
                </div>
              ) : (
                filteredApifyTools.slice(0, displayedCount).map((tool) => (
                  <Link
                    key={tool.slug}
                    href={tool.link || '#'}
                    className="group flex items-start justify-between gap-4 py-4 border-b border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-base tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                        {tool.name}
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                        {[
                          tool.category,
                          (tool.apifyStats?.users ?? tool.apifyStats?.totalUsers)
                            ? `${tool.apifyStats.users ?? tool.apifyStats.totalUsers} utilisateurs`
                            : null,
                          (tool.apifyStats?.runs ?? tool.apifyStats?.totalRuns)
                            ? `${tool.apifyStats.runs ?? tool.apifyStats.totalRuns} exécutions`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      {tool.description && (
                        <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                          {tool.description}
                        </p>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-sm text-neutral-400 dark:text-neutral-500 pt-0.5">
                      →
                    </span>
                  </Link>
                ))
              )}
            </div>
            {filteredApifyTools.length > 0 && displayedCount < filteredApifyTools.length && (
              <div className="mt-8">
                <button
                  onClick={() => setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredApifyTools.length))}
                  className="text-sm text-neutral-600 dark:text-neutral-400 underline underline-offset-4 hover:no-underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                >
                  Voir plus ({filteredApifyTools.length - displayedCount})
                </button>
              </div>
            )}
            </>
          )}
        </section>

        {/* Avis clients marketplace */}
        {marketplaceReviews.length > 0 && (
          <section id="avis" className="mb-16 scroll-mt-8" aria-label="Avis clients">
            <h2 className="font-semibold text-xl mb-6 tracking-tighter">
              Avis clients
              <span className="ml-2 text-base font-normal text-neutral-500 dark:text-neutral-400">
                ({marketplaceReviews.length} avis vérifié{marketplaceReviews.length > 1 ? 's' : ''})
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
                answer: "Chaque base affiche sa date de dernière mise à jour et, quand c’est disponible, le nombre de contacts renseignés (email, téléphone, LinkedIn…). L’achat Google Sheets livre le snapshot à cette date. Pour des données qui évoluent en continu, choisissez l’accès API via Apify."
              },
              {
                question: "Quelle est la différence entre Google Sheets et l’API Apify ?",
                answer: "Google Sheets = achat unique, accès immédiat, snapshot à la date indiquée, export CSV / Excel. API Apify = accès récurrent avec mises à jour automatiques, idéal si vous avez besoin d’un flux à jour en continu plutôt que d’un export ponctuel."
              },
              {
                question: "Puis-je avoir une base de données sur-mesure adaptée à mon secteur ?",
                answer: "Absolument ! Si vous avez besoin d'une base de données spécifique pour votre secteur d'activité, je peux la créer sur-mesure. Le processus : 1) On discute de votre besoin (appel de 20 min gratuit), 2) Je vous propose une solution avec devis et délais, 3) Collecte et structuration des données selon vos critères, 4) Livraison dans le format de votre choix (Google Sheets, CSV, Excel, API). Tarifs : à partir de 2000€ selon la complexité et le volume. Contactez-moi pour discuter de votre projet."
              },
              {
                question: "Puis-je intégrer les bases de données avec mes outils existants (CRM, Excel, etc.) ?",
                answer: "Oui, toutes les bases de données sont livrées dans des formats standards (Google Sheets, CSV, Excel) que vous pouvez importer directement dans n'importe quel CRM (HubSpot, Salesforce, Pipedrive), Excel, Google Sheets, ou base de données. Pour des intégrations automatiques (API, webhooks, Zapier), je peux développer une solution sur-mesure qui synchronise automatiquement les données avec vos outils. Exemple : une base de données qui s'alimente automatiquement dans votre CRM toutes les semaines. On discute de votre stack technique et je propose la meilleure solution d'intégration."
              }
            ]}
          />
        </section>

        <section className="mb-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center" aria-label="Contact">
          <div className="flex flex-col items-center mb-6">
            <div 
              className="relative inline-block mb-4 group cursor-pointer p-[2px] rounded-full"
              onClick={handleVideoClick}
            >
              <svg 
                className="absolute inset-0"
                style={{ 
                  width: 'calc(100% + 4px)', 
                  height: 'calc(100% + 4px)',
                  margin: '-2px',
                  transform: 'rotate(-90deg)'
                }}
                viewBox="0 0 70 70"
              >
                <defs>
                  <linearGradient id="instagram-gradient-marketplace" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f09433" />
                    <stop offset="25%" stopColor="#e6683c" />
                    <stop offset="50%" stopColor="#dc2743" />
                    <stop offset="75%" stopColor="#cc2366" />
                    <stop offset="100%" stopColor="#bc1888" />
                  </linearGradient>
                </defs>
                <circle
                  cx="35"
                  cy="35"
                  r="33"
                  fill="none"
                  stroke={videoSeen ? "#a3a3a3" : "url(#instagram-gradient-marketplace)"}
                  strokeWidth="2"
                  strokeDasharray="207.35"
                  strokeDashoffset={videoSeen ? "0" : "207.35"}
                  className={videoSeen ? "" : "animate-draw-circle"}
                  style={{
                    transformOrigin: '35px 35px',
                    transition: videoSeen ? 'stroke 0.5s ease-out' : 'none'
                  }}
                />
              </svg>
              <div className="rounded-full bg-white dark:bg-neutral-900 p-[2px]">
                <Image
                  src={siteConfig.profileImage}
                  alt="Photo de profil de Corentin Robert"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover transition-all group-hover:opacity-90"
                  style={{ objectPosition: 'center 30%' }}
                  priority
                />
              </div>
              {/* Overlay grisé avec icône play au hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/70 dark:bg-neutral-900/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-play text-white" viewBox="0 0 16 16">
                  <path d="M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z"/>
                </svg>
              </div>
            </div>
            
            {/* Popup vidéo */}
            {showVideo && videoEmbedUrl && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-neutral-900/80 dark:bg-neutral-900/80 backdrop-blur-sm"
                onClick={handleCloseVideo}
              >
                <div 
                  className="relative w-full max-w-[280px] md:max-w-sm rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleCloseVideo}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-neutral-900/90 dark:bg-neutral-100/90 text-white dark:text-neutral-900 hover:bg-neutral-900 dark:hover:bg-neutral-100 transition-colors"
                    aria-label="Fermer la vidéo"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                    </svg>
                  </button>
                  <div style={{ position: 'relative', paddingBottom: '177.78%', height: 0 }}>
                    <iframe
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                      src={videoEmbedUrl}
                      allowFullScreen
                      allowTransparency
                      title="Présentation de Corentin Robert"
                    />
                  </div>
                </div>
              </div>
            )}
            
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

        <section className="mb-16">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Pour aller plus loin</h2>
          <div className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <p>
              <Link href="/blog" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Lisez mes articles
              </Link>
              {' • '}
              <Link href="/cas-usage" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Découvrez les cas d'usage
              </Link>
              {' • '}
              <Link href="/a-propos" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Découvrez mon parcours
              </Link>
              {' • '}
              <Link href="/newsletter" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Inscrivez-vous à la newsletter
              </Link>
              {' • '}
              <Link href="/temoignages" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Lisez les témoignages clients
              </Link>
              {' • '}
              <Link href="/objectifs" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Suivez mes objectifs 2026
              </Link>
              {' • '}
              <Link href="/spotify" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Découvrez mes playlists et artistes favoris
              </Link>
              {' • '}
              <Link href="/faq" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Consultez la FAQ
              </Link>
            </p>
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
export async function getServerSideProps() {
  const { getDatabasesAsTools } = await import('../lib/marketplace-databases')
  const { getEnrichedActorsAsTools } = await import('../lib/apify-actors-enriched')
  let dynamicDatabases = []
  let apifyTools = []
  
  try {
    dynamicDatabases = await getDatabasesAsTools()
    const events = await getMarketplaceViewEvents()
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
    }))

    try {
      apifyTools = await getEnrichedActorsAsTools()
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ ${apifyTools.length} outils Apify chargés`)
      }
    } catch (error) {
      console.error('❌ Erreur chargement outils Apify:', error.message)
      apifyTools = []
    }
  } catch (error) {
    console.error('❌ Erreur chargement bases de données:', error.message)
  }
  
  let marketplaceReviews = []
  try {
    const { getMarketplaceReviews } = await import('../lib/marketplace-reviews')
    const { categoryToSlug } = await import('../lib/marketplace-helpers')
    const raw = await getMarketplaceReviews()
    marketplaceReviews = raw.map(({ id, authorName, companyName, reviewBody, productName, productSlug, linkedinUrl, createdAt, rating }) => {
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
      apifyTools,
      marketplaceReviews
    }
  }
}

