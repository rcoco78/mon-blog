import Layout from '../components/Layout'
import Link from 'next/link'
import { getAllPosts } from '../lib/notion'

const mockProjects = [
  {
    id: 'outreacher',
    title: 'Outreacher',
    subtitle: 'Agence d\'outbound marketing',
    link: 'https://www.outreacher.fr/'
  },
  {
    id: 'datareacher',
    title: 'Datareacher',
    subtitle: 'Mise à disposition de bases de données',
    link: 'https://datareacher.webflow.io/'
  },
  {
    id: 'immoreacher',
    title: 'Immoreacher',
    subtitle: 'Agence de création de contenus pour les agences immo',
    link: '#'
  }
]

export default function Home({ posts }) {
  return (
    <Layout>
      <main className="flex-auto min-w-0 mt-6 flex flex-col px-2 md:px-0">
        <section>
          <div className="flex flex-col items-center mb-8">
            <img
              src="/images/profile.svg"
              alt="Corentin Robert"
              className="w-32 h-32 rounded-full object-cover mb-4 border-2 border-neutral-200 dark:border-neutral-800"
            />
            <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Mon Blog</h1>
          </div>
          <p className="mb-8 text-neutral-900 dark:text-neutral-100 tracking-tight">
            Je partage ici mes réflexions sur le développement web, mes expériences de voyage et mes découvertes technologiques. Un mélange de technique et de vie personnelle qui reflète mon parcours.
          </p>
          <div className="space-y-4">
            {posts.slice(0, 3).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="flex flex-col"
              >
                <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
                  <p className="text-neutral-600 dark:text-neutral-400 w-[100px] tabular-nums">
                    {post.date}
                  </p>
                  <p className="text-neutral-900 dark:text-neutral-100 tracking-tight">
                    {post.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Mes Projets</h2>
          <div className="space-y-6 max-w-xl">
            {mockProjects.map((project) => (
              <Link key={project.id} href={project.link} className="group block" target="_blank" rel="noopener noreferrer">
                <div className="relative h-20 bg-transparent dark:bg-transparent rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 p-6 flex flex-col justify-center">
                    <h3 className="text-neutral-900 dark:text-neutral-100 text-xl font-semibold mb-1">{project.title}</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">{project.subtitle}</p>
                  </div>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <svg className="w-6 h-6 text-neutral-600 dark:text-neutral-400 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
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