import Link from 'next/link'
import { useRouter } from 'next/router'
import { getAllPosts } from '../lib/notion'
import { list } from '@vercel/blob'
import ViewCounter from '../components/ViewCounter'
import { useState, useEffect, useMemo } from 'react'
import SearchBar from '../components/SearchBar'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import FAQ from '../components/FAQ'
import SocialLinks from '../components/SocialLinks'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'

export default function Blog({ posts }) {
  const router = useRouter()
  const initialSearch = typeof router.query?.search === 'string' ? router.query.search.trim() : ''
  const [selectedTag, setSelectedTag] = useState(null)
  const [searchText, setSearchText] = useState(initialSearch)
  const [filteredPosts, setFilteredPosts] = useState(posts)
  const [topPosts, setTopPosts] = useState([])
  const [topPostsLoading, setTopPostsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [allViews, setAllViews] = useState({})
  const [blogStats, setBlogStats] = useState(null)
  const [blogStatsLoading, setBlogStatsLoading] = useState(true)
  const [displayedCount, setDisplayedCount] = useState(12)
  const POSTS_PER_PAGE = 12
  const tagOptions = useMemo(() => {
    const counts = new Map()
    posts.forEach((post) => {
      new Set(post.tags || []).forEach((tag) => {
        if (tag) counts.set(tag, (counts.get(tag) || 0) + 1)
      })
    })

    return [...counts.entries()].map(([tag, count]) => ({
      label: `${tag} (${count})`,
      value: tag,
    }))
  }, [posts])

  // Sync searchText with URL ?search= (pour SearchAction schema)
  useEffect(() => {
    const querySearch = router.query.search
    if (typeof querySearch === 'string' && querySearch.trim()) {
      setSearchText(querySearch.trim())
    }
  }, [router.query.search])

  useEffect(() => {
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
    // Filtrer les posts : tag + recherche texte (titre, metaDescription, tags)
    let filtered = posts

    if (selectedTag) {
      filtered = filtered.filter(post => post.tags.includes(selectedTag))
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim()
      filtered = filtered.filter(post => {
        const titleMatch = (post.title || '').toLowerCase().includes(q)
        const descMatch = (post.metaDescription || '').toLowerCase().includes(q)
        const tagsMatch = (post.tags || []).some(tag => tag.toLowerCase().includes(q))
        return titleMatch || descMatch || tagsMatch
      })
    }

    // Ajouter les vues aux posts filtrés si disponibles
    const filteredWithViews = filtered.map(post => ({
      ...post,
      views: allViews[post.slug] || post.views || 0
    }))

    setFilteredPosts(filteredWithViews)
  }, [selectedTag, searchText, posts, allViews])

  useEffect(() => {
    setDisplayedCount(POSTS_PER_PAGE)
  }, [selectedTag, searchText])

  // Mettre à jour l'URL quand searchText change (pour SearchAction + partage)
  const handleSearchChange = (value) => {
    setSearchText(value)
    const url = value.trim() ? `/blog?search=${encodeURIComponent(value.trim())}` : '/blog'
    router.replace(url, undefined, { shallow: true })
  }

  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.blog.title,
    description: siteConfig.seo.pages.blog.description,
    path: '/blog',
    keywords: siteConfig.seo.pages.blog.keywords
  })

  const faqData = {
    questions: [
      {
        '@type': 'Question',
        name: 'Que trouve-t-on dans ce journal ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Des notes de terrain sur le scraping, l’automatisation, l’outbound, les missions freelance et les projets que je construis.'
        }
      },
      {
        '@type': 'Question',
        name: 'Par où commencer ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Les articles les plus lus donnent un premier aperçu. La recherche et les tags permettent ensuite de suivre un sujet précis.'
        }
      }
    ]
  }

  // Structured Data pour Blog
  const blogStructuredData = {
    name: 'Blog - Corentin Robert',
    description: 'Notes de terrain sur la data, l’outbound, le freelance et les projets en cours.',
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
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="mb-6">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">
            Blog
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-0 tracking-tight">
            Notes de terrain sur le scraping, l&apos;automatisation, l&apos;outbound et
            la vie de freelance. J&apos;y documente aussi Datareacher, Outreacher et
            Logement Atypique au fil de leur construction.
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
            {(selectedTag || searchText.trim()) && filteredPosts.length > 0 && (
              <span className="text-sm text-neutral-500 dark:text-neutral-500">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'article trouvé' : 'articles trouvés'}
              </span>
            )}
          </div>
          <div className="mb-6 space-y-4">
            <SearchBar 
              tags={tagOptions}
              selectedTag={selectedTag}
              onTagSelect={setSelectedTag}
              allLabel={`Tous (${posts.length})`}
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
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">À propos du journal</h2>
          <FAQ
            items={[
              {
                question: "Que trouve-t-on dans ce journal ?",
                answer: "Des notes de terrain sur le scraping, l’automatisation, l’outbound, les missions freelance et les projets que je construis."
              },
              {
                question: "Par où commencer ?",
                answer: "Les articles les plus lus donnent un premier aperçu. La recherche et les tags permettent ensuite de suivre un sujet précis."
              }
            ]}
          />
        </section>

        <section className="mb-12 md:mb-16 pt-8 journal-rule text-center" aria-label="Continuer la lecture">
          <h2 className="font-semibold text-xl mb-4 tracking-tighter">Continuer le fil</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
            Recevez les prochains textes, ou venez poursuivre la conversation sur les réseaux.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link
              href="/newsletter"
              className="px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              Lire la suite par email
            </Link>
            <SocialLinks />
          </div>
        </section>

        <section className="mb-16">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Pour aller plus loin</h2>
          <div className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <p>
              <Link href="/cas-usage" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Cas d&apos;usage
              </Link>
              {' • '}
              <Link href="/marketplace" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Marketplace
              </Link>
              {' • '}
              <Link href="/newsletter" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Newsletter
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
      const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })

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