import { getPostBlocks, getPostBySlug, getAllPosts } from '../../lib/notion'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import ViewCounter from '../../components/ViewCounter'
import Block from '../../components/Block'
import Tag from '../../components/Tag'
import RelatedPosts from '../../components/RelatedPosts'
import Link from 'next/link'
import ReadingProgress from '../../components/ReadingProgress'
import ShareButtons from '../../components/ShareButtons'
import SEOHead from '../../components/seo/SEOHead'
import StructuredData from '../../components/seo/StructuredData'
import Breadcrumb from '../../components/Breadcrumb'
import { siteConfig } from '../../lib/config'

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

  // Calculer le temps de lecture (200 mots par minute)
  const wordCount = content.trim().split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200)

  const articleUrl = `${siteConfig.url}/blog/${post.slug}`;
  
  // Générer une meta description optimisée
  const metaDescription = post.metaDescription 
    ? post.metaDescription
    : post.excerpt 
    ? post.excerpt.substring(0, 160).replace(/\s+\S*$/, '...')
    : `Découvrez ${post.title} sur le blog de Corentin Robert. Article sur le scraping, l'automatisation et le growth hacking.`;

  return (
    <>
      <SEOHead
        title={post.title}
        description={metaDescription}
        canonical={articleUrl}
        ogImage={post.coverImage || siteConfig.ogImage}
        ogType="article"
        keywords={post.tags?.join(', ')}
        publishedTime={post.date}
        modifiedTime={post.lastEdited || post.date}
        tags={post.tags || []}
        article={true}
        imageAlt={post.title}
      />
      <StructuredData
        type="BlogPosting"
        data={{
          title: post.title,
          description: metaDescription,
          image: post.coverImage || siteConfig.ogImage,
          datePublished: post.date,
          dateModified: post.date,
          url: articleUrl
        }}
      />
      <article className="flex-auto min-w-0 mt-6 flex flex-col">
        <header className="mb-8">
          <Breadcrumb title={post.title} slug={post.slug} />
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
                  url={`https://corentinrobert.fr/blog/${post.slug}`}
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
                  url={`https://corentinrobert.fr/blog/${post.slug}`}
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