import { getPostBlocks, getPostBySlug, getAllPosts } from '../../lib/notion'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import ViewCounter from '../../components/ViewCounter'
import Newsletter from '../../components/Newsletter'
import Block from '../../components/Block'
import Tag from '../../components/Tag'
import RelatedPosts from '../../components/RelatedPosts'
import Link from 'next/link'
import ReadingProgress from '../../components/ReadingProgress'
import ShareButtons from '../../components/ShareButtons'
import Head from 'next/head'
import Breadcrumb from '../../components/Breadcrumb'

export default function Post({ post, blocks, allPosts }) {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Chargement...</div>
  }

  if (!post || !blocks) {
    return <div>Article non trouvé</div>
  }

  // Extraire le contenu textuel des blocs pour le calcul du temps de lecture
  const content = blocks
    .map(block => {
      if (block.type === 'paragraph') {
        return block.paragraph.rich_text.map(text => text.plain_text).join(' ')
      }
      return ''
    })
    .join(' ')

  // Calculer le temps de lecture (200 mots par minute)
  const wordCount = content.trim().split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200)

  // Utiliser la meta description de la colonne dédiée
  const metaDescription = post.metaDescription || 
    'Découvrez notre article sur le growth hacking, le scraping et l\'immobilier de luxe.'

  return (
    <>
      <Head>
        <title>{post.title} | Corentin Robert</title>
        <meta name="description" content={post.metaDescription || `Découvrez ${post.title} sur le blog de Corentin Robert.`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://corentinrobert.com/blog/${post.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.metaDescription || `Découvrez ${post.title} sur le blog de Corentin Robert.`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://corentinrobert.com/blog/${post.slug}`} />
        <meta property="og:image" content={post.coverImage || 'https://corentinrobert.com/og-image.jpg'} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.metaDescription || `Découvrez ${post.title} sur le blog de Corentin Robert.`} />
        <meta name="twitter:image" content={post.coverImage || 'https://corentinrobert.com/og-image.jpg'} />

        {/* Schema.org markup */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.metaDescription || `Découvrez ${post.title} sur le blog de Corentin Robert.`,
            "image": post.coverImage || 'https://corentinrobert.com/og-image.jpg',
            "datePublished": post.date,
            "dateModified": post.date,
            "author": {
              "@type": "Person",
              "name": "Corentin Robert",
              "url": "https://corentinrobert.com"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Corentin Robert",
              "logo": {
                "@type": "ImageObject",
                "url": "https://corentinrobert.com/logo.png"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://corentinrobert.com/blog/${post.slug}`
            }
          })}
        </script>
      </Head>
      <article className="flex-auto min-w-0 mt-6 flex flex-col">
        <header className="mb-8">
          <Breadcrumb title={post.title} />
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
                <ViewCounter slug={post.slug} />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {readingTime} min de lecture
                </span>
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
                  url={`https://corentinrobert.com/blog/${post.slug}`}
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
                <ViewCounter slug={post.slug} />
                <span className="text-neutral-400">•</span>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {readingTime} min de lecture
                </span>
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
                  url={`https://corentinrobert.com/blog/${post.slug}`}
                  title={post.title} 
                />
              </div>
            </div>
          </div>
        </header>

        <ReadingProgress content={content} />
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {blocks.map((block) => (
            <Block key={block.id} block={block} />
          ))}
        </div>

        <RelatedPosts currentPost={post} allPosts={allPosts} />

        <div className="mt-12">
          <Newsletter />
        </div>
      </article>
    </>
  )
}

export async function getStaticPaths() {
  const posts = await getAllPosts()
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }))

  return {
    paths,
    fallback: true,
  }
}

export async function getStaticProps({ params }) {
  const post = await getPostBySlug(params.slug)
  const blocks = await getPostBlocks(post.id)
  const allPosts = await getAllPosts()

  if (!post) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      post,
      blocks,
      allPosts,
    },
    revalidate: 60,
  }
} 