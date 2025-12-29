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
  const [metrics, setMetrics] = useState(siteConfig.metrics)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [testimonialIndex, setTestimonialIndex] = useState(0)

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

  // Charger les métriques depuis l'API
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setMetricsLoading(true)
        const response = await fetch('/api/metrics?' + new Date().getTime())
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.metrics) {
            setMetrics(data.metrics)
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des métriques:', error)
        // Garder les métriques par défaut en cas d'erreur
      } finally {
        setMetricsLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  // Auto-rotation du carousel de témoignages
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % 3)
    }, 5000) // Change toutes les 5 secondes

    return () => clearInterval(interval)
  }, [])

  // Charger les scripts Calendly
  useEffect(() => {
    // Vérifier si les scripts sont déjà chargés
    if (document.querySelector('link[href*="calendly.com"]')) {
      return
    }

    // Charger le CSS
    const link = document.createElement('link')
    link.href = 'https://assets.calendly.com/assets/external/widget.css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    // Charger le JS
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.type = 'text/javascript'
    script.async = true
    document.body.appendChild(script)
  }, [])

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
          Je transforme vos données web en opportunités business. Consultant freelance spécialisé en <strong>scraping</strong> et <strong>automatisation</strong>, je crée des solutions sur-mesure pour extraire, structurer et exploiter vos données. Le week-end, je développe <strong className="text-neutral-900 dark:text-neutral-100">Logement Atypique</strong> avec mon frère — on filme des logements d'exception.
        </p>
        
        {/* Métriques de confiance - Déplacées plus tôt sur mobile */}
        <div className="mb-8 md:mb-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricsLoading ? (
            // Skeleton pendant le chargement
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div className="h-8 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
              </div>
            ))
          ) : (
            metrics.map((metric, index) => (
              <div key={index} className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div className="text-2xl font-semibold mb-1 text-neutral-900 dark:text-neutral-100">
                  {metric.label === 'projets réalisés' && metric.breakdown ? (
                    <>
                      {metric.value} <span className="text-base font-normal text-neutral-500 dark:text-neutral-500">({metric.breakdown.malt} + {metric.breakdown.fiverr})</span>
                    </>
                  ) : (
                    metric.value
                  )}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">{metric.label}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">{metric.source}</div>
              </div>
            ))
          )}
        </div>
        
        {/* Carousel de témoignages */}
        <div className="mb-8 md:mb-12 relative">
          <div className="relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${testimonialIndex * 100}%)` }}
            >
              {/* Témoignage LinkedIn */}
              <div className="min-w-full p-4 flex flex-col min-h-[180px]">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 italic mb-3 leading-relaxed flex-1">
                  "J'ai eu le plaisir de travailler avec Corentin dans le cadre de l'automatisation de plusieurs tâches. Très à l'écoute, il a su comprendre et détecter nos besoins immédiatement, avec une vraie capacité d'analyse et une grande efficacité dans la mise en œuvre. Super compétent, réactif et force de proposition, Corentin a clairement apporté de la valeur dès le départ."
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">Adnane Amahou</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Responsable CX @ NGI</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">LinkedIn</span>
                </div>
              </div>
              
              {/* Témoignage Malt */}
              <div className="min-w-full p-4 flex flex-col min-h-[180px]">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 italic mb-3 leading-relaxed flex-1">
                  "Très professionnel dans les échanges et a respecté à la fois la demande et les délais. Corentin a aussi été très clair sur ce qu'il allait faire dès le départ, évitant les déceptions ou mauvaises surprises. Je recommande."
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">Denis</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Inovesta</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400">Malt</span>
                </div>
              </div>
              
              {/* Témoignage Fiverr */}
              <div className="min-w-full p-4 flex flex-col min-h-[180px]">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 italic mb-3 leading-relaxed flex-1">
                  "Corentin did an excellent job and my cooperation with him was smooth and easy. He delivered what he promised, he was very open and quick to discuss revisions and delivered even them in no time. My project was not a simple one, as it required collecting information from different places. I'm 100% satisfied with the result."
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">lampro74</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Belgique</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Fiverr</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Indicateurs de navigation */}
          <div className="flex justify-center gap-2 mt-4">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => setTestimonialIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  testimonialIndex === index
                    ? 'w-6 bg-neutral-900 dark:bg-neutral-100'
                    : 'w-1.5 bg-neutral-300 dark:bg-neutral-700'
                }`}
                aria-label={`Aller au témoignage ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* CTA discret */}
        <div className="mb-6 text-center">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (typeof window !== 'undefined' && window.Calendly) {
                window.Calendly.initPopupWidget({
                  url: 'https://calendly.com/corentinrobert/20min'
                })
              } else {
                // Fallback si Calendly n'est pas encore chargé
                window.open('https://calendly.com/corentinrobert/20min', '_blank')
              }
              return false
            }}
            className="inline-flex items-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Discutons de votre projet
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1.5 transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
            </svg>
          </a>
        </div>
      </section>
      <section className="mt-8">
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
              className: 'relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group min-h-[96px]'
            } : {
              className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 min-h-[96px]'
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
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
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
                    {project.link && project.id && (
                      <div className="sm:hidden mt-1.5">
                        <ProjectClickCounter projectId={project.id} />
                      </div>
                    )}
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
      
      {/* Section Articles récents */}
      <section className="mt-12">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Articles récents</h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Je partage ici mes réflexions, ce que je fais, et quelques outils que je mets à disposition.
        </p>
        <div className="space-y-4">
          {loading ? (
            // Skeleton pour les articles
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
                <div className="flex flex-col md:flex-row md:items-center w-full">
                  <div className="flex-shrink-0 mb-2 md:mb-0">
                    <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                  </div>
                  <div className="flex-grow md:max-w-[60%] md:ml-4 mb-2 md:mb-0">
                    <div className="h-5 w-full md:w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                  </div>
                  <div className="md:ml-auto flex-shrink-0">
                    <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))
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