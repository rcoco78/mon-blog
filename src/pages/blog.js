import Layout from '../components/Layout'
import Link from 'next/link'
import { getAllPosts } from '../lib/notion'

export default function Blog({ posts }) {
  return (
    <Layout>
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section>
          <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Mon Blog</h1>
          <div>
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="post-link">
                <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
                  <p className="post-date">{post.date}</p>
                  <p className="post-title">{post.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  )
}

export async function getStaticProps() {
  const posts = await getAllPosts()

  return {
    props: {
      posts,
    },
    revalidate: 60,
  }
} 