import Link from 'next/link'
import Image from 'next/image'
import { getAllPosts } from '../lib/notion'
import { useState, useEffect } from 'react'
import { siteConfig } from '../lib/config'
import { getRecentTools } from '../lib/tools'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import ProjectClickCounter from '../components/ProjectClickCounter'

export default function Home({ posts }) {
  const [topPosts, setTopPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(siteConfig.metrics)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [keyResults, setKeyResults] = useState([])
  const [keyResultsLoading, setKeyResultsLoading] = useState(true)

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

  // Charger les métriques depuis l'API et enrichir avec les Key Results
  useEffect(() => {
    const fetchMetricsAndEnrich = async () => {
      try {
        setMetricsLoading(true)
        
        // Charger les métriques de base
        const metricsResponse = await fetch('/api/metrics?' + new Date().getTime())
        let baseMetrics = siteConfig.metrics
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json()
          if (metricsData.success && metricsData.metrics) {
            baseMetrics = metricsData.metrics
          }
        }
        
        // Charger les Key Results pour enrichir
        const keyResultsResponse = await fetch('/api/key-results')
        if (keyResultsResponse.ok) {
          const keyResultsData = await keyResultsResponse.json()
          setKeyResults(keyResultsData)
          
          // Calculer le CA total
          const caFreelanceKRs = keyResultsData.filter(kr => {
            const categoryLower = (kr.category || '').toLowerCase()
            const nameLower = (kr.name || '').toLowerCase()
            return (categoryLower.includes('freelance') || categoryLower.includes('freelancing')) &&
                   (nameLower.includes('ca') || nameLower.includes('chiffre')) &&
                   !nameLower.includes('affiliation') && !nameLower.includes('total')
          })
          const caFreelance = caFreelanceKRs.length > 0 
            ? Math.max(...caFreelanceKRs.map(kr => kr.targetResult || 0))
            : 0
          
          const caAffiliationKRs = keyResultsData.filter(kr => {
            const categoryLower = (kr.category || '').toLowerCase()
            const nameLower = (kr.name || '').toLowerCase()
            return (categoryLower.includes('affiliation') || categoryLower.includes('partenariats')) &&
                   (nameLower.includes('ca') || nameLower.includes('chiffre')) &&
                   !nameLower.includes('total')
          })
          const caAffiliation = caAffiliationKRs.length > 0
            ? Math.max(...caAffiliationKRs.map(kr => kr.targetResult || 0))
            : 0
          
          const caLogementAtypiqueKRs = keyResultsData.filter(kr => {
            const categoryLower = (kr.category || '').toLowerCase()
            const nameLower = (kr.name || '').toLowerCase()
            return (categoryLower.includes('logement') || categoryLower.includes('entrepreneurial')) &&
                   (nameLower.includes('ca') || nameLower.includes('chiffre')) &&
                   nameLower.includes('logement') && !nameLower.includes('total')
          })
          const caLogementAtypique = caLogementAtypiqueKRs.length > 0
            ? Math.max(...caLogementAtypiqueKRs.map(kr => kr.targetResult || 0))
            : 0
          
          const totalCA = caFreelance + caAffiliation + caLogementAtypique
          
          // Calculer la progression globale
          const totalKeyResults = keyResultsData.length
          const overallProgress = totalKeyResults > 0 
            ? Math.round(keyResultsData.reduce((sum, kr) => sum + (kr.progress || 0), 0) / totalKeyResults)
            : 0
          
          // Enrichir les métriques : remplacer certaines métriques basiques par des métriques plus intéressantes
          const enrichedMetrics = [...baseMetrics]
          
          // Remplacer "scrapers publics" par les abonnés Logement Atypique
          const abonnesKR = keyResultsData.find(kr => {
            const nameLower = (kr.name || '').toLowerCase()
            const categoryLower = (kr.category || '').toLowerCase()
            return (nameLower.includes('abonnés') || nameLower.includes('abonne')) &&
                   (categoryLower.includes('logement') || categoryLower.includes('entrepreneurial'))
          })
          
          if (abonnesKR && abonnesKR.currentResult) {
            const scrapersIndex = enrichedMetrics.findIndex(m => 
              m.label === 'scrapers publics' || m.source === 'sur Apify'
            )
            if (scrapersIndex >= 0) {
              enrichedMetrics[scrapersIndex] = {
                value: abonnesKR.currentResult.toString(),
                label: 'abonnés',
                source: 'Logement Atypique'
              }
            }
          }
          
          // Remplacer une métrique par le CA si disponible
          if (totalCA > 0) {
            const formatNumber = (num) => {
              if (num >= 1000) {
                return num.toLocaleString('fr-FR')
              }
              return num.toString()
            }
            const caMetric = {
              value: `${formatNumber(Math.round(totalCA / 1000))}k €`,
              label: 'CA objectif 2026',
              source: 'au cumulé'
            }
            // Remplacer la dernière métrique ou ajouter
            if (enrichedMetrics.length >= 4) {
              enrichedMetrics[3] = caMetric
            } else {
              enrichedMetrics.push(caMetric)
            }
          }
          
          // Ajouter la progression globale si significative
          if (overallProgress > 0 && enrichedMetrics.length < 4) {
            enrichedMetrics.push({
              value: `${overallProgress}%`,
              label: 'progression',
              source: 'objectifs 2026'
            })
          }
          
          setMetrics(enrichedMetrics.slice(0, 4))
        } else {
          // Si pas de key results, garder les métriques de base
          setMetrics(baseMetrics)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des métriques:', error)
        // Garder les métriques par défaut en cas d'erreur
      } finally {
        setMetricsLoading(false)
        setKeyResultsLoading(false)
      }
    }

    fetchMetricsAndEnrich()
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
      {/* Structured Data pour SEO */}
      <StructuredData 
        type="Service" 
        data={{
          name: 'Scraping et Automatisation',
          serviceType: 'Web Scraping, Data Automation, Outbound Marketing',
          description: 'Expert freelance en scraping web et automatisation. Création d\'outils sur-mesure pour extraire, structurer et exploiter vos données. 424+ projets réalisés via Malt et Fiverr.',
          offers: {
            '@type': 'Offer',
            availability: 'https://schema.org/InStock',
            priceCurrency: 'EUR',
            description: 'Services de scraping et automatisation sur-mesure'
          }
        }} 
      />
      <StructuredData 
        type="AggregateRating" 
        data={{
          ratingValue: '4.9',
          reviewCount: '270',
          bestRating: '5',
          worstRating: '1'
        }} 
      />
      <main className="flex-auto min-w-0 mt-6 flex flex-col mb-0">
      <section aria-label="Présentation">
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
        <p className="mb-6 text-neutral-900 dark:text-neutral-100 tracking-tight">
          Je transforme vos données web en opportunités business. Expert freelance en <strong>scraping</strong> et <strong>automatisation</strong>, je crée des outils sur-mesure pour extraire, structurer et exploiter vos données.
        </p>
        <p className="mb-8 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Le week-end, je développe <strong className="text-neutral-900 dark:text-neutral-100">Logement Atypique</strong> avec mon frère — on parcourt la France pour mettre en avant des logements d'exception.
        </p>
        
        {/* Métriques de confiance - Déplacées plus tôt sur mobile */}
        <div className="mb-8 md:mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3" aria-label="Métriques de confiance">
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
                <div className="text-2xl font-semibold mb-1 text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  {metric.label === 'projets réalisés' && metric.breakdown ? (
                    <>
                      {metric.value} <span className="text-base font-normal text-neutral-500 dark:text-neutral-500">({metric.breakdown.malt} + {metric.breakdown.fiverr})</span>
                    </>
                  ) : (
                    <>
                      {metric.value}
                      {metric.label === 'abonnés' && metric.source === 'Logement Atypique' && (
                        <a 
                          href="https://www.instagram.com/logement.atypique" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center hover:opacity-70 transition-opacity text-neutral-400 dark:text-neutral-500"
                          aria-label="Instagram Logement Atypique"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="bi bi-instagram" viewBox="0 0 16 16">
                            <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
                          </svg>
                        </a>
                      )}
                    </>
                  )}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">{metric.label}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">{metric.source}</div>
              </div>
            ))
          )}
          </div>
          <div className="text-center">
            <Link 
              href="/donnees-publiques"
              className="text-sm font-normal text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
            >
              Voir toutes les données publiques
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
              </svg>
            </Link>
          </div>
        </div>
        
        {/* Carousel de témoignages */}
        <section className="mb-6 relative" aria-label="Témoignages clients">
          <div className="relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50" aria-live="polite" aria-atomic="true">
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
          
          {/* Lien vers la page complète */}
          <div className="mt-4 text-center">
            <Link
              href="/temoignages"
              className="text-sm font-normal text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
            >
              Voir tous les témoignages
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
              </svg>
            </Link>
          </div>
        </section>
      </section>
      <section className="mt-8" aria-label="Projets">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Projets</h2>
        <div className="flex flex-col space-y-4">
          {siteConfig.projects.filter(project => project.status === 'active').map((project, index) => {
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
                    <div className="flex-shrink-0 w-6 h-6">
                      <Image
                        src={project.image}
                        alt={project.imageAlt || `${project.title} - ${project.description}`}
                        width={24}
                        height={24}
                        loading="lazy"
                        className={`w-6 h-6 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800 ${!isActive ? 'opacity-50 grayscale' : ''}`}
                      />
                    </div>
                  ) : project.icon ? (
                    project.icon.startsWith('/') ? (
                      <div className="flex-shrink-0 w-6 h-6">
                        <Image
                          src={project.icon}
                          alt={project.iconAlt || `${project.title} - ${project.description}`}
                          width={24}
                          height={24}
                          loading="lazy"
                          className={`w-6 h-6 rounded-lg object-contain ${!isActive ? 'opacity-50 grayscale' : ''}`}
                        />
                      </div>
                    ) : (
                      <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center text-xl leading-none ${!isActive ? 'opacity-50' : ''}`}>
                        {project.icon}
                      </div>
                    )
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className={`font-medium flex items-center gap-2 ${isActive ? '' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {project.title}
                        {project.status === 'active' && (
                          <span className="relative flex h-2 w-2" title="Projet actif">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        )}
                      </h3>
                      {project.status !== 'active' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                          project.status === 'paused' 
                            ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}>
                          {project.status === 'paused' ? 'En pause' : 'Arrêté'}
                        </span>
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
        <div className="mt-4 text-center">
          <Link
            href="/a-propos"
            className="text-sm font-medium text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
          >
            Voir tous les projets (y compris arrêtés)
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
            </svg>
          </Link>
        </div>
      </section>
      
      {/* Section Outils récents */}
      <section className="mt-12" aria-label="Outils récents">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Outils récents</h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Outils gratuits que j'ai développés et que je mets à disposition — générateurs, extracteurs et templates pour vous aider dans votre quotidien.
        </p>
        <div className="flex flex-col space-y-4">
          {getRecentTools(3).map((tool) => (
            <Link
              key={tool.name}
              href={tool.link}
              className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group min-h-[96px]"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {tool.iconSvg ? (
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                    {tool.iconSvg === 'email' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                        <path d="M8.47 1.318a1 1 0 0 0-.94 0l-6 3.2A1 1 0 0 0 1 5.4v.817l5.75 3.45L8 8.917l1.25.75L15 6.217V5.4a1 1 0 0 0-.53-.882zM15 7.383l-4.778 2.867L15 13.117zm-.035 6.88L8 10.082l-6.965 4.18A1 1 0 0 0 2 15h12a1 1 0 0 0 .965-.738ZM1 13.116l4.778-2.867L1 7.383v5.734ZM7.059.435a2 2 0 0 1 1.882 0l6 3.2A2 2 0 0 1 16 5.4V14a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5.4a2 2 0 0 1 1.059-1.765z"/>
                      </svg>
                    )}
                    {tool.iconSvg === 'search' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                      </svg>
                    )}
                    {tool.iconSvg === 'house' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                        <path d="M8 6.982C9.664 5.309 13.825 8.236 8 12 2.175 8.236 6.336 5.309 8 6.982"/>
                        <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.707L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.646a.5.5 0 0 0 .708-.707L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>
                      </svg>
                    )}
                    {tool.iconSvg === 'grid' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm15 2h-4v3h4zm0 4h-4v3h4zm0 4h-4v3h3a1 1 0 0 0 1-1zm-5 3v-3H6v3zm-5 0v-3H1v2a1 1 0 0 0 1 1zm-4-4h4V7H1zm0-4h4V3H1a1 1 0 0 0-1 1zm5 0v3h4V3zm4 4H6v3h4z"/>
                      </svg>
                    )}
                  </div>
                ) : tool.icon && tool.icon.startsWith('/') ? (
                  <div className="flex-shrink-0 w-6 h-6">
                    <Image
                      src={tool.icon}
                      alt={`${tool.name} - ${tool.description}`}
                      width={24}
                      height={24}
                      loading="lazy"
                      className="w-6 h-6 rounded-lg object-contain"
                    />
                  </div>
                ) : null}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-medium">
                      {tool.name}
                    </h3>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex items-center transition-all group-hover:text-neutral-800 dark:group-hover:text-neutral-200 flex-shrink-0 ml-2">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/outils"
            className="text-sm font-medium text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
          >
            Voir tous les outils
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
            </svg>
          </Link>
        </div>
      </section>
      
      {/* Section Articles récents */}
      <section className="mt-12" aria-label="Articles récents">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Articles récents</h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Réflexions sur le scraping, l'automatisation, l'entrepreneuriat, le freelance et le voyage.
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
          topPosts.map((post) => {
            const isNew = new Date(post.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
                className="post-link group"
            >
                <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2 transition-all group-hover:translate-x-1">
                <div className="flex flex-col md:flex-row md:items-center w-full">
                  <div className="flex-shrink-0">
                    <p className="post-date whitespace-nowrap">{new Date(post.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                    <span className="hidden md:inline-block w-0.5 h-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500 mx-2 flex-shrink-0"></span>
                    <div className="flex-grow md:max-w-[60%] md:ml-0">
                      <p className="post-title truncate flex items-center gap-2">
                        {post.title}
                        {isNew && (
                          <span className="text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2 py-0.5 rounded-full flex-shrink-0">
                            Nouveau
                          </span>
                        )}
                      </p>
                  </div>
                  <div className="md:ml-auto flex-shrink-0">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">{post.views} vues</span>
                  </div>
                </div>
              </div>
            </Link>
            )
          })
        ) : (
          <p className="text-neutral-600 dark:text-neutral-400">Aucun article disponible pour le moment.</p>
        )}
        </div>
      </section>
      
      {/* CTA avant footer */}
      <section className="mt-12 mb-8 text-center" aria-label="Navigation vers le blog">
        <Link
          href="/blog"
          className="text-sm font-medium text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
        >
          Voir tous les articles
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
          </svg>
        </Link>
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