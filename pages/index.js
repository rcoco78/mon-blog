import Link from 'next/link'
import Image from 'next/image'
import { getAllPosts } from '../lib/notion'
import { fetchHomeData } from '../lib/home-data'
import { useState, useEffect } from 'react'
import { siteConfig } from '../lib/config'
import { sectorToSlug } from '../lib/case-studies-helpers'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import DatabaseListRow from '../components/marketplace/DatabaseListRow'
import ContentListRow, { ContentListRowSkeleton } from '../components/ContentListRow'
import { testimonials } from '../lib/testimonials'
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
  const [topCaseStudies] = useState(homeData?.topCaseStudies ?? [])
  const [topCaseStudiesLoading] = useState(false)
  const [projectClicks, setProjectClicks] = useState({})
  const [showVideo, setShowVideo] = useState(false)
  const [videoSeen, setVideoSeen] = useState(false)
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
        
        {/* Métriques de confiance — lignes, comme le reste du blog */}
        <div className="mb-6 md:mb-8" aria-label="Métriques de confiance">
          <div className="flex flex-col">
            {metrics.map((metric, index) => {
              const trailing =
                metric.label === 'projets réalisés' && metric.breakdown
                  ? `${metric.value} (${metric.breakdown.malt} + ${metric.breakdown.fiverr})`
                  : metric.value
              return (
                <ContentListRow
                  key={metric.label || index}
                  href={metric.href || null}
                  title={metric.label}
                  meta={metric.source || null}
                  trailing={trailing}
                />
              )
            })}
          </div>
        </div>
      </section>

      {/* Séparateur visuel — zone Présentation */}
      <hr className="my-6 border-t border-neutral-200 dark:border-neutral-800" role="presentation" />

      {/* Témoignages — liste alignée marketplace */}
      {(() => {
        const homeTestimonials = [...testimonials]
          .sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished))
          .slice(0, 5)
        return (
      <section className="relative" aria-label="Témoignages clients">
        <h2 className="font-semibold text-xl mb-2 tracking-tighter">Témoignages</h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Avis clients Malt, Fiverr et LinkedIn.
        </p>
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border-t border-neutral-200 dark:border-neutral-800">
          {homeTestimonials.map((t, i) => (
            <blockquote key={`${t.authorName}-${t.datePublished}-${i}`} className="py-5">
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                « {t.reviewBody} »
              </p>
              <footer className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-500">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {t.authorName}
                </span>
                {t.authorJob && <span>{t.authorJob}</span>}
                {t.source && <span>{t.source}</span>}
              </footer>
            </blockquote>
          ))}
        </div>

        <div className="mt-6 text-center">
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
        <div className="flex flex-col">
          {siteConfig.projects.filter(project => {
            const partnerIds = ['contributeurs-apify', 'lemlist', 'zapmail']
            return project.status === 'active' && !partnerIds.includes(project.id)
          }).sort((a, b) => {
            const af = a.featured ? 0 : 1
            const bf = b.featured ? 0 : 1
            return af - bf
          }).map((project) => {
            const handleClick = () => {
              if (!project.link || !project.id) return
              const timestamp = Date.now()
              const data = JSON.stringify({ projectId: project.id, timestamp })
              if (navigator.sendBeacon) {
                const blob = new Blob([data], { type: 'application/json' })
                navigator.sendBeacon(`/api/projects/click?t=${timestamp}`, blob)
              } else {
                fetch(`/api/projects/click?t=${timestamp}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                  },
                  body: data,
                  keepalive: true,
                }).catch((err) => console.error('Error tracking click:', err))
              }
            }

            const clicks = project.id != null ? projectClicks[project.id] : null
            const trailing =
              typeof clicks === 'number'
                ? `${clicks.toLocaleString('fr-FR')} clic${clicks === 1 ? '' : 's'}`
                : null

            return (
              <ContentListRow
                key={project.id || project.title}
                href={project.link || null}
                title={project.title}
                meta={project.status === 'active' ? 'Actif' : null}
                description={project.description}
                trailing={trailing}
                onClick={project.link ? handleClick : undefined}
              />
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
        <div className="flex flex-col">
          {(() => {
            const topDatabases = (dynamicDatabases || []).slice(0, 3)
            return topDatabases.map((tool) => (
            <DatabaseListRow key={tool.slug || tool.name} tool={tool} />
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
        <div className="flex flex-col">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <ContentListRowSkeleton key={i} />)
          ) : topPosts.length > 0 ? (
            topPosts.map((post) => {
              const d = new Date(post.date)
              const dateLabel = Number.isNaN(d.getTime())
                ? null
                : d.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
              const views = post.views ?? 0
              return (
                <ContentListRow
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  title={post.title}
                  meta={dateLabel}
                  description={post.metaDescription || null}
                  trailing={`${views.toLocaleString('fr-FR')} vue${views === 1 ? '' : 's'}`}
                />
              )
            })
          ) : (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 py-4">
              Aucun article disponible pour le moment.
            </p>
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
        <div className="flex flex-col">
          {topCaseStudiesLoading ? (
            Array.from({ length: 3 }).map((_, i) => <ContentListRowSkeleton key={i} />)
          ) : topCaseStudies.length > 0 ? (
            topCaseStudies.map((cs) => (
              <ContentListRow
                key={cs.slug}
                href={`/cas-usage/${sectorToSlug(cs.sector || '')}/${cs.slug}`}
                title={cs.title}
                meta={cs.sector || null}
                description={cs.description || null}
              />
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