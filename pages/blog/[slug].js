import { getPostBlocks, getPostBySlug, getAllPosts } from '../../lib/notion'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import ViewCounter from '../../components/ViewCounter'
import Newsletter from '../../components/Newsletter'
import Block from '../../components/Block'
import Tag from '../../components/Tag'
import RelatedPosts from '../../components/RelatedPosts'

export default function Post({ post, blocks, allPosts }) {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Chargement...</div>
  }

  if (!post || !blocks) {
    return <div>Article non trouvé</div>
  }

  return (
    <article className="flex-auto min-w-0 mt-6 flex flex-col">
      <header className="flex flex-col">
        <h1 className="font-semibold text-2xl mb-2 tracking-tighter">
          {post.title}
        </h1>
        <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400 mb-8">
          <time dateTime={post.date}>{post.date}</time>
          <span>•</span>
          <ViewCounter slug={post.slug} />
          <span>•</span>
          <div className="flex items-center">
            {post.tags.map(tag => (
              <Tag
                key={tag}
                name={tag}
                isActive={false}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="prose dark:prose-invert max-w-none">
        {blocks.map((block, index) => (
          <Block key={block.id} block={block} />
        ))}
      </div>

      <RelatedPosts currentPost={post} allPosts={allPosts} />

      <div className="mt-12">
        <Newsletter />
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