import { getPostBySlug, getAllPosts } from '../../lib/notion'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import ViewCounter from '../../components/ViewCounter'
import Block from '../../components/Block'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import NewsletterForm from '../../components/NewsletterForm'
import ArticleNewsletterNudge from '../../components/ArticleNewsletterNudge'
import RelatedPosts from '../../components/RelatedPosts'
import SeriesBanner from '../../components/SeriesBanner'
import TableOfContents from '../../components/TableOfContents'
import { getPrimarySeries } from '../../lib/blog-series'
import ReadingProgress from '../../components/ReadingProgress'
import ShareButtons from '../../components/ShareButtons'
import SEOHead from '../../components/seo/SEOHead'
import StructuredData from '../../components/seo/StructuredData'
import { siteConfig } from '../../lib/config'
import { fetchBlobJson, fetchBlobJsonByHead } from '../../lib/blob-cache'
import { captureDataError } from '../../lib/sentry'

function extractPlainText(contentMarkdown, blocks, fallback = '') {
  const markdownText = normalizeMarkdown(contentMarkdown)
  if (markdownText) {
    return markdownText
      .replace(/[#*`\[\]()]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
  }
  if (blocks?.length) {
    return blocks
      .map((block) => {
        if (block.type === 'paragraph' && block.paragraph?.rich_text) {
          return block.paragraph.rich_text
            .map((text) => text?.plain_text || '')
            .filter((text) => text.length > 0)
            .join(' ')
        }
        return ''
      })
      .filter((text) => text.length > 0)
      .join(' ')
  }
  return fallback
}

function normalizeMarkdown(contentMarkdown) {
  if (!contentMarkdown) return null
  if (typeof contentMarkdown === 'string') return contentMarkdown
  if (typeof contentMarkdown?.parent === 'string') return contentMarkdown.parent
  return null
}

function serializePost(post) {
  return {
    id: post.id || null,
    title: post.title || null,
    date: post.date || null,
    slug: post.slug || null,
    tags: post.tags || null,
    metaDescription: post.metaDescription || null,
    coverImage: post.coverImage || null,
    lastEdited: post.lastEdited || null,
    contentMarkdown: normalizeMarkdown(post.contentMarkdown),
    blocks: post.blocks || null,
  }
}

export default function Post({ post, allPosts }) {
  const router = useRouter()
  const [contentMarkdown, setContentMarkdown] = useState(normalizeMarkdown(post?.contentMarkdown))
  const [blocks, setBlocks] = useState(post?.blocks || null)
  const hasInitialContent = !!(normalizeMarkdown(post?.contentMarkdown) || post?.blocks?.length)
  const [loadingMarkdown, setLoadingMarkdown] = useState(!hasInitialContent && !!post?.slug)
  const primarySeries = getPrimarySeries(
    post?.slug,
    (allPosts || []).map((p) => p.slug)
  )

  // Incrémenter la vue à chaque chargement de page (sans cache)
  useEffect(() => {
    if (post?.slug) {
      fetch(`/api/views/${post.slug}?increment=true`)
        .catch((error) => {
          console.warn('Erreur lors de l\'incrémentation des vues:', error)
        })
    }
  }, [post?.slug])

  // Refresh optionnel uniquement si le contenu n'était pas en SSR
  useEffect(() => {
    if (!post?.slug || hasInitialContent) return

    let cancelled = false
    setLoadingMarkdown(true)
    fetch(`/api/blog-posts/${post.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data.contentMarkdown) setContentMarkdown(normalizeMarkdown(data.contentMarkdown))
        else if (data.blocks) setBlocks(data.blocks)
      })
      .catch((error) => {
        console.warn('Erreur lors du chargement du contenu:', error)
        captureDataError(error, { source: 'blog', tags: { area: 'client-fetch', slug: post.slug } })
      })
      .finally(() => {
        if (!cancelled) setLoadingMarkdown(false)
      })

    return () => {
      cancelled = true
    }
  }, [post?.slug, hasInitialContent])

  // fallback: 'blocking' ne devrait plus servir de HTML indexable vide ;
  // noindex de sécurité si jamais isFallback est vrai.
  if (router.isFallback) {
    return (
      <>
        <SEOHead title="Chargement" description="Chargement de l'article" noindex />
        <div>Chargement...</div>
      </>
    )
  }

  if (!post) {
    return <div>Article non trouvé</div>
  }

  const content = extractPlainText(
    contentMarkdown,
    blocks,
    post.metaDescription || post.title || ''
  )

  const wordCount = content.trim().split(/\s+/).filter((word) => word.length > 0).length
  const readingTime = loadingMarkdown && !hasInitialContent ? null : Math.max(1, Math.ceil(wordCount / 200))

  const articleUrl = `${siteConfig.url}/blog/${post.slug}`

  const metaDescription = post.metaDescription
    ? post.metaDescription.substring(0, 160).replace(/\s+\S*$/, '')
    : content
      ? content.substring(0, 155).replace(/\s+\S*$/, '...')
      : `Découvrez ${post.title} sur le blog de Corentin Robert. Article sur le scraping, l'automatisation et le growth hacking.`

  const articleBody = content.substring(0, 5000)

  // Préparer les images pour Schema (array)
  const images = []
  if (post.coverImage) {
    images.push(post.coverImage)
  }
  if (siteConfig.ogImage) {
    images.push(siteConfig.ogImage)
  }

  // Breadcrumb items pour Schema
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Accueil',
      item: siteConfig.url
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: `${siteConfig.url}/blog`
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: post.title,
      item: articleUrl
    }
  ]

  return (
    <>
      <SEOHead
        title={post.title}
        description={metaDescription}
        canonical={articleUrl}
        ogImage={post.coverImage || siteConfig.ogImage || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'}
        ogType="article"
        keywords={post.tags?.join(', ')}
        publishedTime={post.date}
        modifiedTime={post.lastEdited || post.date}
        tags={post.tags || []}
        article={true}
        imageAlt={post.title}
      />
      
      {/* BlogPosting Schema enrichi - Optimisé pour Google */}
      <StructuredData
        type="BlogPosting"
        data={{
          title: post.title,
          description: metaDescription,
          image: images.length > 0 ? images : siteConfig.ogImage,
          datePublished: post.date,
          dateModified: post.lastEdited || post.date,
          url: articleUrl,
          articleBody: articleBody,
          wordCount: wordCount,
          timeRequired: `PT${readingTime}M`,
          keywords: post.tags?.join(', ') || 'scraping, automatisation, entrepreneuriat',
          articleSection: post.tags?.[0] || 'Blog',
          speakable: {
            cssSelector: ['h1', 'h2']
          }
        }}
      />
      
      {/* Note: Breadcrumb Schema est déjà géré par le composant <Breadcrumb /> */}
      <article className="flex-auto min-w-0 mt-6 flex flex-col">
        <header className="mb-8">
          {/* Breadcrumb Schema.org pour SEO (invisible) */}
          <StructuredData
            type="BreadcrumbList"
            data={{
              items: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Accueil',
                  item: siteConfig.url
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Blog',
                  item: `${siteConfig.url}/blog`
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: post.title,
                  item: articleUrl
                }
              ]
            }}
          />
          <h1 className="font-semibold text-3xl sm:text-4xl tracking-tighter text-neutral-900 dark:text-neutral-100 mb-5 leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-col space-y-4">
            {/* Version mobile — meta aérées */}
            <div className="md:hidden flex flex-col gap-4">
              <div className="flex flex-col gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <time dateTime={post.date}>
                    {(() => {
                      const date = new Date(post.date)
                      const day = String(date.getDate()).padStart(2, '0')
                      const month = String(date.getMonth() + 1).padStart(2, '0')
                      const year = date.getFullYear()
                      return `${day}-${month}-${year}`
                    })()}
                  </time>
                  <span className="text-neutral-400" aria-hidden>
                    ·
                  </span>
                  <ViewCounter slug={post.slug} />
                </div>
                {loadingMarkdown ? (
                  <div className="h-5 w-28 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                ) : (
                  <p>{readingTime} min de lecture</p>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 rounded text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <ShareButtons url={articleUrl} title={post.title} />
              </div>
            </div>

            {/* Version desktop — date, vues, temps, tags en enfants directs pour alignement identique */}
            <div className="hidden md:flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                <time 
                  dateTime={post.date} 
                  className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
                >
                  {(() => {
                    const date = new Date(post.date)
                    const day = String(date.getDate()).padStart(2, '0')
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const year = date.getFullYear()
                    return `${day}-${month}-${year}`
                  })()}
                </time>
                <span className="text-neutral-400 shrink-0">•</span>
                <ViewCounter slug={post.slug} />
                <span className="text-neutral-400 shrink-0">•</span>
                {loadingMarkdown ? (
                  <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                ) : (
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                    {readingTime} min de lecture
                  </span>
                )}
                {post.tags && post.tags.length > 0 && (
                  <>
                    <span className="text-neutral-400 shrink-0">•</span>
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 rounded text-xs leading-none transition-colors bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                  </>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <ShareButtons 
                  url={articleUrl}
                  title={post.title} 
                />
              </div>
            </div>
          </div>
        </header>

        <ReadingProgress />

        {primarySeries ? (
          <div className="mt-8">
            <SeriesBanner series={primarySeries} isHub={primarySeries.hub === post.slug} />
          </div>
        ) : null}
        
        <div className="mt-8">
            {/* Sommaire - Skeleton pendant le chargement */}
            {loadingMarkdown ? (
              <div className="mb-8 rounded-lg border border-neutral-200 dark:border-neutral-800 animate-pulse px-4 py-3.5 md:p-5">
                <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded mb-3" />
                <div className="hidden md:block space-y-2">
                  <div className="h-3 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  <div className="h-3 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded" />
                </div>
              </div>
            ) : contentMarkdown ? (
              <TableOfContents markdown={contentMarkdown} />
            ) : null}

            {loadingMarkdown ? (
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full mb-2"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6"></div>
                  </div>
                ))}
              </div>
            ) : contentMarkdown ? (
              <MarkdownRenderer>{contentMarkdown}</MarkdownRenderer>
            ) : blocks ? (
        <div className="blog-prose prose prose-neutral dark:prose-invert max-w-none sm:max-w-[65ch]">
          {blocks.map((block) => (
            <Block key={block.id} block={block} />
          ))}
              </div>
            ) : null}

            {/* Partage social en fin d'article */}
            <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Partager cet article :</span>
                <ShareButtons 
                  url={articleUrl}
                  title={post.title} 
                />
              </div>
        </div>

            {/* Articles similaires */}
        <RelatedPosts currentPost={post} allPosts={allPosts} />

            {/* Newsletter en fin d'article */}
            <NewsletterForm compact={false} />
        </div>
        <ArticleNewsletterNudge />
      </article>
    </>
  )
}

export async function getStaticPaths() {
  let posts = []

  try {
    const data = await fetchBlobJson('blog-posts.json')
    if (data?.posts && Array.isArray(data.posts)) {
      posts = data.posts
    }
  } catch (error) {
    console.warn('Erreur lors de la récupération depuis Blob Storage, fallback vers Notion:', error)
    captureDataError(error, { source: 'blob', tags: { area: 'blog-paths' } })
  }

  if (posts.length === 0) {
    posts = await getAllPosts()
  }

  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }))

  return {
    paths,
    fallback: 'blocking',
  }
}

export async function getStaticProps({ params }) {
  if (params.slug && (params.slug.includes('[slug]') || params.slug === '[slug]')) {
    return { notFound: true }
  }

  let post = null
  let allPosts = []

  try {
    const article = await fetchBlobJsonByHead(`blog-posts/${params.slug}.json`)
    if (article) {
      post = serializePost({
        ...article,
        contentMarkdown: article.contentMarkdown || null,
        blocks: article.blocks || null,
      })
    }

    const indexData = await fetchBlobJson('blog-posts.json')
    if (indexData?.posts && Array.isArray(indexData.posts)) {
      allPosts = indexData.posts
    }
  } catch (error) {
    console.warn('Erreur lors de la récupération depuis Blob Storage, fallback vers Notion:', error)
    captureDataError(error, { source: 'blob', tags: { area: 'blog-ssr', slug: params.slug } })
  }

  if (!post) {
    try {
      const notionPost = await getPostBySlug(params.slug)
      if (notionPost) {
        post = serializePost(notionPost)
      }
    } catch (error) {
      captureDataError(error, { source: 'notion', tags: { area: 'blog-ssr', slug: params.slug } })
    }
  }

  if (allPosts.length === 0) {
    try {
      allPosts = await getAllPosts()
    } catch (error) {
      captureDataError(error, { source: 'notion', tags: { area: 'blog-related' } })
    }
  }

  if (!post) {
    return { notFound: true }
  }

  return {
    props: {
      post,
      allPosts: allPosts.map((p) => ({
        id: p.id || null,
        title: p.title || null,
        date: p.date || null,
        slug: p.slug || null,
        tags: p.tags || null,
        metaDescription: p.metaDescription || null,
      })),
    },
    revalidate: 60,
  }
}
 