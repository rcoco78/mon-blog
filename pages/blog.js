import Link from 'next/link'
import Image from 'next/image'
import { getAllPosts } from '../lib/notion'
import { list } from '@vercel/blob'
import ViewCounter from '../components/ViewCounter'
import Tag from '../components/Tag'
import { useState, useEffect, useRef } from 'react'
import SearchBar from '../components/SearchBar'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import FAQ from '../components/FAQ'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'

function TagFilter({ tags, selectedTag, onTagSelect }) {
  const [showMore, setShowMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrer les tags en fonction de la recherche
  const filteredTags = tags.filter(tag => 
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Afficher les 5 premiers tags par défaut
  const visibleTags = showMore ? filteredTags : filteredTags.slice(0, 5)
  const hasMoreTags = filteredTags.length > 5

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Tag
          name="Tous"
          isActive={!selectedTag}
          onClick={() => onTagSelect(null)}
        />
        {visibleTags.map(tag => (
          <Tag
            key={tag}
            name={tag}
            isActive={selectedTag === tag}
            onClick={() => onTagSelect(tag)}
          />
        ))}
        {hasMoreTags && !showMore && (
          <button
            onClick={() => setShowMore(true)}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors
              bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 
              hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            Plus
          </button>
        )}
      </div>
      
      {showMore && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Rechercher un tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1 text-sm rounded-md border border-neutral-200 
              dark:border-neutral-800 bg-white dark:bg-neutral-900"
          />
          <div className="flex flex-wrap gap-2">
            {filteredTags.map(tag => (
              <Tag
                key={tag}
                name={tag}
                isActive={selectedTag === tag}
                onClick={() => onTagSelect(tag)}
              />
            ))}
          </div>
          <button
            onClick={() => setShowMore(false)}
            className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Voir moins
          </button>
        </div>
      )}
    </div>
  )
}

export default function Blog({ posts }) {
  const [selectedTag, setSelectedTag] = useState(null)
  const [allTags, setAllTags] = useState([])
  const [filteredPosts, setFilteredPosts] = useState(posts)
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)
  const [topPosts, setTopPosts] = useState([])
  const [topPostsLoading, setTopPostsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [allViews, setAllViews] = useState({})
  const [blogStats, setBlogStats] = useState(null)
  const [blogStatsLoading, setBlogStatsLoading] = useState(true)
  const [showVideo, setShowVideo] = useState(false)
  const [videoSeen, setVideoSeen] = useState(false)
  const [displayedCount, setDisplayedCount] = useState(12)
  const POSTS_PER_PAGE = 12

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

  useEffect(() => {
    // Extraire tous les tags uniques
    const tags = [...new Set(posts.flatMap(post => post.tags))]
    setAllTags(tags)
    // Petit délai pour afficher le skeleton
    const timer = setTimeout(() => {
      if (posts.length > 0) {
        setPostsLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [posts])

  useEffect(() => {
    // Récupérer les articles les plus lus
    const fetchTopPosts = async () => {
      if (!posts || posts.length === 0) {
        setTopPosts([])
        setTopPostsLoading(false)
        return
      }

      try {
        const slugs = posts.map(post => post.slug).join(',')
        const response = await fetch(`/api/views/all?slugs=${slugs}`)
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des vues')
        }
        
        const viewsMap = await response.json()
        setAllViews(viewsMap) // Stocker toutes les vues pour le calcul du total
        
        // Ajouter les vues aux articles et trier
        const postsWithViews = posts.map(post => ({
          ...post,
          views: viewsMap[post.slug] || 0
        }))
        
        // Trier par nombre de vues (ordre décroissant) et prendre les 3 premiers
        const sortedPosts = postsWithViews
          .sort((a, b) => b.views - a.views)
          .slice(0, 3)
        
        setTopPosts(sortedPosts)
        setTopPostsLoading(false)
      } catch (error) {
        console.error('Erreur lors de la récupération des vues:', error)
        setTopPosts([])
        setTopPostsLoading(false)
      }
    }

    fetchTopPosts()
  }, [posts])

  useEffect(() => {
    // Récupérer les statistiques du blog (nombre d'articles et vues avec croissance J-3)
    const fetchBlogStats = async () => {
      try {
        setBlogStatsLoading(true)
        const response = await fetch(`/api/blog-stats?postsCount=${posts.length}`)
        
        if (response.ok) {
          const stats = await response.json()
          setBlogStats(stats)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques du blog:', error)
      } finally {
        setBlogStatsLoading(false)
      }
    }

    if (posts.length > 0) {
      fetchBlogStats()
    }
  }, [posts])

  useEffect(() => {
    // Filtrer les posts en fonction du tag sélectionné et ajouter les vues
    let filtered = posts

    if (selectedTag) {
      filtered = filtered.filter(post => post.tags.includes(selectedTag))
    }

    // Ajouter les vues aux posts filtrés si disponibles
    const filteredWithViews = filtered.map(post => ({
      ...post,
      views: allViews[post.slug] || post.views || 0
    }))

    setFilteredPosts(filteredWithViews)
  }, [selectedTag, posts, allViews])

  useEffect(() => {
    setDisplayedCount(POSTS_PER_PAGE)
  }, [selectedTag])

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


  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.blog.title,
    description: siteConfig.seo.pages.blog.description,
    path: '/blog',
    keywords: siteConfig.seo.pages.blog.keywords
  })

  // Structured Data pour FAQ
  const faqData = {
    questions: [
      {
        '@type': 'Question',
        name: 'Qu\'est-ce que le scraping et comment ça peut aider mon business ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Le scraping (ou web scraping) est une technique qui permet d\'extraire automatiquement des données depuis des sites web. Concrètement, cela vous permet de : collecter des données concurrentielles (prix, produits, avis), générer des leads qualifiés (contacts, profils LinkedIn), automatiser votre veille marché, enrichir vos bases de données existantes. Par exemple, un agent immobilier peut extraire tous les biens disponibles dans une zone, un e-commerçant peut suivre les prix de ses concurrents, un growth marketeux peut construire des listes de prospects ciblés. L\'objectif : transformer des tâches manuelles chronophages en processus automatisés qui tournent 24/7.'
        }
      },
      {
        '@type': 'Question',
        name: 'Quel est le ROI réel de l\'automatisation pour mon entreprise ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'L\'automatisation génère du ROI de plusieurs façons : 1) Gain de temps : libérer 10-20h/semaine de tâches répétitives pour vous concentrer sur la stratégie, 2) Réduction d\'erreurs : éliminer les erreurs humaines dans la saisie ou la collecte de données, 3) Scalabilité : traiter 100x plus de données sans augmenter les coûts, 4) Décisions rapides : avoir des données à jour en temps réel pour prendre des décisions éclairées. Exemple concret : un scraper qui collecte les prix concurrents quotidiennement vous fait gagner 5h/semaine et vous permet d\'ajuster vos prix en temps réel. Sur un an, c\'est 260h économisées + meilleure compétitivité.'
        }
      },
      {
        '@type': 'Question',
        name: 'Pourquoi choisir un freelance plutôt qu\'une agence ou un dev interne ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '3 avantages clés : 1) Rapidité : livraison en moins d\'une semaine vs 1-2 mois pour une agence, 2) Coûts maîtrisés : pas de frais de structure, tarifs transparents, pas de coûts récurrents si vous n\'avez pas besoin de maintenance, 3) Expertise ciblée : 424+ projets en scraping/automatisation vs un dev interne qui doit tout apprendre. Un freelance spécialisé apporte aussi flexibilité : vous payez uniquement pour ce dont vous avez besoin, sans engagement long terme. Parfait pour tester une idée rapidement ou traiter un besoin ponctuel.'
        }
      },
      {
        '@type': 'Question',
        name: 'Est-ce légal de scraper des sites web ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Oui, le scraping est légal dans la plupart des cas, à condition de respecter : 1) Les robots.txt et conditions d\'utilisation du site, 2) Le RGPD si vous collectez des données personnelles, 3) Les bonnes pratiques (ne pas surcharger les serveurs, respecter les limites de taux). Je m\'assure toujours que vos projets respectent la légalité. Pour les données publiques (prix, produits, annonces), c\'est généralement autorisé. Pour les données personnelles (emails, profils privés), il faut un consentement ou une base légale. On en discute ensemble pour garantir la conformité de votre projet.'
        }
      }
    ]
  }

  // Structured Data pour Blog
  const blogStructuredData = {
    name: 'Blog - Corentin Robert',
    description: 'Articles, réflexions et partages sur l\'entrepreneuriat, le scraping, l\'automatisation, le voyage et bien plus.',
    url: `${siteConfig.url}/blog`,
    blogPost: posts.slice(0, 10).map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${siteConfig.url}/blog/${post.slug}`,
      datePublished: post.date
    }))
  }

  return (
    <>
      <SEOHead {...pageSEO} />
      <StructuredData type="Blog" data={blogStructuredData} />
      <StructuredData type="FAQPage" data={faqData} />
      
      {/* Review Schema 5* par défaut */}
      <StructuredData
        type="Review"
        data={{
          itemReviewed: {
            '@type': 'CreativeWork',
            name: 'Blog - Corentin Robert',
            url: `${siteConfig.url}/blog`
          },
          reviewRating: {
            '@type': 'Rating',
            ratingValue: '5',
            bestRating: '5',
            worstRating: '1'
          },
          author: {
            '@type': 'Person',
            name: 'Lecteur satisfait'
          },
          reviewBody: 'Blog expert sur le scraping, l\'automatisation et l\'entrepreneuriat. Articles pratiques, cas d\'usage concrets et retours d\'expérience pour automatiser vos processus business.',
          datePublished: new Date().toISOString().split('T')[0]
        }}
      />
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="mb-6">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">
            Blog
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-0 tracking-tight">
            Réflexions sur le <strong className="text-neutral-900 dark:text-neutral-100">scraping</strong>, l'<strong className="text-neutral-900 dark:text-neutral-100">automatisation</strong> et l'<strong className="text-neutral-900 dark:text-neutral-100">entrepreneuriat</strong>. Cas d'usage business, retours d'expérience et partage de bonnes pratiques pour automatiser vos processus.
          </p>
        </section>

        {topPostsLoading ? (
          <section className="mb-16">
            <h2 className="font-semibold text-xl mb-6 tracking-tighter">Articles les plus lus</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2 animate-pulse">
                  <div className="flex flex-col md:flex-row md:items-center w-full">
                    <div className="flex-shrink-0">
                      <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                    </div>
                    <span className="hidden md:inline-block w-0.5 h-0.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-2 flex-shrink-0"></span>
                    <div className="flex-grow md:max-w-[60%] w-full md:ml-0">
                      <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                    </div>
                    <div className="md:ml-auto flex-shrink-0 mt-1 md:mt-0">
                      <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : topPosts.length > 0 && (
          <section className="mb-16">
            <h2 className="font-semibold text-xl mb-6 tracking-tighter">Articles les plus lus</h2>
            <div className="space-y-4">
              {topPosts.map((post) => {
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="post-link group">
                    <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2 transition-all group-hover:translate-x-1">
                      <div className="flex flex-col md:flex-row md:items-center w-full">
                        <div className="flex-shrink-0">
                          <p className="post-date text-sm whitespace-nowrap">{(() => {
                            const date = new Date(post.date)
                            const day = String(date.getDate()).padStart(2, '0')
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const year = date.getFullYear()
                            return `${day}-${month}-${year}`
                          })()}</p>
                        </div>
                        <span className="hidden md:inline-block w-0.5 h-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500 mx-2 flex-shrink-0"></span>
                        <p className="post-title flex-grow w-full md:ml-0 flex items-center gap-2 min-w-0">
                          <span className="truncate">{post.title}</span>
                        </p>
                        <div className="md:ml-auto flex-shrink-0 mt-1 md:mt-0">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
                            {post.views} vues
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-xl tracking-tighter">Tous les articles</h2>
              <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="whitespace-nowrap">{filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}</span>
                <span className="w-0.5 h-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500 flex-shrink-0 hidden sm:inline" aria-hidden></span>
                <span className="whitespace-nowrap">
                  {(() => {
                    const totalViews = Object.keys(allViews).length > 0 
                      ? filteredPosts.reduce((sum, post) => sum + (allViews[post.slug] || 0), 0)
                      : filteredPosts.reduce((sum, post) => sum + (post.views || 0), 0)
                    return `${totalViews} ${totalViews === 1 ? 'vue' : 'vues'}`
                  })()}
                </span>
                {blogStatsLoading && (
                  <>
                    <span className="w-0.5 h-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500 flex-shrink-0 hidden sm:inline" aria-hidden></span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse whitespace-nowrap">
                      <span className="w-10 h-4 rounded bg-neutral-200 dark:bg-neutral-700"></span>
                    </span>
                  </>
                )}
                {blogStats && !blogStatsLoading && blogStats.viewsDifference !== 0 && (
                  <>
                    <span className="w-0.5 h-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500 flex-shrink-0 hidden sm:inline" aria-hidden></span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ${
                      blogStats.viewsIsPositive 
                        ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                        : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                    }`} title="Différence vs il y a 3 jours">
                      {blogStats.viewsIsPositive ? (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                          <path d="M6 2L2 6H5V10H7V6H10L6 2Z" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                          <path d="M6 10L10 6H7V2H5V6H2L6 10Z" fill="currentColor" />
                        </svg>
                      )}
                      <span>{blogStats.viewsIsPositive ? '+' : ''}{blogStats.viewsDifference} vs J-3</span>
                    </span>
                  </>
                )}
              </span>
            </div>
            {selectedTag && filteredPosts.length > 0 && (
              <span className="text-sm text-neutral-500 dark:text-neutral-500">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'article trouvé' : 'articles trouvés'}
              </span>
            )}
          </div>
          <div className="mb-6">
            <SearchBar 
              tags={allTags}
              selectedTag={selectedTag}
              onTagSelect={setSelectedTag}
            />
          </div>
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2 animate-pulse">
                  <div className="flex flex-col md:flex-row md:items-center w-full">
                    <div className="flex-shrink-0">
                      <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                    </div>
                    <span className="hidden md:inline-block w-0.5 h-0.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-2 flex-shrink-0"></span>
                    <div className="flex-grow md:max-w-[60%] w-full md:ml-0">
                      <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                    </div>
                    <div className="md:ml-auto flex-shrink-0 mt-1 md:mt-0">
                      <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts && filteredPosts.length > 0 ? (
            <>
              <div className="space-y-4">
                {filteredPosts.slice(0, displayedCount).map((post) => {
                  return (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="post-link group">
                      <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2 transition-all group-hover:translate-x-1">
                      <div className="flex flex-col md:flex-row md:items-center w-full">
                        <div className="flex-shrink-0">
                          <p className="post-date text-sm whitespace-nowrap">{(() => {
                            const date = new Date(post.date)
                            const day = String(date.getDate()).padStart(2, '0')
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const year = date.getFullYear()
                            return `${day}-${month}-${year}`
                          })()}</p>
                        </div>
                          <span className="hidden md:inline-block w-0.5 h-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500 mx-2 flex-shrink-0"></span>
                          <p className="post-title flex-grow w-full md:ml-0 flex items-center gap-2 min-w-0">
                            <span className="truncate">{post.title}</span>
                          </p>
                        <div className="md:ml-auto flex-shrink-0 mt-1 md:mt-0">
                          <ViewCounter slug={post.slug} />
                        </div>
                      </div>
                    </div>
                  </Link>
                  )
                })}
              </div>
              {displayedCount < filteredPosts.length && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setDisplayedCount(prev => Math.min(prev + POSTS_PER_PAGE, filteredPosts.length))}
                    className="px-6 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                  >
                    Voir plus d&apos;articles ({filteredPosts.length - displayedCount} restant{filteredPosts.length - displayedCount > 1 ? 's' : ''})
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                {selectedTag ? (
                  <>
                    Aucun article ne correspond à ce tag.
                    <br />
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="mt-4 text-sm underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    >
                      Réinitialiser le filtre
                    </button>
                  </>
                ) : (
                  'Aucun article disponible pour le moment.'
                )}
              </p>
            </div>
          )}
        </section>

        <section className="mb-16">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Questions fréquentes</h2>
          <FAQ
            items={[
              {
                question: "Qu'est-ce que le scraping et comment ça peut aider mon business ?",
                answer: "Le scraping (ou web scraping) est une technique qui permet d'extraire automatiquement des données depuis des sites web. Concrètement, cela vous permet de : collecter des données concurrentielles (prix, produits, avis), générer des leads qualifiés (contacts, profils LinkedIn), automatiser votre veille marché, enrichir vos bases de données existantes. Par exemple, un agent immobilier peut extraire tous les biens disponibles dans une zone, un e-commerçant peut suivre les prix de ses concurrents, un growth marketeux peut construire des listes de prospects ciblés. L'objectif : transformer des tâches manuelles chronophages en processus automatisés qui tournent 24/7."
              },
              {
                question: "Quel est le ROI réel de l'automatisation pour mon entreprise ?",
                answer: "L'automatisation génère du ROI de plusieurs façons : 1) Gain de temps : libérer 10-20h/semaine de tâches répétitives pour vous concentrer sur la stratégie, 2) Réduction d'erreurs : éliminer les erreurs humaines dans la saisie ou la collecte de données, 3) Scalabilité : traiter 100x plus de données sans augmenter les coûts, 4) Décisions rapides : avoir des données à jour en temps réel pour prendre des décisions éclairées. Exemple concret : un scraper qui collecte les prix concurrents quotidiennement vous fait gagner 5h/semaine et vous permet d'ajuster vos prix en temps réel. Sur un an, c'est 260h économisées + meilleure compétitivité."
              },
              {
                question: "Pourquoi choisir un freelance plutôt qu'une agence ou un dev interne ?",
                answer: "3 avantages clés : 1) Rapidité : livraison en moins d'une semaine vs 1-2 mois pour une agence, 2) Coûts maîtrisés : pas de frais de structure, tarifs transparents, pas de coûts récurrents si vous n'avez pas besoin de maintenance, 3) Expertise ciblée : 424+ projets en scraping/automatisation vs un dev interne qui doit tout apprendre. Un freelance spécialisé apporte aussi flexibilité : vous payez uniquement pour ce dont vous avez besoin, sans engagement long terme. Parfait pour tester une idée rapidement ou traiter un besoin ponctuel."
              },
              {
                question: "Pourquoi ce blog ?",
                answer: "Ce blog est né d'une volonté de partager mes réflexions sur le scraping, l'automatisation et l'entrepreneuriat. Pas seulement des tutoriels techniques, mais aussi des cas d'usage business, des réflexions sur le métier de freelance, et des retours d'expérience sur mes projets. Vous y trouverez des articles variés : scraping, automatisation, entrepreneuriat, voyage, et bien d'autres sujets qui me passionnent. L'objectif : créer du lien, partager mes apprentissages, et révéler ma personnalité au-delà du simple prestataire."
              }
            ]}
          />
        </section>

        <section className="mb-12 md:mb-16 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center" aria-label="Contact">
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
                  <linearGradient id="instagram-gradient-blog" x1="0%" y1="0%" x2="100%" y2="100%">
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
                  stroke={videoSeen ? "#a3a3a3" : "url(#instagram-gradient-blog)"}
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
                  src="/images/profile-picture/cr-pp3.png"
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
            
            <h2 className="font-semibold text-xl mb-4 tracking-tighter">Une question après lecture ?</h2>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
            Discutons de votre projet de scraping ou d'automatisation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={openCalendly}
              className="px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              Discutons-en
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
              <Link href="/a-propos" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Découvrez mon parcours
              </Link>
              {' • '}
              <Link href="/newsletter" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Inscrivez-vous à la newsletter
              </Link>
              {' • '}
              <Link href="/marketplace" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Découvrez la marketplace
              </Link>
              {' • '}
              <Link href="/cas-usage" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Découvrez les cas d'usage
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

export async function getStaticProps() {
  // Essayer de récupérer depuis Blob Storage directement, sinon fallback vers Notion
  let posts = []
  
  try {
    const blobs = await list({ prefix: 'blog-posts.json' })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === 'blog-posts.json')

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
        if (data.posts && Array.isArray(data.posts)) {
          posts = data.posts
        }
      }
    }
  } catch (error) {
    console.warn('Erreur lors de la récupération depuis Blob Storage, fallback vers Notion:', error)
  }

  // Fallback vers Notion si Blob Storage n'est pas disponible
  if (posts.length === 0) {
    posts = await getAllPosts()
  }

  return {
    props: {
      posts,
    },
    revalidate: 60,
  }
} 