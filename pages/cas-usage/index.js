import Link from 'next/link'
import Image from 'next/image'
import SEOHead from '../../components/seo/SEOHead'
import StructuredData from '../../components/seo/StructuredData'
import { generatePageSEO } from '../../lib/seo'
import { siteConfig } from '../../lib/config'
// Utiliser Blob Storage comme source principale avec fallback vers fichier local
import { getCaseStudiesFromBlob, getAllSectors, getCaseStudiesBySector } from '../../lib/case-studies-blob'
import { getAllSectors as getAllSectorsLocal, getCaseStudiesBySector as getCaseStudiesBySectorLocal } from '../../lib/case-studies'
import { sectorToSlug } from '../../lib/case-studies-helpers'
import { list } from '@vercel/blob'

// Plus besoin de cette constante, on charge depuis Blob Storage dans getStaticProps
import { useState, useEffect } from 'react'
import CaseStudyViewCounter from '../../components/CaseStudyViewCounter'

const VIEWS_EVENTS_FILENAME = 'case-studies-views-events.json'

async function getViewEventsForTop() {
  try {
    const blobs = await list({ prefix: VIEWS_EVENTS_FILENAME })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === VIEWS_EVENTS_FILENAME)

    if (existingBlob) {
      const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const response = await fetch(`${existingBlob.url}?t=${cacheBuster}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          Pragma: 'no-cache',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return Array.isArray(data) ? data : []
      }
    }
    return []
  } catch (error) {
    console.warn('Erreur lors de la récupération des événements de vues pour /cas-usage:', error)
    return []
  }
}

export default function CaseStudiesIndex({ topCaseStudies: initialTopCaseStudies, sectorsWithCounts, viewsMap = {}, todaysCaseStudies = [] }) {
  const topCaseStudies = initialTopCaseStudies || []
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [videoSeen, setVideoSeen] = useState(false)

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

  const openCalendly = () => {
    // Charger Calendly seulement au premier clic (lazy load)
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
    } else {
      if (window.Calendly) {
        window.Calendly.initPopupWidget({
          url: 'https://calendly.com/corentinrobert/20min'
        })
      }
    }
  }

  const sectors = sectorsWithCounts.map(({ sector }) => sector)
  // Cette page d'index est volontairement légère : on ne charge pas la liste
  // complète des 6500+ cas d'usage ici pour éviter un HTML > 2 Mo.
  // La recherche détaillée et la liste complète existent sur les pages secteur
  // (/cas-usage/[sector]) qui gèrent la pagination et le lazy loading.

  const pageSEO = generatePageSEO({
    title: 'Cas d\'usage scraping et automatisation par secteur | Corentin Robert',
    description: `Découvrez comment le scraping et l'automatisation peuvent transformer votre business. 6 500+ cas d'usage concrets par secteur : immobilier, santé, artisanat, e-commerce, finance, restauration...`,
    path: '/cas-usage',
    keywords: ['cas d\'usage scraping', 'scraping par secteur', 'automatisation business', 'extraction données', 'scraping immobilier', 'scraping santé', 'scraping e-commerce']
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      
      <StructuredData
        type="ItemList"
        data={{
          name: 'Cas d\'usage scraping et automatisation',
          description: 'Sélection de cas d\'usage concrets de scraping et automatisation par secteur',
          numberOfItems: topCaseStudies.length,
          items: topCaseStudies.map((cs, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Service',
              name: cs.title,
              description: cs.description,
              url: `${siteConfig.url}/cas-usage/${sectorToSlug(cs.sector)}/${cs.slug}`
            }
          }))
        }}
      />

      <main className="min-w-0 mt-6 flex flex-col">
        <section className="mb-8">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">
            Cas d'usage scraping et automatisation
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 tracking-tight">
            Découvrez comment le <strong className="text-neutral-900 dark:text-neutral-100">scraping</strong> et l'<strong className="text-neutral-900 dark:text-neutral-100">automatisation</strong> peuvent transformer votre business. 
            Plus de <strong className="text-neutral-900 dark:text-neutral-100">6 500+ cas d'usage concrets</strong> par <strong className="text-neutral-900 dark:text-neutral-100">secteur</strong> avec exemples réels et données extractibles.
          </p>
        </section>

        {/* Nouveaux cas d'usage du jour */}
        {todaysCaseStudies.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 tracking-tighter">
              Nouveaux cas d&apos;usage du jour
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
              Derniers cas d&apos;usage générés automatiquement aujourd&apos;hui.
            </p>
            <div className="space-y-4">
              {todaysCaseStudies.map((cs) => (
                <Link
                  key={cs.slug}
                  href={`/cas-usage/${sectorToSlug(cs.sector)}/${cs.slug}`}
                  className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                >
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                    {cs.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed line-clamp-2">
                    {cs.description}
                  </p>
                  <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                        <span
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            window.location.href = `/cas-usage/${sectorToSlug(cs.sector)}`
                          }}
                          className="px-2 py-1 rounded text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                        >
                          {cs.sector}
                        </span>
                        {(cs.examples || []).slice(0, 3).map((example) => (
                          <span
                            key={example}
                            className="px-2 py-0.5 rounded text-xs bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Top 3 Case Studies - EN PREMIER pour maximiser l'engagement */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 tracking-tighter">
            Les plus consultés
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
            Les cas d'usage les plus populaires, basés sur les consultations réelles
          </p>
          <div className="space-y-4">
            {topCaseStudies.length > 0 ? (
              topCaseStudies.map((cs, index) => (
                <Link
                  key={cs.slug}
                  href={`/cas-usage/${sectorToSlug(cs.sector)}/${cs.slug}`}
                  className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
                          #{index + 1}
                        </span>
                        <h3 className="text-lg font-semibold group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                          {cs.title}
                        </h3>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed line-clamp-2">
                        {cs.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Séparateur fin et métadonnées */}
                  <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            window.location.href = `/cas-usage/${sectorToSlug(cs.sector)}`
                          }}
                          className="px-2 py-1 rounded text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                        >
                          {cs.sector}
                        </span>
                        <CaseStudyViewCounter slug={cs.slug} views={viewsMap[cs.slug]} />
                      </div>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-shrink-0">
                        <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))
            ) : null}
          </div>
        </section>

        {/* Liste des secteurs disponibles - Navigation rapide */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4 tracking-tighter">
            Par secteur
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-6">
            Explorez les cas d'usage par secteur d'activité
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sectorsWithCounts
              .filter(item => item.count >= 3) // Afficher uniquement les secteurs avec au moins 3 cas d'usage
              .map(({ sector, count }) => (
                <Link
                  key={sector}
                  href={`/cas-usage/${sectorToSlug(sector)}`}
                  className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors group"
                >
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                    {sector}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500">
                    {count} cas d'usage
                  </p>
                </Link>
              ))}
          </div>
        </section>

        {/* (Recherche détaillée et liste exhaustive sont gérées sur les pages secteur) */}

        {/* CTA */}
        <section className="mb-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center" aria-label="Contact">
          <div className="flex flex-col items-center mb-6">
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
                  <linearGradient id="instagram-gradient-cas-usage-index" x1="0%" y1="0%" x2="100%" y2="100%">
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
                  stroke={videoSeen ? "#a3a3a3" : "url(#instagram-gradient-cas-usage-index)"}
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
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                    </svg>
                  </button>
                  <div style={{ position: 'relative', paddingBottom: '177.78%', height: 0 }}>
                    <iframe
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                      src={videoEmbedUrl}
                      allowFullScreen
                      allowTransparency
                      title="Présentation de Corentin Robert"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <h2 className="font-semibold text-xl mb-4 tracking-tighter">Besoin d'un cas d'usage sur-mesure ?</h2>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
            Si votre secteur ou votre besoin n'est pas couvert, je peux développer une solution adaptée à vos besoins spécifiques.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={openCalendly}
              className="px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              Discutons de votre projet
            </button>
            <Link 
              href={siteConfig.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Me contacter sur LinkedIn
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}

export async function getStaticProps() {
  // Charger depuis Blob Storage avec fallback
  let caseStudies = []
  try {
    caseStudies = await getCaseStudiesFromBlob()
  } catch (error) {
    console.warn('⚠️ Erreur lors du chargement depuis Blob Storage, fallback vers fichier local:', error.message)
    // Fallback vers fichier local
    const { caseStudies: caseStudiesImport } = await import('../../lib/case-studies')
    caseStudies = caseStudiesImport || []
  }
  
  // Vérification de sécurité
  if (!caseStudies || !Array.isArray(caseStudies) || caseStudies.length === 0) {
    console.error('❌ caseStudies est undefined ou vide. Vérifiez lib/case-studies.js')
    return {
      props: {
        topCaseStudies: [],
        sectorsWithCounts: [],
        viewsMap: {}
      },
      revalidate: 3600
    }
  }
  
  // Récupérer les événements de vues pour calculer les vrais "plus consultés"
  const events = await getViewEventsForTop()
  const allViewsMap = {}
  events.forEach(event => {
    if (event.slug) {
      allViewsMap[event.slug] = (allViewsMap[event.slug] || 0) + 1
    }
  })

  // Ajouter les vues aux case studies et trier par popularité
  const caseStudiesWithViews = caseStudies.map(cs => ({
    ...cs,
    views: allViewsMap[cs.slug] || 0
  }))

  const sortedByViews = caseStudiesWithViews
    .sort((a, b) => {
      if (b.views !== a.views) {
        return b.views - a.views
      }
      return a.title.localeCompare(b.title)
    })

  // Top 3 cas d'usage (payload léger, mais basé sur les vues réelles)
  const topCaseStudies = sortedByViews.slice(0, 3).map(cs => ({
    slug: cs.slug,
    title: cs.title,
    description: cs.description,
    sector: cs.sector,
    keywords: cs.keywords || [],
    examples: (cs.examples || []).slice(0, 3),
    views: cs.views
  }))

  // Pré-calculer les secteurs avec leurs comptes (triés par ordre décroissant)
  let sectors = []
  try {
    sectors = await getAllSectors()
  } catch (error) {
    console.warn('⚠️ Erreur lors de la récupération des secteurs depuis Blob Storage, fallback:', error.message)
    sectors = getAllSectorsLocal()
  }
  
  const sectorsWithCounts = await Promise.all(sectors.map(async (sector) => {
    let studies = []
    try {
      studies = await getCaseStudiesBySector(sector)
    } catch (error) {
      studies = getCaseStudiesBySectorLocal(sector)
    }
    return {
      sector,
      count: studies.length
    }
  }))
  
  const filteredSectors = sectorsWithCounts
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count) // Tri décroissant

  // Map des vues seulement pour les top cas d'usage (évite un gros JSON)
  const viewsMap = {}
  topCaseStudies.forEach(cs => {
    viewsMap[cs.slug] = cs.views || 0
  })

  // Cas d'usage générés aujourd'hui (max 3, payload léger)
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const todaysCaseStudies = caseStudies
    .filter(cs => cs.createdAt && cs.createdAt.startsWith(today))
    .slice(0, 3)
    .map(cs => ({
      slug: cs.slug,
      title: cs.title,
      description: cs.description,
      sector: cs.sector,
      examples: (cs.examples || []).slice(0, 3),
    }))

  return {
    props: {
      topCaseStudies,
      sectorsWithCounts: filteredSectors,
      viewsMap,
      todaysCaseStudies,
    },
    revalidate: 3600 // Revalider toutes les heures
  }
}

