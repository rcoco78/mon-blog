import { getPostBlocks, getPostBySlug, getAllPosts } from '../../lib/notion'
import { head, list } from '@vercel/blob'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import ViewCounter from '../../components/ViewCounter'
import Block from '../../components/Block'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import NewsletterForm from '../../components/NewsletterForm'
import Tag from '../../components/Tag'
import RelatedPosts from '../../components/RelatedPosts'
import TableOfContents from '../../components/TableOfContents'
import Link from 'next/link'
import ReadingProgress from '../../components/ReadingProgress'
import ShareButtons from '../../components/ShareButtons'
import SEOHead from '../../components/seo/SEOHead'
import StructuredData from '../../components/seo/StructuredData'
import { siteConfig } from '../../lib/config'

export default function Post({ post, allPosts }) {
  const router = useRouter()
  const [contentMarkdown, setContentMarkdown] = useState(null)
  const [blocks, setBlocks] = useState(null)
  const [loadingMarkdown, setLoadingMarkdown] = useState(false)

  // Charger le markdown/blocks côté client pour réduire la taille des props
  useEffect(() => {
    if (post?.slug && !contentMarkdown && !blocks) {
      setLoadingMarkdown(true)
      fetch(`/api/blog-posts/${post.slug}`)
        .then(res => res.json())
        .then(data => {
          if (data.contentMarkdown) {
            setContentMarkdown(data.contentMarkdown)
          } else if (data.blocks) {
            // Si pas de markdown mais des blocks, les utiliser
            setBlocks(data.blocks)
          }
          setLoadingMarkdown(false)
        })
        .catch(error => {
          console.warn('Erreur lors du chargement du contenu:', error)
          setLoadingMarkdown(false)
        })
    }
  }, [post?.slug])

  if (router.isFallback) {
    return <div>Chargement...</div>
  }

  if (!post) {
    return <div>Article non trouvé</div>
  }

  // Extraire le contenu textuel pour le calcul du temps de lecture
  // Utiliser le contenu disponible (markdown chargé côté client ou fallback)
  let content = ''
  if (contentMarkdown) {
    // Si on a du markdown, l'utiliser
    const markdownText = typeof contentMarkdown === 'string' 
      ? contentMarkdown 
      : (contentMarkdown.parent || '')
    // Nettoyer le markdown pour compter les mots (enlever les caractères markdown)
    content = markdownText
      .replace(/[#*`\[\]()]/g, '') // Enlever les caractères markdown
      .replace(/\n+/g, ' ') // Remplacer les retours à la ligne par des espaces
      .trim()
  } else if (blocks) {
    // Sinon, utiliser les blocks Notion (chargés côté client)
    content = blocks
      .map(block => {
        if (block.type === 'paragraph' && block.paragraph?.rich_text) {
          return block.paragraph.rich_text
            .map(text => text?.plain_text || '')
            .filter(text => text.length > 0)
            .join(' ')
        }
        return ''
      })
      .filter(text => text.length > 0)
      .join(' ')
  } else {
    // Fallback : utiliser la meta description pour le calcul minimal
    content = post.metaDescription || post.title || ''
  }

  // Calculer le temps de lecture (200 mots par minute)
  // Si le contenu n'est pas encore chargé, on ne peut pas calculer le temps de lecture
  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length
  const readingTime = loadingMarkdown ? null : Math.ceil(wordCount / 200)

  const articleUrl = `${siteConfig.url}/blog/${post.slug}`;
  
  // Générer une meta description optimisée (150-160 caractères pour SEO)
  const metaDescription = post.metaDescription 
    ? post.metaDescription.substring(0, 160).replace(/\s+\S*$/, '')
    : content 
    ? content.substring(0, 155).replace(/\s+\S*$/, '...')
    : `Découvrez ${post.title} sur le blog de Corentin Robert. Article sur le scraping, l'automatisation et le growth hacking.`;

  // Extraire le contenu textuel pour articleBody (premiers 5000 caractères)
  // Utiliser le contenu disponible (blocks ou contenu minimal pour SEO)
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
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-5xl mb-4">
            {post.title}
          </h1>
          <div className="flex flex-col space-y-4">
            {/* Version mobile */}
            <div className="md:hidden flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <time 
                  dateTime={post.date} 
                  className="text-sm text-neutral-600 dark:text-neutral-400"
                >
                  {new Date(post.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </time>
                <span className="text-neutral-400">•</span>
                <ViewCounter slug={post.slug} increment={true} />
              </div>
              <div className="flex items-center space-x-2">
                {loadingMarkdown ? (
                  <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                ) : (
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {readingTime} min de lecture
                  </span>
                )}
                {post.tags && post.tags.length > 0 && (
                  <>
                    <span className="text-neutral-400">•</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {post.tags.map((tag, index) => (
                        <button
                          key={index}
                          className="px-2 py-0.5 rounded-full text-sm transition-colors bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <ShareButtons 
                  url={articleUrl}
                  title={post.title} 
                />
              </div>
            </div>

            {/* Version desktop */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <time 
                  dateTime={post.date} 
                  className="text-sm text-neutral-600 dark:text-neutral-400"
                >
                  {new Date(post.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </time>
                <span className="text-neutral-400">•</span>
                <ViewCounter slug={post.slug} increment={true} />
                <span className="text-neutral-400">•</span>
                {loadingMarkdown ? (
                  <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                ) : (
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {readingTime} min de lecture
                  </span>
                )}
                {post.tags && post.tags.length > 0 && (
                  <>
                    <span className="text-neutral-400">•</span>
                    <div className="flex items-center space-x-2">
                      {post.tags.map((tag, index) => (
                        <button
                          key={index}
                          className="px-2 py-0.5 rounded-full text-sm transition-colors bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
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

        <ReadingProgress content={content} />
        
        {/* Contenu principal en pleine largeur */}
        <div className="mt-8">
            {/* Sommaire - Skeleton pendant le chargement */}
            {loadingMarkdown ? (
              <div className="mb-8 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 animate-pulse">
                <div className="h-6 w-24 bg-neutral-200 dark:bg-neutral-800 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                  <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                  <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
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
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                {blocks.map((block) => (
                  <Block key={block.id} block={block} />
                ))}
              </div>
            ) : null}

            {/* Partage social en fin d'article */}
            <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
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
      </article>
    </>
  )
}

export async function getStaticPaths() {
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

  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }))

  return {
    paths,
    fallback: true,
  }
}

export async function getStaticProps({ params }) {
  // Essayer de récupérer depuis Blob Storage directement, sinon fallback vers Notion
  let post = null
  let blocks = null
  let contentMarkdown = null
  let allPosts = []

  try {
    // Récupérer l'article depuis Blob Storage
    try {
      const blob = await head(`blog-posts/${params.slug}.json`)
      if (blob) {
        const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const response = await fetch(`${blob.url}?t=${cacheBuster}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            Pragma: 'no-cache',
          },
        })

        if (response.ok) {
          const article = await response.json()
          post = {
            ...article,
            // Ne pas inclure contentMarkdown et blocks dans les props (trop lourd)
            // Ils seront chargés côté client si nécessaire
            contentMarkdown: undefined,
            blocks: undefined
          }
          // Ne pas passer le contenu markdown complet dans les props (trop lourd)
          // On le chargera côté client via l'API pour réduire la taille des props
          contentMarkdown = null
          blocks = null
        }
      }
    } catch (blobError) {
      // Blob n'existe pas encore (normal si cron jobs n'ont pas tourné)
      // Pas besoin de logger l'erreur, on fait juste le fallback silencieusement
      if (blobError.name !== 'BlobNotFoundError') {
        // Logger seulement si ce n'est pas une erreur "not found" attendue
        console.warn('Erreur Blob Storage (non critique):', blobError.message)
      }
    }

    // Récupérer tous les posts pour RelatedPosts
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
          allPosts = data.posts
        }
      }
    }
  } catch (error) {
    console.warn('Erreur lors de la récupération depuis Blob Storage, fallback vers Notion:', error)
  }

  // Fallback vers Notion si Blob Storage n'est pas disponible
  if (!post) {
    post = await getPostBySlug(params.slug)
    if (post) {
      // Ne pas charger les blocks dans getStaticProps (trop lourd)
      // Ils seront chargés côté client si nécessaire
      blocks = null
    }
  }

  if (allPosts.length === 0) {
    allPosts = await getAllPosts()
  }

  if (!post) {
    return {
      notFound: true,
    }
  }

  // Ne pas passer blocks ni contentMarkdown dans les props pour réduire la taille
  // Ils seront chargés côté client via l'API si nécessaire
  // Convertir undefined en null pour la sérialisation JSON
  return {
    props: {
      post: {
        id: post.id || null,
        title: post.title || null,
        date: post.date || null,
        slug: post.slug || null,
        tags: post.tags || null,
        metaDescription: post.metaDescription || null,
        coverImage: post.coverImage || null,
        lastEdited: post.lastEdited || null,
      },
      allPosts: allPosts.map(p => ({
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