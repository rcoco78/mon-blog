import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import SearchBar from '../components/SearchBar'
import SortDropdown from '../components/SortDropdown'
import FAQ from '../components/FAQ'
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
        const ua = a.apifyStats?.users || 0
        const ub = b.apifyStats?.users || 0
        return ub - ua
      }
      if (toolSortBy === 'runs') {
        const ra = a.apifyStats?.runs || 0
        const rb = b.apifyStats?.runs || 0
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
        <section className="mb-8 overflow-x-hidden">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">
            Marketplace
          </h1>
          {/* Badge confiance : note réelle + avis Malt/Fiverr */}
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5" aria-label={`Note ${avgRating} sur 5`}>
              <span className="text-amber-500" aria-hidden>
                {displayStars(parseFloat(avgRating))}
              </span>
              <span>{avgRating}/5</span>
            </span>
            <span className="text-neutral-300 dark:text-neutral-600" aria-hidden>·</span>
            {marketplaceReviews.length > 0 && (
              <>
                <a href="#avis" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors underline hover:no-underline">
                  {marketplaceReviews.length} avis client{marketplaceReviews.length > 1 ? 's' : ''} vérifié{marketplaceReviews.length > 1 ? 's' : ''}
                </a>
                <span className="text-neutral-300 dark:text-neutral-600" aria-hidden>·</span>
              </>
            )}
            <a
              href={siteConfig.social.malt}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              Centaines de missions livrées (Malt & Fiverr)
            </a>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4 tracking-tight">
            Les bases et scrapers que je livre déjà à mes clients — en libre-service.
          </p>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-neutral-600 dark:text-neutral-400">
            <p>
              <strong className="text-neutral-900 dark:text-neutral-100">Bases de données</strong>
              {' — '}fichier Google Sheets prêt pour la prospection / CRM ; livré comme pour mes clients ; mises à jour possibles.
            </p>
            <p>
              <strong className="text-neutral-900 dark:text-neutral-100">Outils Apify</strong>
              {' — '}lance mon scraper, récupère tes données via mon API publique.
            </p>
          </div>
          <div className="mb-8 text-sm text-neutral-600 dark:text-neutral-400">
            <p className="font-medium text-neutral-800 dark:text-neutral-200 mb-2">Comment ça marche</p>
            {activeTab === 'databases' ? (
              <ol className="list-decimal list-inside space-y-1">
                <li>Choisir une base</li>
                <li>Payer</li>
                <li>Recevoir le Google Sheet</li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-1">
                <li>Entrer l&apos;input</li>
                <li>Lancer le scraper</li>
                <li>Débloquer les résultats</li>
              </ol>
            )}
          </div>

          {/* Onglets pour séparer Bases de données et Outils */}
          <div className="mb-8 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('databases')}
                className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'databases'
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <span className="block">
                  Bases de données
                  <span className="ml-2 text-xs text-neutral-400 dark:text-neutral-500">
                    ({dynamicDatabases.length})
                  </span>
                </span>
                <span className="block text-xs font-normal text-neutral-500 dark:text-neutral-500 mt-0.5">
                  Fichier prêt à télécharger
                </span>
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'tools'
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <span className="block">
                  Outils
                  <span className="ml-2 text-xs text-neutral-400 dark:text-neutral-500">
                    ({apifyTools.length})
                  </span>
                </span>
                <span className="block text-xs font-normal text-neutral-500 dark:text-neutral-500 mt-0.5">
                  Lance le scraper toi-même
                </span>
              </button>
            </div>
          </div>

          {/* Barre de recherche texte — desktop uniquement */}
          {activeTab === 'databases' && (
            <div className="hidden sm:block mb-6">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500 pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                >
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setDisplayedCount(8) }}
                  placeholder="Rechercher une base de données…"
                  aria-label="Rechercher une base de données dans la marketplace"
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    aria-label="Effacer la recherche"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filtres - uniquement pour les bases de données */}
          {activeTab === 'databases' && (
          <div className="flex flex-col gap-6 mb-8 min-w-0 overflow-x-hidden">
            {/* Ligne 1 — Prix */}
            <div className="min-w-0 w-full overflow-hidden">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Prix
              </label>
              <SearchBar
                tags={pricingRanges.filter(r => r.value !== undefined && r.value !== null)}
                selectedTag={selectedPricing}
                onTagSelect={setSelectedPricing}
                allLabel={pricingRanges.find(r => r.value === null || r.value === undefined)?.label ?? 'Tous'}
                allValue={null}
              />
            </div>

            {/* Ligne 2 — Catégorie (scroll horizontal) */}
            <div className="min-w-0 w-full overflow-hidden">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Catégorie
              </label>
              <div className="min-w-0">
              <SearchBar 
                tags={categories}
                selectedTag={selectedCategory}
                onTagSelect={setSelectedCategory}
              />
              </div>
            </div>

            {/* Ligne 3 — Tri */}
            <div>
              <SortDropdown
                id="marketplace-sort"
                label="Trier par"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: 'date', label: 'Plus récents' },
                  { value: 'price_desc', label: 'Prix décroissant' },
                  { value: 'views', label: 'Plus consultés' }
                ]}
              />
            </div>
          </div>
          )}

          {/* Filtres — onglet Outils */}
          {activeTab === 'tools' && (
          <div className="flex flex-col gap-6 mb-8">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Catégorie
              </label>
              <SearchBar
                tags={toolCategories}
                selectedTag={selectedToolCategory}
                onTagSelect={setSelectedToolCategory}
              />
            </div>
            <div>
              <SortDropdown
                id="tool-sort"
                label="Trier par"
                value={toolSortBy}
                onChange={setToolSortBy}
                options={[
                  { value: 'users', label: "Plus d'utilisateurs" },
                  { value: 'runs', label: "Plus d'exécutions" },
                  { value: 'date', label: 'Plus récents' }
                ]}
              />
            </div>
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
            <div className="flex flex-col space-y-4">
              {filteredTools.slice(0, displayedCount).map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.link || '#'}
                  className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0 mb-3">
                    {tool.iconSvg ? (
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                        {tool.iconSvg === 'email' && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                            <path d="M8.47 1.318a1 1 0 0 0-.94 0l-6 3.2A1 1 0 0 0 1 5.4v.817l5.75 3.45L8 8.917l1.25.75L15 6.217V5.4a1 1 0 0 0-.53-.882zM15 7.383l-4.778 2.867L15 13.117zm-.035 6.88L8 10.082l-6.965 4.18A1 1 0 0 0 2 15h12a1 1 0 0 0 .965-.738ZM1 13.116l4.778-2.867L1 7.383v5.734ZM7.059.435a2 2 0 0 1 1.882 0l6 3.2A2 2 0 0 1 16 5.4V14a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5.4a2 2 0 0 1 1.059-1.765z"/>
                          </svg>
                        )}
                        {tool.iconSvg === 'search' && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                          </svg>
                        )}
                        {tool.iconSvg === 'house' && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                            <path d="M8 6.982C9.664 5.309 13.825 8.236 8 12 2.175 8.236 6.336 5.309 8 6.982"/>
                            <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.707L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.646a.5.5 0 0 0 .708-.707L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>
                          </svg>
                        )}
                        {tool.iconSvg === 'grid' && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm15 2h-4v3h4zm0 4h-4v3h4zm0 4h-4v3h3a1 1 0 0 0 1-1zm-5 3v-3H6v3zm-5 0v-3H1v2a1 1 0 0 0 1 1zm-4-4h4V7H1zm0-4h4V3H1a1 1 0 0 0-1 1zm5 0v3h4V3zm4 4H6v3h4z"/>
                          </svg>
                        )}
                      </div>
                    ) : tool.icon && tool.icon.startsWith('/') ? (
                      <div className="flex-shrink-0 w-6 h-6">
                        <Image
                          src={tool.icon}
                          alt={`${tool.name} - ${tool.description}`}
                          width={24}
                          height={24}
                          loading="lazy"
                          className="w-6 h-6 rounded-lg object-contain"
                        />
                      </div>
                    ) : tool.icon ? (
                      <span className="flex-shrink-0 text-2xl">{tool.icon}</span>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                          {tool.name}
                        </h2>
                        {tool.category && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            {tool.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Séparateur fin et prix */}
                  <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center justify-between gap-3">
                      {/* Espaceur pour aligner avec l'icône */}
                      <div className="flex-shrink-0 w-6 h-6"></div>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">
                          {(tool.views ?? 0)} {(tool.views ?? 0) <= 1 ? 'vue' : 'vues'}
                          <span className="mx-1.5">•</span>
                          {tool.isPaid ? `À partir de ${tool.annualPrice || tool.price || 0}€` : 'Gratuit'}
                        </span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-shrink-0">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                      </div>
                      {tool.lastEnriched && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-500 flex-shrink-0">
                          {new Date(tool.lastEnriched).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })} {new Date(tool.lastEnriched).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {!tool.lastEnriched && tool.date && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-500 flex-shrink-0">
                          {new Date(tool.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })} {new Date(tool.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {displayedCount < filteredTools.length && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredTools.length))}
                  className="px-6 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                >
                  Voir plus ({filteredTools.length - displayedCount} restant{filteredTools.length - displayedCount === 1 ? '' : 's'})
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
            <div className="flex flex-col space-y-4">
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
                    className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0 mb-3">
                      {tool.iconSvg === 'search' && (
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                            {tool.name}
                          </h2>
                          {tool.category && (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                              {tool.category}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Séparateur fin et métadonnées */}
                    <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-shrink-0 w-6 h-6"></div>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-xs text-neutral-500 dark:text-neutral-500">
                            {tool.apifyStats?.users || 0} utilisateurs
                          </span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-500">
                            • {tool.apifyStats?.runs || 0} exécutions
                          </span>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-shrink-0">
                            <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            {filteredApifyTools.length > 0 && displayedCount < filteredApifyTools.length && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredApifyTools.length))}
                  className="px-6 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                >
                  Voir plus ({filteredApifyTools.length - displayedCount} restant{filteredApifyTools.length - displayedCount === 1 ? '' : 's'})
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
            <div
              className={`grid gap-4 ${
                marketplaceReviews.length === 1
                  ? 'grid-cols-1 max-w-2xl mx-auto'
                  : marketplaceReviews.length >= 7
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
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
                const initials = (r.authorName || '')
                  .split(/\s+/)
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || '?'
                return (
                  <div
                    key={r.id}
                    className="flex flex-col p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          {/* Liens LinkedIn cassés connus : afficher nom sans lien */}
                          {r.linkedinUrl && !/linkedin\.com\/in\/cycling-corsica/i.test(r.linkedinUrl) ? (
                            <a
                              href={r.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900 dark:text-white hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors group"
                              title="Voir le profil LinkedIn"
                            >
                              {r.authorName}
                              <svg className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-neutral-900 dark:text-white">{r.authorName}</span>
                          )}
                          {r.linkedinUrl && !/linkedin\.com\/in\/cycling-corsica/i.test(r.linkedinUrl) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                              Vérifié
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-amber-500 text-xs" aria-hidden title={`${r.rating}/5`}>
                            {displayStars(r.rating)}
                          </span>
                          {r.productName && (
                            <ProductTag {...productProps} className={`text-xs ${r.productLink ? 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors' : 'text-neutral-500 dark:text-neutral-500'}`}>
                              {r.productName}
                            </ProductTag>
                          )}
                          {dateStr && (
                            <span className="text-xs text-neutral-400 dark:text-neutral-500">
                              {dateStr}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed flex-1">
                      &quot;{r.reviewBody}&quot;
                    </p>
                  </div>
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

