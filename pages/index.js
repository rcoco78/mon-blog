import Link from 'next/link'
import { getAllPosts } from '../lib/notion'
import ViewCounter from '../components/ViewCounter'
import { useState, useEffect } from 'react'

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
  const [topPosts, setTopPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchViews = async () => {
      try {
        // Récupérer toutes les vues en une seule requête
        const slugs = posts.map(post => post.slug).join(',')
        const response = await fetch(`/api/views/all?slugs=${slugs}`)
        const viewsMap = await response.json()
        
        // Ajouter les vues aux articles et trier
        const postsWithViews = posts.map(post => ({
          ...post,
          views: viewsMap[post.slug] || 0
        }))
        
        // Trier par nombre de vues (ordre décroissant) et prendre les 3 premiers
        const sortedPosts = postsWithViews
          .sort((a, b) => b.views - a.views)
          .slice(0, 3)
        
        setTopPosts(sortedPosts)
        setLoading(false)
      } catch (error) {
        console.error('Erreur lors de la récupération des vues:', error)
        setLoading(false)
      }
    }

    fetchViews()
  }, [posts])

  return (
    <main className="flex-auto min-w-0 mt-6 flex flex-col px-2 md:px-0">
      <section>
        <div>
          <img
            src="/images/profile.jpg"
            alt="Corentin Robert"
            className="w-16 h-16 rounded-full object-cover mb-4 border-2 border-neutral-200 dark:border-neutral-800"
          />
          <h1 className="font-semibold text-2xl mb-6 tracking-tighter">Mon Blog</h1>
        </div>
        <p className="mb-8 text-neutral-900 dark:text-neutral-100 tracking-tight">
          Je partage ici mes réflexions sur le développement web, mes expériences de voyage et mes découvertes technologiques. Un mélange de technique et de vie personnelle qui reflète mon parcours.
        </p>
        <div className="space-y-4">
          {loading ? (
            <p>Chargement des articles populaires...</p>
          ) : topPosts.length > 0 ? (
            topPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="post-link"
              >
                <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
                  <div className="flex flex-col md:flex-row md:items-center w-full">
                    <div className="flex-shrink-0">
                      <p className="post-date whitespace-nowrap">{new Date(post.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <span className="hidden md:inline text-neutral-400 dark:text-neutral-600 mx-2">·</span>
                    <div className="flex-grow md:max-w-[60%]">
                      <p className="post-title truncate">{post.title}</p>
                    </div>
                    <div className="md:ml-auto flex-shrink-0">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">{post.views} vues</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p>Aucun article disponible pour le moment.</p>
          )}
        </div>
      </section>
      <section className="mt-12">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Mes Projets</h2>
        <div className="flex flex-col space-y-4">
          <a 
            href="https://www.outreacher.fr/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
          >
            <div>
              <h3 className="font-medium">Outreacher</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Agence d'outbound marketing
              </p>
            </div>
            <div className="flex items-center transition-all group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
              </svg>
            </div>
          </a>
          <a 
            href="https://datareacher.webflow.io/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
          >
            <div>
              <h3 className="font-medium">Datareacher</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Mise à disposition de bases de données
              </p>
            </div>
            <div className="flex items-center transition-all group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
              </svg>
            </div>
          </a>
          <a 
            href="#" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
          >
            <div>
              <h3 className="font-medium">Immoreacher</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Agence de création de contenus pour les agences immo
              </p>
            </div>
            <div className="flex items-center transition-all group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
              </svg>
            </div>
          </a>
        </div>
      </section>
    </main>
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