import Link from 'next/link'
import { useRouter } from 'next/router'
import { getAllPosts } from '../lib/notion'
import { list } from '@vercel/blob'
import { useState, useEffect } from 'react'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import { QuietBone, QuietSkeletonList } from '../components/QuietSkeleton'

function canonicalTag(tag = '') {
  if (/^freelanc/i.test(tag)) return 'Freelance'
  return tag
}

export default function Blog({ posts }) {
  const router = useRouter()
  const initialSearch = typeof router.query?.search === 'string' ? router.query.search.trim() : ''
  const [selectedTag, setSelectedTag] = useState(null)

  const selectTag = (tag) => {
    const query = { ...router.query }
    delete query.tag
    if (tag) query.tag = tag
    router.push({ pathname: '/blog', query }, undefined, { shallow: true })
  }
  const [searchText, setSearchText] = useState(initialSearch)
  const [allTags, setAllTags] = useState([])
  const [filteredPosts, setFilteredPosts] = useState(posts)
  const [topPosts, setTopPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(!(posts && posts.length > 0))
  const [allViews, setAllViews] = useState({})
  const [blogStats, setBlogStats] = useState(null)
  const [blogStatsLoading, setBlogStatsLoading] = useState(true)
  const INITIAL_VISIBLE_POSTS = 40
  const [displayedCount, setDisplayedCount] = useState(INITIAL_VISIBLE_POSTS)

  // Sync searchText with URL ?search= (pour SearchAction schema)
  useEffect(() => {
    const querySearch = router.query.search
    if (typeof querySearch === 'string' && querySearch.trim()) {
      setSearchText(querySearch.trim())
    }
  }, [router.query.search])

  useEffect(() => {
    if (!router.isReady) return
    const raw = typeof router.query.tag === 'string' ? router.query.tag : ''
    setSelectedTag(raw ? canonicalTag(raw) : null)
  }, [router.isReady, router.query.tag])

  useEffect(() => {
    // Extraire tous les tags uniques
    const tags = [...new Set(posts.flatMap((post) => (post.tags || []).map(canonicalTag)))]
    setAllTags(tags)
    setPostsLoading(false)
  }, [posts])

  useEffect(() => {
    // Récupérer les articles les plus lus
    const fetchTopPosts = async () => {
      if (!posts || posts.length === 0) {
        setTopPosts([])
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
      } catch (error) {
        console.error('Erreur lors de la récupération des vues:', error)
        setTopPosts([])
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
      filtered = filtered.filter((post) => (post.tags || []).some((tag) => canonicalTag(tag) === selectedTag))
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
    setDisplayedCount(INITIAL_VISIBLE_POSTS)
  }, [selectedTag, searchText])

  // Mettre à jour l'URL quand searchText change (pour SearchAction + partage)

  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.blog.title,
    description: siteConfig.seo.pages.blog.description,
    path: '/blog',
    keywords: siteConfig.seo.pages.blog.keywords
  })

  // Structured Data pour Blog
  const blogStructuredData = {
    name: 'Journal',
    description: 'Articles, réflexions et partages sur l\'entrepreneuriat, le scraping, l\'automatisation, le voyage et bien plus.',
    url: `${siteConfig.url}/blog`,
    blogPost: posts.slice(0, 10).map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${siteConfig.url}/blog/${post.slug}`,
      datePublished: post.date
    }))
  }

  const topSlugs = topPosts.map((post) => post.slug)
  const listedPosts = !selectedTag && !searchText.trim() && topSlugs.length
    ? [...filteredPosts].sort((a, b) => {
        const ia = topSlugs.indexOf(a.slug)
        const ib = topSlugs.indexOf(b.slug)
        if (ia === -1 && ib === -1) return 0
        if (ia === -1) return 1
        if (ib === -1) return -1
        return ia - ib
      })
    : filteredPosts

  const tagCounts = posts.reduce((counts, post) => {
    const seen = new Set()
    for (const tag of post.tags || []) {
      const name = canonicalTag(tag)
      if (seen.has(name)) continue
      seen.add(name)
      counts[name] = (counts[name] || 0) + 1
    }
    return counts
  }, {})

  return (
    <>
      <SEOHead {...pageSEO} />
      <StructuredData type="Blog" data={blogStructuredData} />
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="mb-8">
          <h1 className="font-semibold text-2xl mb-3 tracking-tighter">Journal</h1>
          <p className="text-neutral-600 dark:text-neutral-400 tracking-tight">
            Notes de terrain sur la data, l’outbound et le freelance.
          </p>
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-xl tracking-tighter">Articles</h2>
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
                    <QuietBone inline className="h-3 w-16" />
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
          <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex flex-nowrap gap-x-4 overflow-x-auto pb-1 text-sm scrollbar-hide">
              <button
                type="button"
                onClick={() => selectTag(null)}
                className={`shrink-0 whitespace-nowrap pb-1 border-b border-dashed ${
                  selectedTag === null
                    ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                Tous ({posts.length})
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => selectTag(tag)}
                  className={`shrink-0 whitespace-nowrap pb-1 border-b border-dashed ${
                    selectedTag === tag
                      ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  {tag} ({tagCounts[tag] || 0})
                </button>
              ))}
            </div>
          </div>
          {postsLoading ? (
            <QuietSkeletonList count={8} variant="post" label="Chargement des articles" />
          ) : filteredPosts && filteredPosts.length > 0 ? (
            <>
              <div className="space-y-4">
                {listedPosts.slice(0, displayedCount).map((post) => {
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
                          <span className="text-sm text-neutral-500 whitespace-nowrap">
                            {(allViews[post.slug] ?? post.views ?? 0).toLocaleString('fr-FR')} vues
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  )
                })}
              </div>
              {filteredPosts.length > INITIAL_VISIBLE_POSTS && displayedCount < filteredPosts.length && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setDisplayedCount(prev => Math.min(prev + INITIAL_VISIBLE_POSTS, filteredPosts.length))}
                    className="text-sm text-neutral-600 dark:text-neutral-400 underline underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-100"
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
                      onClick={() => selectTag(null)}
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