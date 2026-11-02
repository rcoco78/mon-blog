import Link from 'next/link'
import { useState, useEffect } from 'react'
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

function Mark({ icon, iconOnDark, iconShape }) {
  if (!icon) return null
  return (
    <span
      className={`mt-0.5 inline-flex w-6 h-6 shrink-0 items-center justify-center overflow-hidden ${
        iconShape === 'round' ? '' : 'rounded-md'
      } ${iconOnDark === 'plate' ? 'dark:bg-white dark:p-[3px]' : ''}`}
    >
      <img
        src={icon}
        alt=""
        width={24}
        height={24}
        className={`w-full h-full ${
          iconShape === 'round' ? 'rounded-full object-cover' : 'rounded-md object-contain'
        }`}
      />
    </span>
  )
}

function FactLine({ dates, title, href, detail, icon, iconOnDark, children }) {
  const name = href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
      {title}
    </a>
  ) : (
    <span>{title}</span>
  )

  return (
    <li className="relative py-4 text-neutral-800 dark:text-neutral-200 tracking-tight">
      <p className="text-sm text-neutral-500 dark:text-neutral-500 tabular-nums">{dates}</p>
      <p className="mt-1 flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
        <Mark icon={icon} iconOnDark={iconOnDark} />
        {name}
      </p>
      {detail ? (
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">{detail}</p>
      ) : null}
      {children ? <div className="mt-1">{children}</div> : null}
    </li>
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
        jobTitle: 'Fondateur · Outreacher · Datareacher · Immoreacher · Logement Atypique',
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
          siteConfig.network.immoreacher.href,
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
          Fondateur · Outreacher · Datareacher · Immoreacher · Logement Atypique.
        </p>
        <p className="mb-3 text-neutral-600 dark:text-neutral-400 tracking-tight">
          Ici, c&apos;est le journal. Je scrappe, j&apos;automatise, je livre de la data. Pour des dirigeants qui veulent des résultats — pas une stack à gérer.
        </p>
        <p className="mb-8 text-sm text-neutral-500 dark:text-neutral-500 tracking-tight">
          28 ans, Paris. Avant : growth chez Airbnb, Shine, papernest. Aujourd&apos;hui : quatre casquettes fondateur, plus le freelance.
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
        <ul className="border-l border-dashed border-neutral-300 dark:border-neutral-700 pl-5">
          <FactLine dates="nov. 2026 – aujourd’hui" title="Immoreacher" href={siteConfig.network.immoreacher.href} icon={siteConfig.network.immoreacher.icon} iconOnDark={siteConfig.network.immoreacher.iconOnDark} detail="La liste du matin. Mandataires et agences, à jour chaque jour." />
          <FactLine dates="sept. 2026 – aujourd’hui" title="Datareacher" href={siteConfig.network.datareacher.href} icon={siteConfig.network.datareacher.icon} iconOnDark={siteConfig.network.datareacher.iconOnDark} detail="Tu as ta liste. Ce soir." />
          <FactLine dates="sept. 2025 – aujourd’hui" title="Logement Atypique" href="https://logement-atypique.fr" icon={siteConfig.network.logement.icon} iconOnDark={siteConfig.network.logement.iconOnDark} detail="Lieux atypiques, photo et vidéo, avec Siméon." />
          <FactLine dates="mars 2024 – aujourd’hui" title="Outreacher" href={siteConfig.network.outreacher.href} icon={siteConfig.network.outreacher.icon} iconOnDark={siteConfig.network.outreacher.iconOnDark} detail="Une campagne en 14 jours. C’est toi qui envoies." />
          <FactLine dates="2023 – aujourd’hui" title="Freelance" href={siteConfig.social.malt} detail="160+ missions Malt · +250 missions Fiverr · +300 clients." />
          <FactLine dates="2023" title="White Bird" detail="Growth. Réseau de franchises." />
          <FactLine dates="mars 2022 – août 2023" title="Rare Item Club" detail="Achat-revente de sneakers via Vinted, Leboncoin, Ebay.">
            {lessonsArticles.rareItemClub && (
              <Link href={`/blog/${lessonsArticles.rareItemClub}`} className="underline underline-offset-2">
                Leçons apprises
              </Link>
            )}
          </FactLine>
          <FactLine dates="févr. 2021 – févr. 2022" title="Shine" detail="Growth. Données Sales et Support après l’intégration de Legalplace." />
          <FactLine dates="2020-2021" title="HETIC" detail="Développement web, marketing digital et UX design." />
          <FactLine dates="juin 2020 – déc. 2020" title="papernest" detail="Growth. Publicités Facebook Ads." />
          <FactLine dates="mai 2018 – août 2019" title="InstaNinja" detail="Automatisation de compte Instagram — +400 clients, 10K€ MRR.">
            {lessonsArticles.instaninja && (
              <Link href={`/blog/${lessonsArticles.instaninja}`} className="underline underline-offset-2">
                Leçons apprises
              </Link>
            )}
          </FactLine>
          <FactLine dates="janv. 2018 – juil. 2018" title="Airbnb" detail="Growth. Airbnb Experiences, France et Middle East & Africa." />
          <FactLine dates="2015-2018" title="EDC Paris Business School" detail="École de commerce post-bac." />
        </ul>
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
                clampDescription={false}
                mark={
                  <Mark
                    icon={project.icon}
                    iconOnDark={project.iconOnDark}
                  />
                }
                onClick={project.link ? () => trackProjectClick(project) : undefined}
              />
            ))}
        </div>
      </section>

      {/* Call-to-Action */}
      <p className="mb-16 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 tracking-tight">
        Vingt minutes pour cadrer le projet.{' '}
        <button
          type="button"
          onClick={openCalendly}
          disabled={!mounted}
          className="underline underline-offset-2 text-neutral-900 dark:text-neutral-100 disabled:opacity-50"
        >
          Réserver un appel
        </button>
        {' · '}
        <Link href={siteConfig.social.linkedin} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          LinkedIn
        </Link>.
      </p>
    </main>
    </>
  )
} 
