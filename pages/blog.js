import Link from 'next/link'
import { getAllPosts } from '../lib/notion'
import { list } from '@vercel/blob'
import ViewCounter from '../components/ViewCounter'
import Tag from '../components/Tag'
import { useState, useEffect } from 'react'
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
            '@type': 'Blog',
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
        <section className="mb-8">
          <h1 className="font-semibold text-2xl mb-8 tracking-tighter">
            Blog
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 tracking-tight">
            Réflexions sur le <strong className="text-neutral-900 dark:text-neutral-100">scraping</strong>, l'<strong className="text-neutral-900 dark:text-neutral-100">automatisation</strong> et l'<strong className="text-neutral-900 dark:text-neutral-100">entrepreneuriat</strong>. Cas d'usage business, retours d'expérience et partage de bonnes pratiques pour automatiser vos processus.
          </p>
        <SearchBar 
          tags={allTags}
          selectedTag={selectedTag}
          onTagSelect={setSelectedTag}
        />
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
                          <p className="post-date whitespace-nowrap">{(() => {
                            const date = new Date(post.date)
                            const day = String(date.getDate()).padStart(2, '0')
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const year = date.getFullYear()
                            return `${day}-${month}-${year}`
                          })()}</p>
                        </div>
                        <span className="hidden md:inline-block w-0.5 h-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500 mx-2 flex-shrink-0"></span>
                        <p className="post-title flex-grow w-full md:ml-0 flex items-center gap-2">
                          <span className="break-words whitespace-normal">{post.title}</span>
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
              <span className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}
                <span className="w-0.5 h-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500 flex-shrink-0"></span>
                {(() => {
                  const totalViews = Object.keys(allViews).length > 0 
                    ? filteredPosts.reduce((sum, post) => sum + (allViews[post.slug] || 0), 0)
                    : filteredPosts.reduce((sum, post) => sum + (post.views || 0), 0)
                  return `${totalViews} ${totalViews === 1 ? 'vue' : 'vues'}`
                })()}
              </span>
            </div>
            {selectedTag && filteredPosts.length > 0 && (
              <span className="text-sm text-neutral-500 dark:text-neutral-500">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'article trouvé' : 'articles trouvés'}
              </span>
            )}
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
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="post-link group">
                    <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2 transition-all group-hover:translate-x-1">
                    <div className="flex flex-col md:flex-row md:items-center w-full">
                      <div className="flex-shrink-0">
                        <p className="post-date whitespace-nowrap">{(() => {
                          const date = new Date(post.date)
                          const day = String(date.getDate()).padStart(2, '0')
                          const month = String(date.getMonth() + 1).padStart(2, '0')
                          const year = date.getFullYear()
                          return `${day}-${month}-${year}`
                        })()}</p>
                      </div>
                        <span className="hidden md:inline-block w-0.5 h-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500 mx-2 flex-shrink-0"></span>
                        <p className="post-title flex-grow w-full md:ml-0 flex items-center gap-2">
                          <span className="break-words whitespace-normal">{post.title}</span>
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
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Une question après lecture ?</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
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