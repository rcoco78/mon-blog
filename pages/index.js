import Link from 'next/link'
import Image from 'next/image'
import { getAllPosts } from '../lib/notion'
import { fetchHomeData } from '../lib/home-data'
import { useState, useEffect, useRef } from 'react'
import { siteConfig } from '../lib/config'
import { sectorToSlug } from '../lib/case-studies-helpers'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import ProjectClickCounter from '../components/ProjectClickCounter'
import { testimonials } from '../lib/testimonials'
import {
  marketplaceBenefit,
  marketplacePriceLabel,
} from '../lib/marketplace-display'
import { getProjectsCountPhrase } from '../lib/project-count'
import { fetchBlobJson, withTimeout } from '../lib/blob-cache'
import { captureDataError } from '../lib/sentry'

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

export default function Home({ dynamicDatabases = [], marketplaceReviewsCount = 0, homeData }) {
  const [topPosts] = useState(homeData?.topPosts ?? [])
  const [loading] = useState(false)
  const [metrics] = useState(homeData?.metrics ?? siteConfig.metrics)
  const [metricsLoading] = useState(false)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [topCaseStudies] = useState(homeData?.topCaseStudies ?? [])
  const [topCaseStudiesLoading] = useState(false)
  const [projectClicks, setProjectClicks] = useState({})
  const [isMobile, setIsMobile] = useState(false)
  const [currentTestimonialScrollIndex, setCurrentTestimonialScrollIndex] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [videoSeen, setVideoSeen] = useState(false)
  const testimonialScrollRef = useRef(null)
  const projectsPhrase = getProjectsCountPhrase(metrics)

  // URL de la vidéo Tella
  const videoUrl = 'https://www.tella.tv/video/freelance-en-scrapping-et-automatisation-342e'
  const videoEmbedUrl = 'https://www.tella.tv/video/vid_cmjylsyom00bn04la9dfs342e/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0'
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)

  const openCalendly = () => {
    if (!calendlyLoaded) {
      if (!document.querySelector('link[href*="calendly.com"]')) {
        const link = document.createElement('link')
        link.href = 'https://assets.calendly.com/assets/external/widget.css'
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }

      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.type = 'text/javascript'
      script.async = true
      script.onload = () => {
        setCalendlyLoaded(true)
        if (window.Calendly) {
          window.Calendly.initPopupWidget({
            url: 'https://calendly.com/corentinrobert/20min'
          })
        }
      }
      document.body.appendChild(script)
    } else if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: 'https://calendly.com/corentinrobert/20min'
      })
    }
  }

  // Vérifier si la vidéo a déjà été vue
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('profileVideoSeen') === 'true'
      setVideoSeen(seen)
    }
  }, [])

  // Un seul fetch pour tous les compteurs de clics projets
  useEffect(() => {
    const partnerIds = ['contributeurs-apify', 'lemlist', 'zapmail']
    const ids = siteConfig.projects
      .filter((p) => p.status === 'active' && !partnerIds.includes(p.id) && p.id)
      .map((p) => p.id)
    if (ids.length === 0) return

    fetch(`/api/projects/clicks?projectIds=${ids.join(',')}`)
      .then((res) => res.json())
      .then((data) => setProjectClicks(data || {}))
      .catch(() => setProjectClicks({}))
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

  const pageSEO = generatePageSEO({
    title: 'Freelance scraping, automatisation et journal de bord',
    description: `Corentin Robert — freelance scraping, automatisation et data. ${projectsPhrase} livrés via Malt et Fiverr. Journal public de ce que je construis, marketplace de bases et scrapers.`,
    path: '/',
    keywords: ['Corentin Robert', 'scraping freelance', 'automatisation', 'consultant scraping', 'web scraping', 'data automation', 'freelance scraping France', 'freelance scraping Paris', 'consultant scraping TPE-PME', 'scraping immobilier', 'automatisation processus business']
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      
      <StructuredData 
        type="Organization" 
        data={{
          description: `Expert freelance en scraping et automatisation. ${projectsPhrase} livrés via Malt et Fiverr, livraison en 7 jours.`,
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
      
      <StructuredData 
        type="Person" 
        data={{
          name: 'Corentin Robert',
          alternateName: 'Corentin Robert',
          jobTitle: 'Expert Freelance en Scraping et Automatisation',
          description: `Corentin Robert — expert freelance en scraping et automatisation. ${projectsPhrase} livrés. Spécialisé scraping immobilier et santé pour TPE-PME.`,
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
              answer: `3 avantages clés : 1) Rapidité : livraison en moins d'une semaine vs 1-2 mois pour une agence, 2) Coûts maîtrisés : pas de frais de structure, tarifs transparents, 3) Expertise ciblée : ${projectsPhrase} en scraping/automatisation vs un dev interne qui doit tout apprendre.`
            },
            {
              question: "Est-ce légal de scraper des sites web ?",
              answer: "Oui, le scraping est légal dans la plupart des cas, à condition de respecter : 1) Les robots.txt et conditions d'utilisation du site, 2) Le RGPD si vous collectez des données personnelles, 3) Les bonnes pratiques (ne pas surcharger les serveurs, respecter les limites de taux)."
            }
          ]
        }} 
      />
      
      <StructuredData type="SiteNavigation" />
      
      <StructuredData 
        type="WebPage" 
        data={{
          url: siteConfig.url,
          name: 'Corentin Robert — Freelance Scraping & Automatisation',
          title: 'Freelance scraping, automatisation et journal de bord',
          description: `Corentin Robert — freelance scraping, automatisation et data. ${projectsPhrase} livrés, livraison en 7 jours.`,
          image: siteConfig.ogImage,
          about: {
            '@type': 'Thing',
            name: 'Scraping et Automatisation'
          }
        }} 
      />
      
      <StructuredData 
        type="Service" 
        data={{
          name: 'Scraping et Automatisation',
          serviceType: 'Web Scraping, Data Automation, Outbound Marketing',
          description: `Expert freelance en scraping web et automatisation. Création d'outils sur-mesure pour extraire, structurer et exploiter vos données. ${projectsPhrase} livrés via Malt et Fiverr.`,
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
                src={siteConfig.profileImage}
                alt="Photo de profil de Corentin Robert"
                width={64}
                height={64}
                sizes="64px"
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
          
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">Corentin Robert</h1>
        </div>
        <p className="mb-3 text-neutral-800 dark:text-neutral-200 tracking-tight font-medium">
          Scraping, automatisation et data pour générer du business.
        </p>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Expert freelance en <strong className="text-neutral-900 dark:text-neutral-100">scraping</strong> et <strong className="text-neutral-900 dark:text-neutral-100">automatisation</strong> — {projectsPhrase} livrés via Malt et Fiverr. Ce site est mon journal de bord public : accomplissements, preuves terrain et ce que je construis pour devenir une référence dans mon métier.
        </p>
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-500 tracking-tight">
          En parallèle, je développe <strong className="text-neutral-700 dark:text-neutral-300">Logement Atypique</strong> avec mon frère — preuve entrepreneuriale, pas le cœur de mon offre freelance.
        </p>

        {/* CTA principaux */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Link
            href="/objectifs"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Suivre mon journal
          </Link>
          <button
            type="button"
            onClick={openCalendly}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
          >
            Réserver un appel
          </button>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          >
            Voir la marketplace
          </Link>
        </div>
        
        {/* Métriques de confiance - Déplacées plus tôt sur mobile */}
        <div className="mb-6 md:mb-8">
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
            metrics.map((metric, index) => {
              const MetricWrapper = metric.href ? Link : 'div'
              const wrapperProps = metric.href
                ? { href: metric.href, className: 'block p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors' }
                : { className: 'p-4 rounded-lg border border-neutral-200 dark:border-neutral-800' }

              return (
              <MetricWrapper key={index} {...wrapperProps}>
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
                        onClick={(e) => e.stopPropagation()}
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
                          onClick={(e) => e.stopPropagation()}
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
                          onClick={(e) => e.stopPropagation()}
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
              </MetricWrapper>
              )
            })
          )}
          </div>
        </div>
      </section>

      {/* Séparateur visuel — zone Présentation */}
      <hr className="my-6 border-t border-neutral-200 dark:border-neutral-800" role="presentation" />

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

      <section className="" aria-label="Ce que je construis">
        <h2 className="font-semibold text-xl mb-2 tracking-tighter">Ce que je construis</h2>
        <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400 tracking-tight">
          Missions freelance d’abord, puis Outreacher (outbound), puis preuves entrepreneuriales.
        </p>
        <div className="flex flex-col space-y-4">
          {siteConfig.projects.filter(project => {
            // Filtrer uniquement les projets (exclure les partenaires)
            const partnerIds = ['contributeurs-apify', 'lemlist', 'zapmail']
            return project.status === 'active' && !partnerIds.includes(project.id)
          }).sort((a, b) => {
            // Featured (freelance / outbound) avant le reste
            const af = a.featured ? 0 : 1
            const bf = b.featured ? 0 : 1
            return af - bf
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
                        sizes="24px"
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
                          sizes="24px"
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
                          <ProjectClickCounter projectId={project.id} clicks={projectClicks[project.id]} />
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
        <h2 className="font-semibold text-xl mb-2 tracking-tighter">
          Marketplace
          {marketplaceReviewsCount > 0 && (
            <span className="ml-2 text-base font-normal text-neutral-500 dark:text-neutral-400">
              · {marketplaceReviewsCount} avis client{marketplaceReviewsCount > 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Bases Google Sheets en libre-service — les mêmes que je livre à mes clients. Aussi :{' '}
          <Link href="/marketplace?tab=tools" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
            mes scrapers publics sur Apify
          </Link>
          .
        </p>
        <div className="flex flex-col space-y-4">
          {(() => {
            const topDatabases = (dynamicDatabases || []).slice(0, 3)
            return topDatabases.map((tool) => (
            <Link
              key={tool.name}
              href={tool.link || '#'}
              className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                  {tool.name}
                </h3>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                  {marketplacePriceLabel(tool)}
                </span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                {marketplaceBenefit(tool)}
              </p>
              <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
                    Voir la base
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

      
      {/* Section Articles business */}
      <section className="mt-12" aria-label="Articles métier">
        <h2 className="font-semibold text-xl mb-2 tracking-tighter">Articles métier</h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Scraping, automatisation, freelance et acquisition — le journal de ce qui construit ma légitimité.
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

      {/* Cas d'usage premium sélectionnés manuellement */}
      <section className="mt-12 mb-8" aria-label="Cas d'usage scraping">
        <h2 className="font-semibold text-xl mb-2 tracking-tighter">Cas d&apos;usage scraping</h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Exemples concrets dans l’immobilier, la prospection LinkedIn et l’e-commerce.
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
                      {cs.sector}
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
    const data = await withTimeout(fetchBlobJson('marketplace-views-events.json'), 8000, null)
    return Array.isArray(data) ? data : []
  } catch (e) {
    captureDataError(e, { source: 'blob', tags: { area: 'marketplace-views' } })
    return []
  }
}

function lightDatabase(db) {
  return {
    name: db.name || null,
    slug: db.slug || null,
    category: db.category || null,
    link: db.link || null,
    description: db.description || null,
    benefit: db.benefit || null,
    shortDescription: db.shortDescription || null,
    price: db.price ?? null,
    annualPrice: db.annualPrice ?? null,
    isPaid: db.isPaid ?? true,
    rowCount: db.rowCount ?? null,
    lastEnriched: db.lastEnriched || null,
    date: db.date || null,
    views: db.views || 0,
  }
}

export async function getStaticProps() {
  const started = Date.now()

  const postsPromise = getAllPosts().catch((err) => {
    captureDataError(err, { source: 'notion', tags: { area: 'home-posts' } })
    return []
  })

  const marketplacePromise = Promise.all([
    import('../lib/marketplace-databases')
      .then((m) => m.getDatabasesAsTools())
      .catch((err) => {
        captureDataError(err, { source: 'blob', tags: { area: 'marketplace-dbs' } })
        return []
      }),
    import('../lib/marketplace-reviews')
      .then((m) => m.getMarketplaceReviews())
      .catch((err) => {
        captureDataError(err, { source: 'blob', tags: { area: 'marketplace-reviews' } })
        return []
      }),
    getMarketplaceViewEvents(),
  ])

  const posts = await postsPromise
  const [homeData, [dynamicDatabasesRaw, reviews, events]] = await Promise.all([
    fetchHomeData(posts).catch((err) => {
      captureDataError(err, { source: 'blob', tags: { area: 'home-data' } })
      return null
    }),
    marketplacePromise,
  ])

  let dynamicDatabases = dynamicDatabasesRaw || []
  try {
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
      .map(lightDatabase)
  } catch (err) {
    dynamicDatabases = dynamicDatabases
      .sort((a, b) => new Date(b.lastEnriched || b.date || 0) - new Date(a.lastEnriched || a.date || 0))
      .slice(0, 3)
      .map(lightDatabase)
  }

  const marketplaceReviewsCount = Array.isArray(reviews) ? reviews.length : 0

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[home] getStaticProps ${Date.now() - started}ms`)
  }

  return {
    props: {
      dynamicDatabases,
      marketplaceReviewsCount,
      homeData,
    },
    revalidate: 60,
  }
} 