import { useRouter } from 'next/router'
import { getPostBySlug, getAllPosts } from '../../lib/notion'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'
import Link from 'next/link'
import Layout from '../../components/Layout'

const imageLoader = ({ src }) => {
  return src
}

export default function BlogPost({ post }) {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Chargement...</div>
  }

  if (!post) {
    return <div>Article non trouvé</div>
  }

  return (
    <Layout>
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section>
          <h1 className="font-semibold text-2xl tracking-tighter">{post.title}</h1>
          <div className="flex justify-between items-center mt-2 mb-8 text-sm">
            <p className="text-neutral-600 dark:text-neutral-400">{post.date}</p>
          </div>
          <article className="prose prose-neutral dark:prose-invert">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="text-neutral-800 dark:text-neutral-200">{children}</p>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-semibold mt-8 mb-4 text-neutral-900 dark:text-neutral-100">
                    <a href={`#${children.toLowerCase().replace(/\s+/g, '-')}`} className="anchor"></a>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold mt-6 mb-3 text-neutral-900 dark:text-neutral-100">{children}</h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 my-4 space-y-2 text-neutral-800 dark:text-neutral-200">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 my-4 space-y-2 text-neutral-800 dark:text-neutral-200">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-neutral-800 dark:text-neutral-200">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-neutral-300 dark:border-neutral-700 pl-4 my-4 italic text-neutral-700 dark:text-neutral-300">{children}</blockquote>
                ),
                img: ({ src, alt }) => {
                  if (!src) return null
                  return (
                    <div className="my-8">
                      <Image
                        loader={imageLoader}
                        src={src}
                        alt={alt || ''}
                        width={800}
                        height={400}
                        className="rounded-lg shadow-lg"
                        unoptimized
                      />
                    </div>
                  )
                },
              }}
            >
              {post.content}
            </ReactMarkdown>
          </article>
        </section>
      </main>
    </Layout>
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

  return {
    props: {
      post,
    },
    revalidate: 60,
  }
} 