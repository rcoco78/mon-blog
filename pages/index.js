import Link from 'next/link'
import Image from 'next/image'
import { getAllPosts } from '../lib/notion'
import { useState, useEffect, useRef } from 'react'
import { siteConfig } from '../lib/config'
import { sectorToSlug } from '../lib/case-studies-helpers'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import ProjectClickCounter from '../components/ProjectClickCounter'
import { testimonials } from '../lib/testimonials'

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

export default function Home({ posts, dynamicDatabases = [] }) {
  const [topPosts, setTopPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(siteConfig.metrics)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [keyResults, setKeyResults] = useState([])
  const [keyResultsLoading, setKeyResultsLoading] = useState(true)
  const [topCaseStudies, setTopCaseStudies] = useState([])
  const [topCaseStudiesLoading, setTopCaseStudiesLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [currentTestimonialScrollIndex, setCurrentTestimonialScrollIndex] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [videoSeen, setVideoSeen] = useState(false)
  const testimonialScrollRef = useRef(null)

  // URL de la vidéo Tella
  const videoUrl = 'https://www.tella.tv/video/freelance-en-scrapping-et-automatisation-342e'
  const videoEmbedUrl = 'https://www.tella.tv/video/vid_cmjylsyom00bn04la9dfs342e/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0'

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

  // Top 3 cas d'usage les plus consultés (pour section en bas de page)
  useEffect(() => {
    const fetchTopCaseStudies = async () => {
      try {
        setTopCaseStudiesLoading(true)
        const res = await fetch('/api/case-studies-views/top?limit=3')
        if (res.ok) {
          const data = await res.json()
          setTopCaseStudies(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.warn('Erreur top cas d\'usage:', err)
      } finally {
        setTopCaseStudiesLoading(false)
      }
    }
    fetchTopCaseStudies()
  }, [])

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
      const maxIndex = 4 // 5 témoignages au total
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
    title: 'Corentin Robert - Expert Freelance Scraping & Automatisation | 424+ Projets',
    description: 'Corentin Robert - Expert freelance en scraping et automatisation à Paris. 424+ projets réalisés, livraison en 7 jours. Spécialisé scraping immobilier et santé. Consultant scraping pour TPE-PME.',
    path: '/',
    keywords: ['Corentin Robert', 'scraping freelance', 'automatisation', 'consultant scraping', 'web scraping', 'data automation', 'freelance scraping France', 'freelance scraping Paris', 'consultant scraping TPE-PME', 'scraping immobilier', 'automatisation processus business']
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      
      {/* Structured Data Organization - Complet pour Google */}
      <StructuredData 
        type="Organization" 
        data={{
          description: 'Expert freelance en scraping et automatisation. 424+ projets réalisés via Malt et Fiverr, livraison en 7 jours.',
          email: 'contact@corentinrobert.fr',
          sameAs: [
            siteConfig.social.linkedin,
            siteConfig.social.malt,
            siteConfig.social.fiverr,
            siteConfig.social.github,
            'https://apify.com?fpr=0n7ukq'
          ]
        }} 
      />
      
      {/* Structured Data Person - Optimisé pour "Corentin Robert" */}
      <StructuredData 
        type="Person" 
        data={{
          name: 'Corentin Robert',
          alternateName: 'Corentin Robert',
          jobTitle: 'Expert Freelance en Scraping et Automatisation',
          description: 'Corentin Robert - Expert freelance en scraping et automatisation. 424+ projets réalisés, 270+ avis positifs. Spécialisé scraping immobilier et santé pour TPE-PME.',
          knowsAbout: ['Web Scraping', 'Data Automation', 'Outbound Marketing', 'Growth Hacking', 'Freelance', 'Scraping Immobilier', 'Scraping Santé'],
          sameAs: [
            siteConfig.social.linkedin,
            siteConfig.social.malt,
            siteConfig.social.fiverr,
            siteConfig.social.github,
            'https://apify.com?fpr=0n7ukq'
          ]
        }} 
      />
      
      {/* Structured Data FAQPage - Questions principales */}
      <StructuredData 
        type="FAQPage" 
        data={{
          questions: [
            {
              question: "Qu'est-ce que le scraping et comment ça peut aider mon business ?",
              answer: "Le scraping (ou web scraping) est une technique qui permet d'extraire automatiquement des données depuis des sites web. Concrètement, cela vous permet de : collecter des données concurrentielles (prix, produits, avis), générer des leads qualifiés (contacts, profils LinkedIn), automatiser votre veille marché, enrichir vos bases de données existantes."
            },
            {
              question: "Quel est le délai de livraison réel ?",
              answer: "Livraison en moins d'une semaine pour 90% des projets. Concrètement : un scraping simple (1 site, données structurées) : 2-3 jours, un scraping complexe (multi-sites, anti-bot) : 5-7 jours, une automatisation complète : 5-7 jours."
            },
            {
              question: "Combien coûte un projet de scraping ou d'automatisation ?",
              answer: "Les prix varient selon la complexité : un scraping simple (1 site, données structurées) : 500-1500€, un scraping complexe (multi-sites, données dynamiques, anti-bot) : 1500-5000€, une automatisation complète (outil sur-mesure + intégration) : 2000-8000€. La plupart des projets se livrent en moins d'une semaine."
            },
            {
              question: "Pourquoi choisir Corentin Robert plutôt qu'une agence ou un dev interne ?",
              answer: "3 avantages clés : 1) Rapidité : livraison en moins d'une semaine vs 1-2 mois pour une agence, 2) Coûts maîtrisés : pas de frais de structure, tarifs transparents, 3) Expertise ciblée : 424+ projets en scraping/automatisation vs un dev interne qui doit tout apprendre."
            },
            {
              question: "Est-ce légal de scraper des sites web ?",
              answer: "Oui, le scraping est légal dans la plupart des cas, à condition de respecter : 1) Les robots.txt et conditions d'utilisation du site, 2) Le RGPD si vous collectez des données personnelles, 3) Les bonnes pratiques (ne pas surcharger les serveurs, respecter les limites de taux)."
            }
          ]
        }} 
      />
      
      {/* Structured Data SiteNavigation - Pour les sitelinks Google (À propos, Marketplace, Blog) */}
      <StructuredData type="SiteNavigation" />
      
      {/* Structured Data WebPage - Pour améliorer l'indexation de la page d'accueil */}
      <StructuredData 
        type="WebPage" 
        data={{
          url: siteConfig.url,
          name: 'Corentin Robert - Expert Freelance Scraping & Automatisation',
          title: 'Corentin Robert - Expert Freelance Scraping & Automatisation | 424+ Projets',
          description: 'Corentin Robert - Expert freelance en scraping et automatisation à Paris. 424+ projets réalisés, livraison en 7 jours. Spécialisé scraping immobilier et santé.',
          image: siteConfig.ogImage,
          about: {
            '@type': 'Thing',
            name: 'Scraping et Automatisation'
          }
        }} 
      />
      
      {/* Structured Data pour SEO */}
      <StructuredData 
        type="Service" 
        data={{
          name: 'Scraping et Automatisation',
          serviceType: 'Web Scraping, Data Automation, Outbound Marketing',
          description: 'Expert freelance en scraping web et automatisation. Création d\'outils sur-mesure pour extraire, structurer et exploiter vos données. 424+ projets réalisés via Malt et Fiverr.',
          url: siteConfig.url,
          offers: {
            '@type': 'Offer',
            availability: 'https://schema.org/InStock',
            priceCurrency: 'EUR',
            description: 'Services de scraping et automatisation sur-mesure',
            priceValidUntil: (() => {
              const date = new Date();
              date.setFullYear(date.getFullYear() + 1);
              return date.toISOString().split('T')[0];
            })()
          }
          // Note: aggregateRating retiré du Service car Google n'accepte pas Service pour Review snippets
          // Les avis sont gérés via les Review schemas séparés avec Product comme itemReviewed
        }} 
      />
      {/* Review Schema 5* par défaut pour le service */}
      <StructuredData
        type="Review"
        data={{
          itemReviewed: {
            '@type': 'Product',
            name: 'Scraping et Automatisation',
            url: siteConfig.url,
            brand: {
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
            name: siteConfig.author,
            url: siteConfig.url
          },
          reviewBody: 'Expert freelance en scraping et automatisation. 424+ projets réalisés avec 270+ avis positifs. Livraison en 7 jours, résultats garantis.',
          datePublished: new Date().toISOString().split('T')[0]
        }}
      />
      {/* Review Schema individuelles pour Google Search Console (Extraits d'avis) */}
      <StructuredData
        type="Review"
        data={{
          author: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url
          },
          reviewBody: "J'ai eu le plaisir de travailler avec Corentin dans le cadre de l'automatisation de plusieurs tâches. Très à l'écoute, il a su comprendre et détecter nos besoins immédiatement, avec une vraie capacité d'analyse et une grande efficacité dans la mise en œuvre. Super compétent, réactif et force de proposition, Corentin a clairement apporté de la valeur dès le départ.",
          ratingValue: '5',
          datePublished: '2024-01-15',
          itemReviewed: {
            '@type': 'Product',
            name: 'Services de Scraping et Automatisation',
            url: siteConfig.url,
            brand: {
              '@type': 'Person',
              name: siteConfig.author,
              url: siteConfig.url
            }
          }
        }}
      />
      <StructuredData
        type="Review"
        data={{
          author: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url
          },
          reviewBody: "Prestation de scraping impeccable : compréhension rapide du besoin, extraction propre et structurée, délais respectés. Les données livrées sont exploitables immédiatement (format clair, colonnes cohérentes, pas de doublons). Communication fluide et réactif tout au long du projet.",
          ratingValue: '5',
          datePublished: '2024-01-05',
          itemReviewed: {
            '@type': 'Product',
            name: 'Services de Scraping et Automatisation',
            url: siteConfig.url,
            brand: {
              '@type': 'Person',
              name: siteConfig.author,
              url: siteConfig.url
            }
          }
        }}
      />
      <StructuredData
        type="Review"
        data={{
          author: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url
          },
          reviewBody: "Nous avons travaillé à plusieurs reprises avec Corentin qui est très professionnel, rigoureux et à l'écoute de nos besoins. Je le recommande !",
          ratingValue: '5',
          datePublished: '2023-12-15',
          itemReviewed: {
            '@type': 'Product',
            name: 'Services de Scraping et Automatisation',
            url: siteConfig.url,
            brand: {
              '@type': 'Person',
              name: siteConfig.author,
              url: siteConfig.url
            }
          }
        }} 
      />
      <main className="flex-auto min-w-0 mt-6 flex flex-col mb-0">
      <section aria-label="Présentation">
        <div>
          <div 
            className="relative inline-block mb-4 group cursor-pointer p-[2px] rounded-full"
            onClick={handleVideoClick}
          >
            <svg 
              className="absolute inset-0"
              style={{ 
                width: 'calc(100% + 4px)', 
                height: 'calc(100% + 4px)',
                margin: '-2px',
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
                strokeWidth="2"
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
                src="/images/profile-picture/cr-pp3.png"
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
          
          {/* Popup vidéo */}
          {showVideo && videoEmbedUrl && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-neutral-900/80 dark:bg-neutral-900/80 backdrop-blur-sm"
              onClick={handleCloseVideo}
            >
              <div 
                className="relative w-full max-w-[280px] md:max-w-sm rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl"
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
                <div style={{ position: 'relative', paddingBottom: '177.78%', height: 0 }}>
                  <iframe
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                    src={videoEmbedUrl}
                    title="Présentation de Corentin Robert"
                    allowFullScreen
                    allowTransparency
                  />
                </div>
              </div>
            </div>
          )}
          
          <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Corentin Robert</h1>
        </div>
        <p className="mb-8 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Je transforme vos processus manuels en automatisations opérationnelles en moins d'une semaine. Expert <strong className="text-neutral-900 dark:text-neutral-100">scraping</strong> et <strong className="text-neutral-900 dark:text-neutral-100">automatisation</strong> pour dirigeants qui veulent des résultats rapides, pas des promesses à long terme. Le week-end, je développe <strong className="text-neutral-900 dark:text-neutral-100">Logement Atypique</strong> avec mon frère — on parcourt la France pour mettre en avant des logements d'exception.
        </p>
        
        {/* Liens principaux — aide Google à afficher des sitelinks (À propos, Marketplace, Blog) */}
        <nav className="mb-8 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Navigation principale">
          <Link href="/a-propos" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            À propos
          </Link>
          <span className="text-neutral-300 dark:text-neutral-600" aria-hidden>·</span>
          <Link href="/marketplace" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Marketplace
          </Link>
          <span className="text-neutral-300 dark:text-neutral-600" aria-hidden>·</span>
          <Link href="/blog" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Blog
          </Link>
        </nav>
        
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
      </section>

      {/* Séparateur visuel — zone Présentation */}
      <hr className="my-12 border-t border-neutral-200 dark:border-neutral-800" role="presentation" />

      {/* Carousel de témoignages — triés par date (dernier avis en premier) */}
      {(() => {
        const homeTestimonials = [...testimonials]
          .sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished))
          .slice(0, 5)
        const getSourceBadgeClass = (source) => {
          if (source === 'LinkedIn') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          if (source === 'Fiverr') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          if (source === 'Malt') return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
          return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
        }
        return (
      <section className="relative" aria-label="Témoignages clients">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Témoignages</h2>
        <div className="relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50" aria-live="polite" aria-atomic="true">
          <div 
            ref={testimonialScrollRef}
            className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {homeTestimonials.map((t, i) => (
              <div key={i} className="min-w-full sm:w-full sm:flex-shrink-0 p-4 flex flex-col min-h-[180px] snap-start">
                <div className="mb-3">
                  <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-1">{t.tags}</p>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 italic mb-3 leading-relaxed flex-1">
                  &quot;{t.reviewBody}&quot;
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">{t.authorName}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">{t.authorJob}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSourceBadgeClass(t.source)}`}>{t.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicateurs de navigation */}
        <div className="flex justify-center gap-2 mt-4">
          {homeTestimonials.map((_, index) => {
            const isActive = isMobile ? currentTestimonialScrollIndex === index : testimonialIndex === index
            return (
            <button
              key={index}
                onClick={() => {
                  if (testimonialScrollRef.current) {
                    const container = testimonialScrollRef.current
                    const containerWidth = container.clientWidth

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
        )
      })()}

      {/* Séparateur visuel — zone Projets / Contenu */}
      <hr className="my-12 border-t border-neutral-200 dark:border-neutral-800" role="presentation" />

      <section className="" aria-label="Projets en cours">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Projets en cours</h2>
        <div className="flex flex-col space-y-4">
          {siteConfig.projects.filter(project => {
            // Filtrer uniquement les projets (exclure les partenaires)
            const partnerIds = ['contributeurs-apify', 'lemlist', 'zapmail']
            return project.status === 'active' && !partnerIds.includes(project.id)
          }).map((project, index) => {
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
          Bases de données que j'ai développées et mets à disposition — listings, extracteurs et templates pour vous aider dans votre quotidien.
        </p>
        <div className="flex flex-col space-y-4">
          {(() => {
            // Top 3 bases de données les plus consultées (déjà triées côté getStaticProps)
            const topDatabases = (dynamicDatabases || []).slice(0, 3)
            return topDatabases
              .map((tool) => (
            <Link
              key={tool.name}
              href={tool.link || '#'}
              className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0 mb-3">
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
              
              {/* Footer : contenu à gauche, flèche à droite (uniforme avec articles et cas d'usage) */}
              <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-neutral-500 dark:text-neutral-500 flex-1 min-w-0">
                    {tool.isPaid ? `${tool.annualPrice || tool.price || 0}€` : 'Gratuit'}
                    <> · {(tool.views ?? 0)} {(tool.views ?? 0) === 1 ? 'vue' : 'vues'}</>
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-shrink-0" aria-hidden>
                    <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </Link>
              ))
            })()}
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

      
      {/* Section Articles les plus consultés */}
      <section className="mt-12" aria-label="Articles les plus consultés">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Articles les plus consultés</h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Réflexions sur le scraping, l'automatisation, l'entrepreneuriat, le freelance et le voyage.
        </p>
        <div className="flex flex-col space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
            ))
          ) : topPosts.length > 0 ? (
            topPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0 mb-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200 mb-1">
                      {post.title}
                    </h2>
                    {post.metaDescription && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {post.metaDescription}
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-neutral-500 dark:text-neutral-500 flex-1 min-w-0">
                      {(() => {
                        const d = new Date(post.date)
                        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} · ${post.views ?? 0} ${(post.views ?? 0) === 1 ? 'vue' : 'vues'}`
                      })()}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-shrink-0" aria-hidden>
                      <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-neutral-600 dark:text-neutral-400">Aucun article disponible pour le moment.</p>
          )}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/blog"
            className="text-sm font-normal text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
          >
            Voir tous les articles
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Top 3 cas d'usage consultés - même design que Marketplace */}
      <section className="mt-12 mb-8" aria-label="Cas d'usage les plus consultés">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Cas d&apos;usage les plus consultés</h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Les cas d&apos;usage de scraping qui attirent le plus l&apos;attention.
        </p>
        <div className="flex flex-col space-y-4">
          {topCaseStudiesLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
            ))
          ) : topCaseStudies.length > 0 ? (
            topCaseStudies.map((cs) => (
              <Link
                key={cs.slug}
                href={`/cas-usage/${sectorToSlug(cs.sector || '')}/${cs.slug}`}
                className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0 mb-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200 mb-1">
                      {cs.title}
                    </h2>
                    {cs.description && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {cs.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-neutral-500 dark:text-neutral-500 flex-1 min-w-0">
                      {cs.sector} · {cs.views ?? 0} {(cs.views ?? 0) === 1 ? 'vue' : 'vues'}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-shrink-0" aria-hidden>
                      <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))
          ) : null}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/cas-usage"
            className="text-sm font-normal text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
          >
            Voir tous les cas d&apos;usage
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
    </>
  )
}

async function getMarketplaceViewEvents() {
  try {
    const { list } = await import('@vercel/blob')
    const blobs = await list({ prefix: 'marketplace-views-events.json' })
    const blob = blobs.blobs.find((b) => b.pathname === 'marketplace-views-events.json')
    if (blob) {
      const res = await fetch(blob.url, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        return Array.isArray(data) ? data : []
      }
    }
    return []
  } catch {
    return []
  }
}

export async function getStaticProps() {
  const posts = await getAllPosts()
  
  // Charger les bases de données dynamiques — top 3 les plus consultées
  const { getDatabasesAsTools } = await import('../lib/marketplace-databases')
  let dynamicDatabases = await getDatabasesAsTools()
  try {
    const events = await getMarketplaceViewEvents()
    const viewsMap = {}
    events.forEach((e) => {
      if (e.slug && e.category) {
        const k = `${e.category}/${e.slug}`
        viewsMap[k] = (viewsMap[k] || 0) + 1
      }
    })
    dynamicDatabases = dynamicDatabases
      .map((db) => ({ ...db, views: viewsMap[`${db.category}/${db.slug}`] || 0 }))
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 3)
  } catch (err) {
    // Fallback : 3 premières par date si erreur
    dynamicDatabases = dynamicDatabases
      .sort((a, b) => new Date(b.lastEnriched || b.date || 0) - new Date(a.lastEnriched || a.date || 0))
      .slice(0, 3)
  }

  return {
    props: {
      posts,
      dynamicDatabases,
    },
    revalidate: 60,
  }
} 