import Link from 'next/link'
import Image from 'next/image'
import { getAllPosts } from '../lib/notion'
import { useState, useEffect, useRef } from 'react'
import { siteConfig } from '../lib/config'
import { getRecentTools } from '../lib/tools'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import ProjectClickCounter from '../components/ProjectClickCounter'

// Fonction helper pour obtenir le logo d'une entreprise
const getCompanyLogo = (companyName) => {
  if (!companyName) return null
  const nameLower = companyName.toLowerCase()
  
  // Mapping des entreprises aux logos disponibles
  const logoMap = {
    'ngi': '/images/logos/ngi.png',
    'inovesta': '/images/logos/vibe-2025-07-01.webp', // À ajuster si tu as le logo Inovesta
    'kent': '/images/logos/lloyd & davis.png', // À ajuster si tu as le logo Kent
    'assursafe': '/images/logos/assursafe.jpeg',
  }
  
  // Chercher une correspondance partielle
  for (const [key, logo] of Object.entries(logoMap)) {
    if (nameLower.includes(key)) {
      return logo
    }
  }
  
  return null
}

export default function Home({ posts }) {
  const [topPosts, setTopPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(siteConfig.metrics)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [keyResults, setKeyResults] = useState([])
  const [keyResultsLoading, setKeyResultsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [currentTestimonialScrollIndex, setCurrentTestimonialScrollIndex] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [videoSeen, setVideoSeen] = useState(false)
  const testimonialScrollRef = useRef(null)

  // URL de la vidéo YouTube verticale (à remplacer par votre URL)
  const videoUrl = 'https://www.youtube.com/shorts/YOUR_VIDEO_ID' // À remplacer
  const videoId = videoUrl.includes('/shorts/') ? videoUrl.split('/shorts/')[1]?.split('?')[0] : null

  // Vérifier si la vidéo a déjà été vue
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('profileVideoSeen') === 'true'
      setVideoSeen(seen)
    }
  }, [])

  // Ouvrir la popup vidéo
  const handleVideoClick = () => {
    setShowVideo(true)
  }

  // Marquer la vidéo comme vue quand on ferme la popup (après avoir regardé)
  const handleCloseVideo = () => {
    setShowVideo(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('profileVideoSeen', 'true')
      setVideoSeen(true)
    }
  }

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
          // Chercher le KR principal de chaque catégorie (celui qui représente le CA total)
          
          // CA Freelance : chercher le KR principal (le plus grand ou celui avec "total")
          const caFreelanceKRs = keyResultsData.filter(kr => {
            const categoryLower = (kr.category || '').toLowerCase()
            const nameLower = (kr.name || '').toLowerCase()
            return (categoryLower.includes('freelance') || categoryLower.includes('freelancing')) &&
                   (nameLower.includes('ca') || nameLower.includes('chiffre')) &&
                   !nameLower.includes('affiliation')
          })
          
          // Prendre le KR avec "total" s'il existe, sinon le plus grand
          const caFreelanceTotalKR = caFreelanceKRs.find(kr => {
            const nameLower = (kr.name || '').toLowerCase()
            return nameLower.includes('total')
          })
          
          let caFreelance = 0
          if (caFreelanceTotalKR) {
            caFreelance = caFreelanceTotalKR.targetResult || 0
          } else if (caFreelanceKRs.length > 0) {
            // Prendre le plus grand si pas de "total"
            caFreelance = Math.max(...caFreelanceKRs.map(kr => kr.targetResult || 0))
          }
          
          // CA Affiliation : chercher le KR principal (le plus grand ou celui avec "total")
          const caAffiliationKRs = keyResultsData.filter(kr => {
            const categoryLower = (kr.category || '').toLowerCase()
            const nameLower = (kr.name || '').toLowerCase()
            return (categoryLower.includes('affiliation') || categoryLower.includes('partenariats')) &&
                   (nameLower.includes('ca') || nameLower.includes('chiffre') || nameLower.includes('revenus'))
          })
          
          // Prendre le KR avec "total" s'il existe, sinon additionner tous les revenus d'affiliation
          const caAffiliationTotalKR = caAffiliationKRs.find(kr => {
            const nameLower = (kr.name || '').toLowerCase()
            return nameLower.includes('total')
          })
          
          let caAffiliation = 0
          if (caAffiliationTotalKR) {
            caAffiliation = caAffiliationTotalKR.targetResult || 0
          } else if (caAffiliationKRs.length > 0) {
            // Additionner tous les revenus d'affiliation (Apify, Lemlist, Zapmail, etc.)
            caAffiliation = caAffiliationKRs.reduce((sum, kr) => sum + (kr.targetResult || 0), 0)
          }
          
          // CA Logement Atypique : chercher le KR avec "ARR" (Annual Recurring Revenue)
          const caLogementAtypiqueKRs = keyResultsData.filter(kr => {
            const categoryLower = (kr.category || '').toLowerCase()
            const nameLower = (kr.name || '').toLowerCase()
            return (categoryLower.includes('logement') || categoryLower.includes('entrepreneurial')) &&
                   (nameLower.includes('arr') || nameLower.includes('ca') || nameLower.includes('chiffre')) &&
                   nameLower.includes('logement')
          })
          
          // Prendre le KR avec "ARR" s'il existe, sinon le plus grand
          const caLogementAtypiqueTotalKR = caLogementAtypiqueKRs.find(kr => {
            const nameLower = (kr.name || '').toLowerCase()
            return nameLower.includes('arr')
          })
          
          let caLogementAtypique = 0
          if (caLogementAtypiqueTotalKR) {
            caLogementAtypique = caLogementAtypiqueTotalKR.targetResult || 0
          } else if (caLogementAtypiqueKRs.length > 0) {
            // Prendre le plus grand si pas d'ARR
            caLogementAtypique = Math.max(...caLogementAtypiqueKRs.map(kr => kr.targetResult || 0))
          }
          
          const totalCA = caFreelance + caAffiliation + caLogementAtypique
          
          // Debug pour vérifier les valeurs
          console.log('🔍 Debug CA Total:', {
            caFreelance,
            caAffiliation,
            caLogementAtypique,
            totalCA,
            caFreelanceKRs: caFreelanceKRs.map(kr => ({ name: kr.name, target: kr.targetResult })),
            caAffiliationKRs: caAffiliationKRs.map(kr => ({ name: kr.name, target: kr.targetResult })),
            caLogementAtypiqueKRs: caLogementAtypiqueKRs.map(kr => ({ name: kr.name, target: kr.targetResult }))
          })
          
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

  // Détecter si on est sur mobile
  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)
    return () => window.removeEventListener('resize', updateIsMobile)
  }, [])

  // Auto-rotation désactivée - utilisation du scroll uniquement

  // Gérer le scroll et mettre à jour les indicateurs pour témoignages
  useEffect(() => {
    const container = testimonialScrollRef.current
    if (!container) return
    
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const containerWidth = container.clientWidth
      
      // Chaque élément fait 100% de la largeur (mobile et desktop)
      const itemWidth = containerWidth
      const index = Math.round(scrollLeft / itemWidth)
      const maxIndex = 2 // 3 témoignages au total
      const clampedIndex = Math.min(Math.max(0, index), maxIndex)
      
      if (isMobile) {
        setCurrentTestimonialScrollIndex(clampedIndex)
      } else {
        setTestimonialIndex(clampedIndex)
      }
    }

    // Appeler handleScroll immédiatement pour synchroniser l'état initial
    handleScroll()
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isMobile])

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
      {/* Review Schema 5* par défaut pour le service */}
      <StructuredData
        type="Review"
        data={{
          itemReviewed: {
            '@type': 'Service',
            name: 'Scraping et Automatisation',
            provider: {
              '@type': 'Person',
              name: siteConfig.author,
              url: siteConfig.url
            }
          },
          reviewRating: {
            '@type': 'Rating',
            ratingValue: '5',
            bestRating: '5',
            worstRating: '1'
          },
          author: {
            '@type': 'Person',
            name: 'Client satisfait'
          },
          reviewBody: 'Expert freelance en scraping et automatisation. 424+ projets réalisés avec 270+ avis positifs. Livraison en 7 jours, résultats garantis.',
          datePublished: new Date().toISOString().split('T')[0]
        }}
      />
      
      <StructuredData 
        type="AggregateRating" 
        data={{
          ratingValue: '5',
          reviewCount: '270',
          bestRating: '5',
          worstRating: '1'
        }} 
      />
      {/* Review Schema individuelles pour Google Search Console (Extraits d'avis) */}
      <StructuredData
        type="Review"
        data={{
          authorName: 'Adnane Amahou',
          reviewBody: "J'ai eu le plaisir de travailler avec Corentin dans le cadre de l'automatisation de plusieurs tâches. Très à l'écoute, il a su comprendre et détecter nos besoins immédiatement, avec une vraie capacité d'analyse et une grande efficacité dans la mise en œuvre. Super compétent, réactif et force de proposition, Corentin a clairement apporté de la valeur dès le départ.",
          ratingValue: '5',
          datePublished: '2024-01-15',
          serviceName: 'Services de Scraping et Automatisation'
        }}
      />
      <StructuredData
        type="Review"
        data={{
          authorName: 'Mohamed-Amine Zaghdoud',
          reviewBody: "Prestation de scraping impeccable : compréhension rapide du besoin, extraction propre et structurée, délais respectés. Les données livrées sont exploitables immédiatement (format clair, colonnes cohérentes, pas de doublons). Communication fluide et réactif tout au long du projet.",
          ratingValue: '5',
          datePublished: '2024-01-05',
          serviceName: 'Services de Scraping et Automatisation'
        }}
      />
      <StructuredData
        type="Review"
        data={{
          authorName: 'Hugues Chavrier',
          reviewBody: "Nous avons travaillé à plusieurs reprises avec Corentin qui est très professionnel, rigoureux et à l'écoute de nos besoins. Je le recommande !",
          ratingValue: '5',
          datePublished: '2023-12-15',
          serviceName: 'Services de Scraping et Automatisation'
        }} 
      />
      <main className="flex-auto min-w-0 mt-6 flex flex-col mb-0">
      <section aria-label="Présentation">
        <div>
          <div 
            className="relative inline-block mb-4 group cursor-pointer p-[3px] rounded-full"
            onClick={handleVideoClick}
          >
            <svg 
              className="absolute inset-0"
              style={{ 
                width: 'calc(100% + 6px)', 
                height: 'calc(100% + 6px)',
                margin: '-3px',
                transform: 'rotate(-90deg)'
              }}
              viewBox="0 0 70 70"
            >
              <defs>
                <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f09433" />
                  <stop offset="25%" stopColor="#e6683c" />
                  <stop offset="50%" stopColor="#dc2743" />
                  <stop offset="75%" stopColor="#cc2366" />
                  <stop offset="100%" stopColor="#bc1888" />
                </linearGradient>
              </defs>
              <circle
                cx="35"
                cy="35"
                r="33"
                fill="none"
                stroke={videoSeen ? "#a3a3a3" : "url(#instagram-gradient)"}
                strokeWidth="3"
                strokeDasharray="207.35"
                strokeDashoffset={videoSeen ? "0" : "207.35"}
                className={videoSeen ? "" : "animate-draw-circle"}
                style={{
                  transformOrigin: '35px 35px',
                  transition: videoSeen ? 'stroke 0.5s ease-out' : 'none'
                }}
              />
            </svg>
            <div className="rounded-full bg-white dark:bg-neutral-900 p-[2px]">
              <Image
                src="/images/cr-pp3.png"
                alt="Photo de profil de Corentin Robert"
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover transition-all group-hover:opacity-90"
                style={{ objectPosition: 'center 30%' }}
                priority
              />
            </div>
            {/* Overlay grisé avec icône play au hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/70 dark:bg-neutral-900/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-play text-white" viewBox="0 0 16 16">
                <path d="M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z"/>
              </svg>
            </div>
          </div>
          
          {/* Popup vidéo verticale */}
          {showVideo && videoId && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/80 dark:bg-neutral-900/80 backdrop-blur-sm"
              onClick={handleCloseVideo}
            >
              <div 
                className="relative aspect-[9/16] w-full max-w-[280px] rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleCloseVideo}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-neutral-900/90 dark:bg-neutral-100/90 text-white dark:text-neutral-900 hover:bg-neutral-900 dark:hover:bg-neutral-100 transition-colors"
                  aria-label="Fermer la vidéo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Présentation de Corentin Robert"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                  style={{ border: 'none' }}
                />
              </div>
            </div>
          )}
          
          <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Corentin Robert</h1>
        </div>
        <p className="mb-8 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Je transforme vos processus manuels en automatisations opérationnelles en moins d'une semaine. Expert <strong className="text-neutral-900 dark:text-neutral-100">scraping</strong> et <strong className="text-neutral-900 dark:text-neutral-100">automatisation</strong> pour dirigeants qui veulent des résultats rapides, pas des promesses à long terme. Le week-end, je développe <strong className="text-neutral-900 dark:text-neutral-100">Logement Atypique</strong> avec mon frère — on parcourt la France pour mettre en avant des logements d'exception.
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
                  {metric.label === 'projets réalisés' ? (
                    <>
                      {metric.value} {metric.breakdown && <span className="text-base font-normal text-neutral-500 dark:text-neutral-500">({metric.breakdown.malt} + {metric.breakdown.fiverr})</span>}
                      <a 
                        href={siteConfig.social.malt}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center hover:opacity-70 transition-opacity text-neutral-400 dark:text-neutral-500"
                        aria-label="Profil Malt"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                      </a>
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
                      {(metric.label === 'utilisateurs actifs' || metric.label?.includes('utilisateurs')) && (
                        <a 
                          href="https://apify.com?fpr=0n7ukq"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center hover:opacity-70 transition-opacity text-neutral-400 dark:text-neutral-500"
                          aria-label="Voir mes scrapers sur Apify"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
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
        </div>
        
        {/* Carousel de témoignages */}
        <section className="mb-8 relative" aria-label="Témoignages clients">
          <div className="relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50" aria-live="polite" aria-atomic="true">
            <div 
              ref={testimonialScrollRef}
              className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {/* Témoignage LinkedIn */}
              <div className="min-w-full sm:w-full sm:flex-shrink-0 p-4 flex flex-col min-h-[180px] snap-start">
                <div className="mb-3">
                  <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-1">Automatisation • Compréhension immédiate • Valeur apportée dès le départ</p>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 italic mb-3 leading-relaxed flex-1">
                  "J'ai eu le plaisir de travailler avec Corentin dans le cadre de l'automatisation de plusieurs tâches. Très à l'écoute, il a su comprendre et détecter nos besoins immédiatement, avec une vraie capacité d'analyse et une grande efficacité dans la mise en œuvre. Super compétent, réactif et force de proposition, Corentin a clairement apporté de la valeur dès le départ."
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">Adnane Amahou</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Responsable CX @ NGI</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">LinkedIn</span>
                </div>
              </div>
              
              {/* Témoignage LinkedIn - Assursafe */}
              <div className="min-w-full sm:w-full sm:flex-shrink-0 p-4 flex flex-col min-h-[180px] snap-start">
                <div className="mb-3">
                  <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-1">Plusieurs missions • Professionnel • À l'écoute</p>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 italic mb-3 leading-relaxed flex-1">
                  "Nous avons travaillé à plusieurs reprises avec Corentin qui est très professionnel, rigoureux et à l'écoute de nos besoins. Je le recommande !"
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">Hugues Chavrier</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Président @ Assursafe</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">LinkedIn</span>
                </div>
              </div>
              
              {/* Témoignage Fiverr */}
              <div className="min-w-full sm:w-full sm:flex-shrink-0 p-4 flex flex-col min-h-[180px] snap-start">
                <div className="mb-3">
                  <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-1">Projet complexe • Révisions rapides • 100% satisfait</p>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 italic mb-3 leading-relaxed flex-1">
                  "Corentin did an excellent job and my cooperation with him was smooth and easy. He delivered what he promised, he was very open and quick to discuss revisions and delivered even them in no time. My project was not a simple one, as it required collecting information from different places. I'm 100% satisfied with the result."
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">lampro74</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Belgique</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">Fiverr</span>
                </div>
              </div>
              
              {/* Témoignage Malt */}
              <div className="min-w-full sm:w-full sm:flex-shrink-0 p-4 flex flex-col min-h-[180px] snap-start">
                <div className="mb-3">
                  <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-1">Délais respectés • Clarté dès le départ • Professionnalisme</p>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 italic mb-3 leading-relaxed flex-1">
                  "Très professionnel dans les échanges et a respecté à la fois la demande et les délais. Corentin a aussi été très clair sur ce qu'il allait faire dès le départ, évitant les déceptions ou mauvaises surprises. Je recommande."
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">Denis</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Inovesta</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">Malt</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Indicateurs de navigation */}
          <div className="flex justify-center gap-2 mt-4">
            {[0, 1, 2, 3].map((index) => {
              const isActive = isMobile ? currentTestimonialScrollIndex === index : testimonialIndex === index
              return (
              <button
                key={index}
                  onClick={() => {
                    if (testimonialScrollRef.current) {
                      const container = testimonialScrollRef.current
                      const containerWidth = container.clientWidth
                      
                      // Chaque élément fait 100% de la largeur (mobile et desktop)
                      const itemWidth = containerWidth
                      const scrollPosition = index * itemWidth
                      container.scrollTo({ left: scrollPosition, behavior: 'smooth' })
                      
                      if (!isMobile) {
                        setTestimonialIndex(index)
                      }
                    }
                  }}
                className={`h-1.5 rounded-full transition-all ${
                    isActive
                    ? 'w-6 bg-neutral-900 dark:bg-neutral-100'
                    : 'w-1.5 bg-neutral-300 dark:bg-neutral-700'
                }`}
                aria-label={`Aller au témoignage ${index + 1}`}
              />
              )
            })}
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
      <section className="mt-4" aria-label="Projets">
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
              className: 'relative flex flex-col p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group'
            } : {
              className: 'flex flex-col p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50'
            }

            return (
              <Component key={index} {...props}>
                <div className="flex items-start gap-3 flex-1 min-w-0 mb-3">
                  {project.image ? (
                    <div className="flex-shrink-0 w-6 h-6">
                      <Image
                        src={project.image}
                        alt={project.imageAlt || `${project.title} - ${project.description}`}
                        width={24}
                        height={24}
                        loading="lazy"
                        className={`w-6 h-6 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800 ${!isActive ? 'opacity-50 grayscale' : ''}`}
                        style={project.image === '/images/cr-pp3.png' ? { objectPosition: 'center 30%' } : undefined}
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
                    <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap sm:flex-nowrap">
                      <h2 className={`font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200 flex-1 min-w-0 sm:flex-initial ${!isActive ? 'text-neutral-500 dark:text-neutral-400' : ''}`}>
                        {project.title}
                      </h2>
                      {project.status === 'active' && (
                        <span className="relative flex h-2 w-2 flex-shrink-0 mt-1 sm:mt-0" title="Projet actif">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
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
                    <p className={`text-sm ${isActive ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-500 dark:text-neutral-400'} line-clamp-2`}>
                      {project.description}
                    </p>
                  </div>
                </div>
                
                {/* Séparateur fin et compteur de clics */}
                {project.link && (
                  <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                      {/* Espaceur pour aligner avec l'icône */}
                      <div className="flex-shrink-0 w-6 h-6"></div>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        {project.id ? (
                          <ProjectClickCounter projectId={project.id} />
                        ) : (
                          <span></span>
                        )}
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-shrink-0">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </Component>
            )
          })}
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/a-propos"
            className="text-sm font-normal text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
          >
            Voir tous les projets (y compris arrêtés)
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
            </svg>
          </Link>
        </div>
      </section>
      
      {/* Section Marketplace */}
      <section className="mt-12" aria-label="Marketplace">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Marketplace</h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Ressources gratuites que j'ai développées et que je mets à disposition — générateurs, extracteurs, templates et bases de données pour vous aider dans votre quotidien.
        </p>
        <div className="flex flex-col space-y-4">
          {getRecentTools(3).map((tool) => (
            <Link
              key={tool.name}
              href={tool.link}
              className="relative flex flex-col p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0 mb-3">
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
                ) : tool.icon ? (
                  <span className="flex-shrink-0 text-2xl">{tool.icon}</span>
                ) : null}
                <div className="flex-1 min-w-0">
                  <div className="mb-1">
                    <h2 className="font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                      {tool.name}
                    </h2>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              </div>
              
              {/* Séparateur fin et prix */}
              <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between gap-3">
                  {/* Espaceur pour aligner avec l'icône */}
                  <div className="flex-shrink-0 w-6 h-6"></div>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-500">
                      {tool.isPaid ? `À partir de ${tool.annualPrice || tool.price || 0}€` : 'Gratuit'}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-shrink-0">
                      <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                    </svg>
                  </div>
                  {tool.date && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-500 flex-shrink-0">
                      {new Date(tool.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/marketplace"
            className="text-sm font-normal text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
          >
            Découvrir la marketplace
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
            return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
                className="post-link group"
            >
                <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2 transition-all group-hover:translate-x-1">
                <div className="flex flex-col md:flex-row md:items-center w-full">
                  <div className="flex-shrink-0">
                    <p className="post-date text-sm whitespace-nowrap">{(() => {
                      const date = new Date(post.date)
                      const day = String(date.getDate()).padStart(2, '0')
                      const month = String(date.getMonth() + 1).padStart(2, '0')
                      const year = date.getFullYear()
                      return `${day}-${month}-${year}`
                    })()}</p>
                  </div>
                    <span className="hidden md:inline-block w-0.5 h-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500 mx-2 flex-shrink-0"></span>
                    <p className="post-title flex-grow w-full md:ml-0 flex items-center gap-2 min-w-0">
                      <span className="truncate">{post.title}</span>
                    </p>
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
          className="text-sm font-normal text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
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