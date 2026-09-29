import Link from 'next/link'
import { useState, useEffect } from 'react'
import LookAtAvatar from '../components/LookAtAvatar'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import ContentListRow from '../components/ContentListRow'
import { openCalendlyPopup } from '../lib/calendly'

function trackProjectClick(project) {
  if (!project?.link || !project?.id) return
  const timestamp = Date.now()
  const data = JSON.stringify({ projectId: project.id, timestamp })
  if (navigator.sendBeacon) {
    const blob = new Blob([data], { type: 'application/json' })
    navigator.sendBeacon(`/api/projects/click?t=${timestamp}`, blob)
  } else {
    fetch(`/api/projects/click?t=${timestamp}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      body: data,
      keepalive: true,
    }).catch((err) => console.error('Error tracking click:', err))
  }
}

function NetworkLogo({ node }) {
  if (!node?.icon) return null
  return (
    <span
      className={`inline-flex w-6 h-6 shrink-0 items-center justify-center overflow-hidden ${
        node.iconShape === 'round' ? '' : 'rounded-md'
      } ${node.iconOnDark === 'plate' ? 'dark:bg-white dark:p-[3px]' : ''}`}
    >
      <img
        src={node.icon}
        alt=""
        width={24}
        height={24}
        className={`w-full h-full ${
          node.iconShape === 'round' ? 'rounded-full object-cover' : 'rounded-md object-contain'
        }`}
      />
    </span>
  )
}

function TimelineDot({ active }) {
  if (active) {
    return (
      <div
        className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-green-500 border-2 border-white dark:border-neutral-900 z-10"
        title="Projet actif"
      >
        <span className="absolute -inset-0.5 inline-flex rounded-full bg-green-400 opacity-40 animate-ping"></span>
      </div>
    )
  }
  return (
    <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100 border-2 border-white dark:border-neutral-900 z-10"></div>
  )
}

function TimelineItem({ dates, title, href, role, description, logo, active, children }) {
  const heading = href ? (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors group/link"
    >
      {logo}
      <span>{title}</span>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 flex-shrink-0">
        <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
      </svg>
    </Link>
  ) : (
    <span className="flex items-center gap-1.5">
      {logo}
      <span>{title}</span>
    </span>
  )

  return (
    <div className="relative flex flex-col sm:flex-row sm:gap-4">
      <TimelineDot active={active} />
      <div className="w-full sm:w-40 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0 sm:pl-4">
        {dates}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium mb-1 flex items-center gap-2">{heading}</h3>
        {role && (
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">{role}</p>
        )}
        {description && (
          <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">{description}</p>
        )}
        {children}
      </div>
    </div>
  )
}

// Configuration des articles "Leçons apprises" pour les projets arrêtés
// Mettre le slug de l'article quand il sera créé, ou null pour ne pas afficher le lien
const lessonsArticles = {
  instaninja: null, // Exemple: 'instaninja-lecons-apprises'
  rareItemClub: null // Exemple: 'rare-item-club-lecons-apprises'
}

export default function About() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const openCalendly = () => openCalendlyPopup('about')

  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.aPropos.title,
    description: siteConfig.seo.pages.aPropos.description,
    path: '/a-propos',
    keywords: siteConfig.seo.pages.aPropos.keywords
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      
      <StructuredData type="Person" data={{
        name: siteConfig.author,
        description: siteConfig.seo.pages.aPropos.description,
        url: `${siteConfig.url}/a-propos`,
        jobTitle: 'Fondateur · Outreacher · Datareacher · Logement Atypique',
        knowsAbout: ['Web Scraping', 'Data Automation', 'Outbound Marketing', 'Python', 'JavaScript', 'API Development'],
        alumniOf: {
          '@type': 'EducationalOrganization',
          name: 'HETIC',
          description: 'Formation en développement web et entrepreneuriat'
        },
        sameAs: [
          siteConfig.social.linkedin,
          siteConfig.social.malt,
          siteConfig.network.datareacher.href,
          siteConfig.network.outreacher.href,
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
        
        <p className="mb-3 text-neutral-800 dark:text-neutral-200 tracking-tight font-medium">
          Fondateur · Outreacher · Datareacher · Logement Atypique.
        </p>
        <p className="mb-3 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Ici, c&apos;est le journal. Je scrappe, j&apos;automatise, je livre de la data. Pour des dirigeants qui veulent des résultats — pas une stack à gérer.
        </p>
        <p className="mb-8 text-sm text-neutral-500 dark:text-neutral-500 tracking-tight">
          28 ans, Paris. Avant : growth chez Airbnb, Shine, papernest. Aujourd&apos;hui : trois casquettes fondateur, plus le freelance.
        </p>

        <div className="mb-8 space-y-6">
          <div>
            <p className="text-neutral-600 dark:text-neutral-400 tracking-tight mt-2">
              Hors code : handball pendant longtemps, running et Hyrox maintenant. Et les échecs, le soir.
            </p>
          </div>
          
          <div className="pt-4 journal-rule">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Ce que j&apos;écoute en ce moment → <Link href="/spotify" className="underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors inline-flex items-center gap-1.5 group/link">
                playlists &amp; artistes
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">
                  <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                </svg>
              </Link>
            </p>
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
                <TimelineItem
                  dates="mars 2024 – aujourd’hui"
                  title="Outreacher"
                  href={siteConfig.network.outreacher.href}
                  role="Fondateur"
                  description="Une campagne en 14 jours. On la monte ensemble. C’est toi qui envoies."
                  logo={<NetworkLogo node={siteConfig.network.outreacher} />}
                  active
                />
                <TimelineItem
                  dates="sept. 2026 – aujourd’hui"
                  title="Datareacher"
                  href={siteConfig.network.datareacher.href}
                  role="Fondateur"
                  description="Tu as ta liste. Ce soir."
                  logo={<NetworkLogo node={siteConfig.network.datareacher} />}
                  active
                />
                <TimelineItem
                  dates="sept. 2025 – aujourd’hui"
                  title="Logement Atypique"
                  href="https://logement-atypique.fr"
                  role="Fondateur"
                  description="On sublime les lieux atypiques. Photo, vidéo, visibilité. Avec Siméon."
                  logo={<NetworkLogo node={siteConfig.network.logement} />}
                  active
                />
                <TimelineItem
                  dates="2023 – aujourd’hui"
                  title="Freelance en scraping et automatisation"
                  href={siteConfig.social.malt}
                  description="160+ missions Malt finalisées • +250 missions Fiverr finalisées • +300 clients accompagnés"
                  active
                />
                <TimelineItem
                  dates="mars 2022 – août 2023"
                  title="Rare Item Club"
                  role="Fondateur"
                  description="Achat-revente de sneakers « rares » via Vinted, Leboncoin, Ebay"
                >
                  {lessonsArticles.rareItemClub && (
                    <Link
                      href={`/blog/${lessonsArticles.rareItemClub}`}
                      className="text-xs text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                    >
                      Leçons apprises
                    </Link>
                  )}
                </TimelineItem>
                <TimelineItem
                  dates="mai 2018 – août 2019"
                  title="InstaNinja"
                  role="Fondateur"
                  description="Automatisation de compte Instagram — +400 clients total, 10K€ MRR"
                >
                  {lessonsArticles.instaninja && (
                    <Link
                      href={`/blog/${lessonsArticles.instaninja}`}
                      className="text-xs text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                    >
                      Leçons apprises
                    </Link>
                  )}
                </TimelineItem>
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
                <TimelineItem
                  dates="2023"
                  title="White Bird"
                  role="Growth"
                  description="Pilotage du marketing pour le développement de réseau de franchises"
                />
                <TimelineItem
                  dates="févr. 2021 – févr. 2022"
                  title="Shine"
                  role="Growth"
                  description="Déploiement de dashboards et projets pour intégrer Legalplace au sein de Shine, pour que les équipes Sales et Support aient l’ensemble des données au bon endroit"
                />
                <TimelineItem
                  dates="juin 2020 – déc. 2020"
                  title="papernest"
                  role="Growth"
                  description="Analyse et amélioration des publicités Facebook Ads"
                />
                <TimelineItem
                  dates="janv. 2018 – juil. 2018"
                  title="Airbnb"
                  role="Growth"
                  description="Développement d’Airbnb Experiences pour la France et Middle East & Africa"
                />
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

      {/* Section Partenaires */}
      <section className="mb-16" aria-label="Partenaires">
        <h2 className="font-semibold text-xl tracking-tighter mb-6">Partenaires</h2>
        <div className="flex flex-col">
          {siteConfig.projects
            .filter((project) => {
              const partnerIds = ['contributeurs-apify', 'lemlist', 'zapmail']
              return project.status === 'active' && partnerIds.includes(project.id)
            })
            .map((project) => (
              <ContentListRow
                key={project.id || project.title}
                href={project.link || null}
                title={project.title}
                meta="Partenaire"
                description={project.description}
                onClick={project.link ? () => trackProjectClick(project) : undefined}
              />
            ))}
        </div>
      </section>

      {/* Call-to-Action */}
      <section className="mb-16 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center" aria-label="Contact">
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <LookAtAvatar
              src={siteConfig.profileImage}
              alt="Photo de profil de Corentin Robert"
              size={64}
              objectPosition="center 28%"
              lookBasePath={siteConfig.profileLook?.basePath}
              lookDirections={siteConfig.profileLook?.directions || []}
              lookExt={siteConfig.profileLook?.ext || 'jpg'}
              showRing
            />
          </div>
          <h2 className="font-semibold text-xl mb-4 tracking-tighter">Discutons de votre projet</h2>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
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
