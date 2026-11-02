import Link from 'next/link'
import { useRouter } from 'next/router'
import { getAllPosts } from '../lib/notion'
import { list } from '@vercel/blob'
import { useState, useEffect } from 'react'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import { QuietSkeletonList } from '../components/QuietSkeleton'
import { formatViewCount } from '../lib/view-label'
import { displayPostTitle } from '../lib/post-title'
import { formatFrenchDate } from '../lib/format-date'

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
  const [postsLoading, setPostsLoading] = useState(!(posts && posts.length > 0))
  const [allViews, setAllViews] = useState({})
  const [viewsReady, setViewsReady] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(false)
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
    const fetchViews = async () => {
      if (!posts || posts.length === 0) {
        return
      }

      try {
        const slugs = posts.map(post => post.slug).join(',')
        const response = await fetch(`/api/views/all?slugs=${slugs}`)
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des vues')
        }
        
        const payload = await response.json()
        const viewsMap = payload.views || payload
        setAllViews(viewsMap)
        setViewsReady(true)
      } catch (error) {
        console.error('Erreur lors de la récupération des vues:', error)
        setViewsReady(true)
      }
    }

    fetchViews()
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
    const byDateDesc = (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    const filteredWithViews = filtered
      .map(post => ({
        ...post,
        views: allViews[post.slug] || post.views || 0
      }))
      .sort(byDateDesc)

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
      headline: displayPostTitle(post),
      url: `${siteConfig.url}/blog/${post.slug}`,
      datePublished: post.date
    }))
  }

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

  const TAGS_VISIBLE = 4
  const rankedTags = [...allTags].sort((a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0) || a.localeCompare(b, 'fr'))
  const hiddenCount = Math.max(0, rankedTags.length - TAGS_VISIBLE)
  const visibleTags = tagsOpen
    ? rankedTags
    : rankedTags.slice(0, TAGS_VISIBLE).concat(
        selectedTag && !rankedTags.slice(0, TAGS_VISIBLE).includes(selectedTag) ? [selectedTag] : []
      )

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
                {viewsReady && (() => {
                  const totalViews = filteredPosts.reduce((sum, post) => sum + (allViews[post.slug] || 0), 0)
                  if (totalViews <= 0) return null
                  return (
                    <>
                      <span className="w-0.5 h-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500 flex-shrink-0 hidden sm:inline" aria-hidden></span>
                      <span className="whitespace-nowrap">{formatViewCount(totalViews)}</span>
                    </>
                  )
                })()}
              </span>
            </div>
            {(selectedTag || searchText.trim()) && filteredPosts.length > 0 && (
              <span className="text-sm text-neutral-500 dark:text-neutral-500">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'article trouvé' : 'articles trouvés'}
              </span>
            )}
          </div>
          <div className="mb-6">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <button
                type="button"
                onClick={() => selectTag(null)}
                className={`whitespace-nowrap pb-1 border-b border-dashed ${
                  selectedTag === null
                    ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                    : 'border-transparent text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                Tous ({posts.length})
              </button>
              {visibleTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => selectTag(tag)}
                  className={`whitespace-nowrap pb-1 border-b border-dashed ${
                    selectedTag === tag
                      ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                      : 'border-transparent text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  {tag} ({tagCounts[tag] || 0})
                </button>
              ))}
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setTagsOpen((open) => !open)}
                  className="whitespace-nowrap pb-1 border-b border-dashed border-transparent text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white"
                >
                  {tagsOpen ? 'Moins' : `Plus (${hiddenCount})`}
                </button>
              )}
            </div>
          </div>
          {postsLoading ? (
            <QuietSkeletonList count={8} variant="post" label="Chargement des articles" />
          ) : filteredPosts && filteredPosts.length > 0 ? (
            <>
              <div className="space-y-4">
                {filteredPosts.slice(0, displayedCount).map((post) => {
                  return (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="post-link group">
                      <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2 transition-all group-hover:translate-x-1">
                      <div className="flex flex-col md:flex-row md:items-baseline w-full">
                        <div className="flex-shrink-0">
                          <p className="post-date text-sm whitespace-nowrap">{formatFrenchDate(post.date)}</p>
                        </div>
                          <span className="hidden md:inline-block w-0.5 h-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500 mx-2 flex-shrink-0"></span>
                          <p className="post-title flex-grow w-full md:ml-0 min-w-0 leading-snug">
                            {displayPostTitle(post)}
                          </p>
                        {viewsReady && (allViews[post.slug] || 0) > 0 && (
                        <div className="md:ml-auto flex-shrink-0 mt-1 md:mt-0">
                          <span className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                            {formatViewCount(allViews[post.slug])}
                          </span>
                        </div>
                        )}
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