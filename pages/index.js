import Link from 'next/link'
import Image from 'next/image'
import { getAllPosts } from '../lib/notion'
import { useState, useEffect } from 'react'
import { siteConfig } from '../lib/config'
import SEOHead from '../components/seo/SEOHead'
import { generatePageSEO } from '../lib/seo'
import ProjectClickCounter from '../components/ProjectClickCounter'

export default function Home({ posts }) {
  const [topPosts, setTopPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchViews = async () => {
      // Vérifier que posts existe et n'est pas vide
      if (!posts || posts.length === 0) {
        setTopPosts([])
        setLoading(false)
        return
      }

      try {
        // Récupérer toutes les vues en une seule requête
        const slugs = posts.map(post => post.slug).join(',')
        const response = await fetch(`/api/views/all?slugs=${slugs}`)
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des vues')
        }
        
        const viewsMap = await response.json()
        
        // Ajouter les vues aux articles et trier
        const postsWithViews = posts.map(post => ({
          ...post,
          views: viewsMap[post.slug] || 0
        }))
        
        // Trier par nombre de vues (ordre décroissant) et prendre les 3 premiers
        const sortedPosts = postsWithViews
          .sort((a, b) => b.views - a.views)
          .slice(0, siteConfig.homepage.topPostsCount)
        
        setTopPosts(sortedPosts)
        setLoading(false)
      } catch (error) {
        console.error('Erreur lors de la récupération des vues:', error)
        // Fallback : afficher les articles sans les vues
        const fallbackPosts = posts
          .slice(0, siteConfig.homepage.topPostsCount)
          .map(post => ({ ...post, views: 0 }))
        setTopPosts(fallbackPosts)
        setLoading(false)
      }
    }

    fetchViews()
  }, [posts])

  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.home.title,
    description: siteConfig.seo.pages.home.description,
    path: '/',
    keywords: siteConfig.seo.pages.home.keywords
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      <main className="flex-auto min-w-0 mt-6 flex flex-col mb-0">
      <section>
        <div>
          <Image
            src="/images/profile.jpg"
            alt="Photo de profil de Corentin Robert"
            width={64}
            height={64}
            className="w-16 h-16 rounded-full object-cover mb-4 border-2 border-neutral-200 dark:border-neutral-800"
            priority
          />
          <h1 className="font-semibold text-2xl mb-6 tracking-tighter">Corentin Robert</h1>
        </div>
        <p className="mb-8 text-neutral-900 dark:text-neutral-100 tracking-tight">
          Je suis consultant freelance spécialisé en <strong>scraping</strong> et <strong>automatisation</strong>. J'aide les entreprises à récupérer et exploiter leurs données web avec des solutions sur-mesure.
        </p>
        <p className="mb-8 text-neutral-600 dark:text-neutral-400 tracking-tight">
          J'ai travaillé chez <strong className="text-neutral-900 dark:text-neutral-100">Airbnb</strong> et <strong className="text-neutral-900 dark:text-neutral-100">Shine</strong>. Aujourd'hui, je développe <strong className="text-neutral-900 dark:text-neutral-100">Logement Atypique</strong> avec mon frère — on filme des logements d'exception le week-end.
        </p>
        <p className="mb-8 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Je partage ici mes réflexions, ce que je fais, et quelques outils que je mets à disposition.
        </p>
        
        {/* Section Maintenant */}
        <div className="mb-12 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <h2 className="font-semibold text-lg mb-4 tracking-tighter">Maintenant</h2>
          <p className="mb-3 text-neutral-900 dark:text-neutral-100 tracking-tight">
            Actuellement, je me concentre sur :
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li className="flex items-start">
              <span className="mr-2">→</span>
              <span className="flex items-center gap-1.5">
                Développement de 
                <Image
                  src="/images/logement-atypique-icon.svg"
                  alt="Logo Logement Atypique"
                  width={16}
                  height={16}
                  className="inline-block w-4 h-4"
                />
                <strong className="text-neutral-900 dark:text-neutral-100">Logement Atypique</strong> avec mon frère
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">→</span>
              <span>Création de <strong className="text-neutral-900 dark:text-neutral-100">scrapers sur-mesure</strong> pour mes clients</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">→</span>
              <span>Accompagnement d'entreprises en <strong className="text-neutral-900 dark:text-neutral-100">outbound automatisé</strong></span>
            </li>
          </ul>
        </div>

        {/* Métriques de confiance */}
        <div className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {siteConfig.metrics.map((metric, index) => (
            <div key={index} className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <div className="text-2xl font-semibold mb-1 text-neutral-900 dark:text-neutral-100">{metric.value}</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">{metric.label}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">{metric.source}</div>
            </div>
          ))}
        </div>
        
        {/* Section Articles récents */}
        <div className="mt-12">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Articles récents</h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-neutral-600 dark:text-neutral-400">Chargement des articles populaires...</p>
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
                    <div className="flex-grow md:max-w-[60%] md:ml-4">
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
            <p className="text-neutral-600 dark:text-neutral-400">Aucun article disponible pour le moment.</p>
          )}
          </div>
        </div>
      </section>
      <section className="mt-12">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Projets</h2>
        <div className="flex flex-col space-y-4">
          {siteConfig.projects.map((project, index) => {
            const isActive = project.status === 'active'
            const Component = project.link ? 'a' : 'div'
            
            const handleClick = async (e) => {
              if (project.link && project.id) {
                // Tracker le clic de manière asynchrone sans bloquer la navigation
                // Utiliser sendBeacon pour garantir l'envoi même si la page se ferme
                const timestamp = Date.now()
                const data = JSON.stringify({ projectId: project.id, timestamp })
                
                // Essayer sendBeacon d'abord (plus fiable pour les clics)
                if (navigator.sendBeacon) {
                  const blob = new Blob([data], { type: 'application/json' })
                  navigator.sendBeacon(`/api/projects/click?t=${timestamp}`, blob)
                } else {
                  // Fallback sur fetch
                  fetch(`/api/projects/click?t=${timestamp}`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Cache-Control': 'no-cache',
                    },
                    body: data,
                    keepalive: true, // Important pour les requêtes après navigation
                  }).catch(err => console.error('Error tracking click:', err))
                }
              }
            }

            const props = project.link ? {
              href: project.link,
              target: '_blank',
              rel: 'noopener noreferrer',
              onClick: handleClick,
              className: 'relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group'
            } : {
              className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50'
            }

            return (
              <Component key={index} {...props}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {project.image ? (
                    <div className="flex-shrink-0">
                      <Image
                        src={project.image}
                        alt={project.imageAlt || `${project.title} - ${project.description}`}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800"
                      />
                    </div>
                  ) : project.icon ? (
                    project.icon.startsWith('/') ? (
                      <div className="flex-shrink-0">
                        <Image
                          src={project.icon}
                          alt={project.iconAlt || `${project.title} - ${project.description}`}
                          width={24}
                          height={24}
                          className="w-6 h-6"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 text-2xl">
                        {project.icon}
                      </div>
                    )
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap relative pr-20 sm:pr-0">
                      <h3 className={`font-medium ${isActive ? '' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {project.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        project.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}>
                        {project.status === 'active' ? 'Actif' : project.status === 'paused' ? 'En pause' : 'Arrêté'}
                      </span>
                      {project.link && project.id && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 sm:hidden flex items-center">
                          <ProjectClickCounter projectId={project.id} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                      <p className={`${isActive ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-500 dark:text-neutral-400'} text-sm`}>
                        {project.description}
                      </p>
                      {project.link && project.id && (
                        <div className="hidden sm:flex flex-shrink-0">
                          <ProjectClickCounter projectId={project.id} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {project.link && (
                  <div className="hidden sm:flex items-center transition-all group-hover:text-neutral-800 dark:group-hover:text-neutral-200 flex-shrink-0 ml-2">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                    </svg>
                  </div>
                )}
              </Component>
            )
          })}
        </div>
      </section>
    </main>
    </>
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