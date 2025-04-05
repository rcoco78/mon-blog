import { getPostBlocks, getPostBySlug, getAllPosts } from '../../lib/notion'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import ViewCounter from '../../components/ViewCounter'

export default function Post({ post, blocks }) {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Chargement...</div>
  }

  if (!post || !blocks) {
    return <div>Article non trouvé</div>
  }

  return (
    <article className="flex-auto min-w-0 mt-6 flex flex-col">
      <header className="mb-9 space-y-1">
        <h1 className="font-semibold text-2xl mb-2 tracking-tighter">{post.title}</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <time dateTime={post.date}>{post.date}</time>
          <span>·</span>
          <ViewCounter slug={post.slug} />
        </div>
      </header>
      <div className="prose prose-sm md:prose max-w-none">
        {blocks.map((block, index) => {
          const { type, id } = block
          const value = block[type]

          switch (type) {
            case 'paragraph':
              return (
                <p key={id} className="mb-4">
                  {value.rich_text.map((text, i) => (
                    <span key={i} className={text.annotations.bold ? 'font-bold' : ''}>
                      {text.plain_text}
                    </span>
                  ))}
                </p>
              )
            case 'heading_1':
              return (
                <h1 key={id} className="text-3xl font-bold mb-4">
                  {value.rich_text.map((text, i) => (
                    <span key={i}>{text.plain_text}</span>
                  ))}
                </h1>
              )
            case 'heading_2':
              return (
                <h2 key={id} className="text-2xl font-bold mb-3">
                  {value.rich_text.map((text, i) => (
                    <span key={i}>{text.plain_text}</span>
                  ))}
                </h2>
              )
            case 'heading_3':
              return (
                <h3 key={id} className="text-xl font-bold mb-2">
                  {value.rich_text.map((text, i) => (
                    <span key={i}>{text.plain_text}</span>
                  ))}
                </h3>
              )
            case 'bulleted_list_item':
              return (
                <ul key={id} className="list-disc ml-4 mb-4">
                  <li>
                    {value.rich_text.map((text, i) => (
                      <span key={i}>{text.plain_text}</span>
                    ))}
                  </li>
                </ul>
              )
            case 'numbered_list_item':
              return (
                <ol key={id} className="list-decimal ml-4 mb-4">
                  <li>
                    {value.rich_text.map((text, i) => (
                      <span key={i}>{text.plain_text}</span>
                    ))}
                  </li>
                </ol>
              )
            case 'code':
              return (
                <pre key={id} className="bg-gray-100 p-4 rounded-lg mb-4">
                  <code>{value.rich_text.map((text, i) => text.plain_text).join('')}</code>
                </pre>
              )
            default:
              return null
          }
        })}
      </div>
    </article>
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

  if (!post) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      post,
      blocks,
    },
    revalidate: 60,
  }
} 