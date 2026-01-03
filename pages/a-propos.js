import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import ProjectClickCounter from '../components/ProjectClickCounter'
import { photos } from '../lib/photos'

// Configuration des articles "Leçons apprises" pour les projets arrêtés
// Mettre le slug de l'article quand il sera créé, ou null pour ne pas afficher le lien
const lessonsArticles = {
  instaninja: null, // Exemple: 'instaninja-lecons-apprises'
  rareItemClub: null // Exemple: 'rare-item-club-lecons-apprises'
}

export default function About() {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [itemsPerView, setItemsPerView] = useState(3)
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const scrollContainerRef = useRef(null)
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0)
  
  useEffect(() => {
    setMounted(true)
    
    // Calculer itemsPerView selon la taille de l'écran
    const updateItemsPerView = () => {
      const mobile = window.innerWidth < 640
      setIsMobile(mobile)
      setItemsPerView(mobile ? 1.5 : 3)
    }
    
    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    
    return () => window.removeEventListener('resize', updateItemsPerView)
  }, [])
  
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
  
  // Récupérer les photos les plus récentes pour le teaser (plus que 4 pour le scroll)
  const recentPhotos = photos
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8) // Plus de photos pour permettre le scroll
  
  // Auto-rotation désactivée - utilisation du scroll uniquement

  // Gérer le scroll et mettre à jour les indicateurs
  useEffect(() => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const totalItems = recentPhotos.length + 1 // +1 pour la vidéo
    
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const containerWidth = container.clientWidth
      
      if (isMobile) {
        // Sur mobile, chaque élément fait w-3/5 = 60% de la largeur du conteneur
        const itemWidth = containerWidth * 0.6 // Approximation pour w-3/5
        const gap = 12 // gap-3 = 12px
        const itemWithGap = itemWidth + gap
        
        // Calculer l'index actuel basé sur la position du scroll
        const index = Math.round(scrollLeft / itemWithGap)
        const maxIndex = Math.ceil(totalItems / 1.5) - 1 // itemsPerView = 1.5 sur mobile
        
        setCurrentScrollIndex(Math.min(Math.max(0, index), maxIndex))
      } else {
        // Sur desktop, chaque élément fait 40% de la largeur visible
        const itemWidth = containerWidth * 0.4
        const gap = 12 // gap-3 = 12px
        const itemWithGap = itemWidth + gap
        
        // Calculer l'index actuel basé sur la position du scroll
        const index = Math.round(scrollLeft / itemWithGap)
        const maxIndex = totalItems - 1
        
        setPhotoIndex(Math.min(Math.max(0, index), maxIndex))
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
  }, [isMobile, recentPhotos.length, itemsPerView])

  // Calculer les valeurs pour le carousel desktop
  const totalItems = recentPhotos.length + 1
  const totalPages = Math.ceil(totalItems / itemsPerView)
  
  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.aPropos.title,
    description: siteConfig.seo.pages.aPropos.description,
    path: '/a-propos',
    keywords: siteConfig.seo.pages.aPropos.keywords
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      
      {/* Review Schema 5* par défaut */}
      <StructuredData
        type="Review"
        data={{
          itemReviewed: {
            '@type': 'Service',
            name: 'Services de Scraping et Automatisation',
            provider: {
              '@type': 'Person',
              name: siteConfig.author,
              url: `${siteConfig.url}/a-propos`
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
          reviewBody: 'Expert freelance en scraping et automatisation. 424+ projets réalisés, 5/5 sur Malt. Parcours de growth marketeux chez Airbnb à entrepreneur indépendant.',
          datePublished: new Date().toISOString().split('T')[0]
        }}
      />
      
      <StructuredData type="Person" data={{
        name: siteConfig.author,
        description: siteConfig.seo.pages.aPropos.description,
        url: `${siteConfig.url}/a-propos`,
        jobTitle: 'Freelance en Scraping et Automatisation',
        knowsAbout: ['Web Scraping', 'Data Automation', 'Outbound Marketing', 'Python', 'JavaScript', 'API Development'],
        alumniOf: {
          '@type': 'EducationalOrganization',
          name: 'HETIC',
          description: 'Formation en développement web et entrepreneuriat'
        },
        sameAs: [
          siteConfig.social.linkedin,
          siteConfig.social.malt,
          'https://apify.com?fpr=0n7ukq',
          'https://github.com/rcoco78'
        ]
      }} />
      <StructuredData type="VideoObject" data={{
        name: 'Présentation de Corentin Robert - Freelance Scraping et Automatisation',
        description: 'Découvrez mon parcours de growth marketeux chez Airbnb à entrepreneur indépendant, spécialisé en scraping et automatisation.',
        videoId: '53pisKcp9Vc',
        thumbnailUrl: 'https://img.youtube.com/vi/53pisKcp9Vc/maxresdefault.jpg',
        contentUrl: 'https://www.youtube.com/watch?v=53pisKcp9Vc',
        embedUrl: 'https://www.youtube.com/embed/53pisKcp9Vc'
      }} />
      <StructuredData type="BreadcrumbList" data={{
        items: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: siteConfig.url
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'À propos',
            item: `${siteConfig.url}/a-propos`
          }
        ]
      }} />
    <main className="flex-auto min-w-0 mt-6 flex flex-col">
      {/* Section Narrative */}
      <section className="mb-16" aria-label="Présentation personnelle">
        <h1 className="font-semibold text-2xl mb-8 tracking-tighter">À propos</h1>
        
        <p className="mb-8 text-neutral-600 dark:text-neutral-400 tracking-tight">
          De growth marketeux chez Airbnb à entrepreneur indépendant, je me suis spécialisé en <strong className="text-neutral-900 dark:text-neutral-100">scraping</strong>, <strong className="text-neutral-900 dark:text-neutral-100">automatisation</strong> et <strong className="text-neutral-900 dark:text-neutral-100">outbound marketing</strong>. J'accompagne les dirigeants à gagner du temps et acquérir les bonnes pratiques sur ces sujets. 28 ans, Parisien. Le week-end, je développe <Link href="https://logement-atypique.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"><strong className="text-neutral-900 dark:text-neutral-100">Logement Atypique</strong></Link> avec mon frère — on parcourt la France pour mettre en avant des logements d'exception.
        </p>
        
        <div className="mb-8 space-y-6">
          <div>
            <p className="text-neutral-600 dark:text-neutral-400 tracking-tight mt-2">
              En dehors du code, j'ai longtemps pratiqué le Handball et je continue aujourd'hui avec le running et l'Hyrox. Et je me suis pris de passion pour les échecs sur mon temps libre.
            </p>
          </div>
          
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Pour aller plus loin : <Link href="/blog" className="underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">mes articles</Link>, <Link href="/newsletter" className="underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">la newsletter</Link>, <Link href="/marketplace" className="underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">la marketplace</Link>, <Link href="/temoignages" className="underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">les témoignages clients</Link> ou <Link href="/faq" className="underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">la FAQ</Link>.
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Curieux de savoir ce que j'écoute ? <Link href="/spotify" className="underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors inline-flex items-center gap-1.5 group/link">
                Découvrez mes playlists et artistes favoris
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">
                  <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                </svg>
              </Link>.
            </p>
          </div>
        </div>
        
        {/* Section Photos et Vidéos */}
        <div className="mb-8" aria-label="Photos et vidéos">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold text-xl mb-1 tracking-tighter">Photos et vidéos</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Quelques moments capturés au fil du temps
              </p>
            </div>
            <Link
              href="/photos"
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors self-start sm:self-auto flex items-center gap-1.5 group"
              aria-label="Voir toutes les photos"
            >
              Voir toutes
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
              </svg>
            </Link>
          </div>
          <div className="relative overflow-hidden">
            <div 
              ref={scrollContainerRef}
              className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {/* Vidéo YouTube en première position */}
              <div className="relative flex-shrink-0 w-3/5 sm:w-[40%] aspect-[9/16] overflow-hidden rounded-lg snap-start">
                <iframe
                  src="https://www.youtube.com/embed/53pisKcp9Vc?rel=0&modestbranding=1"
                  title="Présentation de Corentin Robert - Freelance Scraping et Automatisation"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                  loading="lazy"
                />
              </div>
              
              {/* Photos */}
              {recentPhotos.map((photo, index) => (
                <Link
                  key={index}
                  href="/photos"
                  className="group relative flex-shrink-0 w-3/5 sm:w-[40%] aspect-[9/16] overflow-hidden rounded-lg snap-start"
                  aria-label={photo.alt || `Photo ${index + 1} - ${photo.location || 'Moment capturé'}`}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt || `Photo ${photo.location ? `à ${photo.location}` : 'Moment capturé'}`}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </Link>
              ))}
            </div>
            
            {/* Indicateurs de navigation */}
            {(recentPhotos.length + 1) > (isMobile ? 1.5 : 1) && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: recentPhotos.length + 1 }).map((_, index) => {
                  const isActive = isMobile ? currentScrollIndex === index : photoIndex === index
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (scrollContainerRef.current) {
                          const container = scrollContainerRef.current
                          const containerWidth = container.clientWidth
                          
                          if (isMobile) {
                            const itemWidth = containerWidth * 0.6
                            const gap = 12
                            const scrollPosition = index * (itemWidth + gap)
                            container.scrollTo({ left: scrollPosition, behavior: 'smooth' })
                          } else {
                            // Sur desktop, chaque élément fait 40% de la largeur visible
                            const itemWidth = containerWidth * 0.4
                            const gap = 12
                            const scrollPosition = index * (itemWidth + gap)
                            container.scrollTo({ left: scrollPosition, behavior: 'smooth' })
                            setPhotoIndex(index)
                          }
                        }
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        isActive
                          ? 'w-6 bg-neutral-900 dark:bg-neutral-100'
                          : 'w-1.5 bg-neutral-300 dark:bg-neutral-700'
                      }`}
                      aria-label={`Aller aux photos ${index + 1}`}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section Parcours */}
      <section className="mb-16" aria-label="Parcours professionnel">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Parcours</h2>
        <div className="space-y-8">
          {/* Projets entrepreneuriaux */}
          <div>
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wide">Projets entrepreneuriaux</h3>
            <div className="relative pl-4 sm:pl-6">
              {/* Ligne verticale en pointillés */}
              <div className="absolute left-0 top-0 bottom-0 w-[1px]" style={{ background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 4px, rgb(212 212 212) 4px, rgb(212 212 212) 8px)' }}></div>
              <div className="absolute left-0 top-0 bottom-0 w-[1px] hidden dark:block" style={{ background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 4px, rgb(64 64 64) 4px, rgb(64 64 64) 8px)' }}></div>
              <div className="space-y-6">
                <div className="relative flex flex-col sm:flex-row sm:gap-4">
                  {/* Point sur la ligne - vert pour projet actif */}
                  <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-green-500 border-2 border-white dark:border-neutral-900 z-10" title="Projet actif">
                    <span className="absolute -inset-0.5 inline-flex rounded-full bg-green-400 opacity-40 animate-ping"></span>
                  </div>
                  <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0 sm:pl-4">2025–Présent</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1 flex items-center gap-2">
                      <Link 
                        href="https://logement-atypique.fr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors group/link"
                      >
                        <span>Logement Atypique</span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 flex-shrink-0">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                      </Link>
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                      On met en avant +2000 logements atypiques — tiny houses, villas d'architecte, châteaux...
                    </p>
                  </div>
                </div>
                <div className="relative flex flex-col sm:flex-row sm:gap-4">
                  {/* Point sur la ligne - vert pour projet actif */}
                  <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-green-500 border-2 border-white dark:border-neutral-900 z-10" title="Projet actif">
                    <span className="absolute -inset-0.5 inline-flex rounded-full bg-green-400 opacity-40 animate-ping"></span>
                  </div>
                  <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0 sm:pl-4">2023–Présent</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1 flex items-center gap-2">
                      <Link 
                        href={siteConfig.social.malt}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors group/link"
                      >
                        <span>Freelance en scraping et automatisation</span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 flex-shrink-0">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                      </Link>
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                      160+ missions Malt finalisées • +250 missions Fiverr finalisées • +300 clients accompagnés
                    </p>
                  </div>
                </div>
                <div className="relative flex flex-col sm:flex-row sm:gap-4">
                  <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100 border-2 border-white dark:border-neutral-900 z-10"></div>
                  <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0 sm:pl-4">2022</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1">Rare Item Club</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-1">
                      Achat-revente de sneakers "rares" via Vinted, Leboncoin, Ebay
                    </p>
                    {lessonsArticles.rareItemClub && (
                      <Link 
                        href={`/blog/${lessonsArticles.rareItemClub}`} 
                        className="text-xs text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                      >
                        Leçons apprises
                      </Link>
                    )}
                  </div>
                </div>
                <div className="relative flex flex-col sm:flex-row sm:gap-4">
                  <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100 border-2 border-white dark:border-neutral-900 z-10"></div>
                  <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0 sm:pl-4">2018-2019</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1">InstaNinja</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-1">
                      Automatisation de compte Instagram — +400 clients total, 10K€ MRR
                    </p>
                    {lessonsArticles.instaninja && (
                      <Link 
                        href={`/blog/${lessonsArticles.instaninja}`} 
                        className="text-xs text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                      >
                        Leçons apprises
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expériences salariées */}
          <div>
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wide">Expériences salariées</h3>
            <div className="relative pl-4 sm:pl-6">
              {/* Ligne verticale en pointillés */}
              <div className="absolute left-0 top-0 bottom-0 w-[1px]" style={{ background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 4px, rgb(212 212 212) 4px, rgb(212 212 212) 8px)' }}></div>
              <div className="absolute left-0 top-0 bottom-0 w-[1px] hidden dark:block" style={{ background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 4px, rgb(64 64 64) 4px, rgb(64 64 64) 8px)' }}></div>
              <div className="space-y-6">
                <div className="relative flex flex-col sm:flex-row sm:gap-4">
                  <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100 border-2 border-white dark:border-neutral-900 z-10"></div>
                  <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0 sm:pl-4">2023</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1">White Bird</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">Growth, pilotage du marketing pour le développement de réseau de franchises</p>
                  </div>
                </div>
                <div className="relative flex flex-col sm:flex-row sm:gap-4">
                  <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100 border-2 border-white dark:border-neutral-900 z-10"></div>
                  <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0 sm:pl-4">2021</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1">Shine</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">Déploiement de dashboards et projets pour intégrer Legalplace au sein de Shine, permettant aux équipes Sales et Support d'avoir l'ensemble des données au bon endroit</p>
                  </div>
                </div>
                <div className="relative flex flex-col sm:flex-row sm:gap-4">
                  <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100 border-2 border-white dark:border-neutral-900 z-10"></div>
                  <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0 sm:pl-4">2020</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1">Pappernest</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">Growth Analyst — analyse et amélioration des publicités Facebook Ads</p>
                  </div>
                </div>
                <div className="relative flex flex-col sm:flex-row sm:gap-4">
                  <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100 border-2 border-white dark:border-neutral-900 z-10"></div>
                  <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0 sm:pl-4">2017</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1">Airbnb</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">En charge du développement d'Airbnb Experiences pour la France et Middle East & Africa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formation */}
          <div>
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wide">Formation</h3>
            <div className="relative pl-4 sm:pl-6">
              {/* Ligne verticale en pointillés */}
              <div className="absolute left-0 top-0 bottom-0 w-[1px]" style={{ background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 4px, rgb(212 212 212) 4px, rgb(212 212 212) 8px)' }}></div>
              <div className="absolute left-0 top-0 bottom-0 w-[1px] hidden dark:block" style={{ background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 4px, rgb(64 64 64) 4px, rgb(64 64 64) 8px)' }}></div>
              <div className="space-y-6">
                <div className="relative flex flex-col sm:flex-row sm:gap-4">
                  <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100 border-2 border-white dark:border-neutral-900 z-10"></div>
                  <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0 sm:pl-4">2020-2021</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1">HETIC</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">Développement web, marketing digital et UX design</p>
                  </div>
                </div>
                <div className="relative flex flex-col sm:flex-row sm:gap-4">
                  <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100 border-2 border-white dark:border-neutral-900 z-10"></div>
                  <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0 sm:pl-4">2015-2018</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1">EDC Paris Business School</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">École de commerce post-bac</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Projets */}
      <section className="mb-16" aria-label="Projets clés">
        <h2 className="font-semibold text-xl tracking-tighter mb-6">Mes Projets Clés</h2>
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
      </section>

      {/* Call-to-Action */}
      <section className="mb-16 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center" aria-label="Contact">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Discutons de votre projet</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Réservez un créneau ou contactez-moi directement.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={openCalendly}
            disabled={!mounted}
            className="px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Réserver un créneau
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
