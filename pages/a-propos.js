import Link from 'next/link'
import Image from 'next/image'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import ProjectClickCounter from '../components/ProjectClickCounter'

export default function About() {
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
        url: `${siteConfig.url}/a-propos`
      }} />
      <StructuredData type="VideoObject" data={{
        name: 'Présentation de Corentin Robert - Consultant Scraping et Automatisation',
        description: 'Découvrez mon parcours de développeur chez Airbnb à entrepreneur indépendant, spécialisé en scraping et automatisation.',
        videoId: '53pisKcp9Vc',
        thumbnailUrl: 'https://img.youtube.com/vi/53pisKcp9Vc/maxresdefault.jpg',
        contentUrl: 'https://www.youtube.com/watch?v=53pisKcp9Vc',
        embedUrl: 'https://www.youtube.com/embed/53pisKcp9Vc'
      }} />
    <main className="flex-auto min-w-0 mt-6 flex flex-col">
      {/* Section Narrative */}
      <section className="mb-16">
        <h1 className="font-semibold text-2xl mb-8 tracking-tighter">À propos</h1>
        <p className="mb-8 text-neutral-900 dark:text-neutral-100 tracking-tight">
          28 ans, Parisien de naissance. Après plusieurs expériences en startup, je mets aujourd'hui mes compétences au service de fondateurs autour du scraping et de l'automatisation. Le week-end, je pars filmer des logements atypiques avec mon frère — une aventure familiale qui nous passionne.
        </p>
        
        {/* Section Vidéo YouTube */}
        <div className="mb-8">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg">
            <iframe
              src="https://www.youtube.com/embed/53pisKcp9Vc?rel=0&modestbranding=1"
              title="Présentation de Corentin Robert - Consultant Scraping et Automatisation"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Section Parcours */}
      <section className="mb-16">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Parcours</h2>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:gap-6">
            <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0">2023–present</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium mb-1">Freelance</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                160+ missions Malt finalisées • +250 missions Fiverr finalisées • +300 clients accompagnés
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-6">
            <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0">2022</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium mb-1">White Bird</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">Growth engineer au service d'une équipe marketing</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-6">
            <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0">2021</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium mb-1">Shine</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">Growth engineer au service d'une équipe marketing</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-6">
            <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0">2020-2021</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium mb-1">HETIC</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">Formation en développement web et entrepreneuriat</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-6">
            <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm text-neutral-500 mb-1 sm:mb-0 tabular-nums pl-0">2019</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium mb-1">Airbnb</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">Growth engineer au service d'une équipe marketing</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Projets */}
      <section className="mb-16">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Mes Projets Clés</h2>
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

      {/* Section Témoignages */}
      <section className="mb-16">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Témoignages</h2>
        <div className="space-y-6">
          {/* LinkedIn */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-start justify-between mb-4">
              <p className="text-neutral-900 dark:text-neutral-100 italic flex-1">
                "J'ai eu le plaisir de travailler avec Corentin dans le cadre de l'automatisation de plusieurs tâches. Très à l'écoute, il a su comprendre et détecter nos besoins immédiatement, avec une vraie capacité d'analyse et une grande efficacité dans la mise en œuvre. Super compétent, réactif et force de proposition, Corentin a clairement apporté de la valeur dès le départ."
              </p>
              <span className="ml-4 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 whitespace-nowrap">LinkedIn</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">Adnane Amahou</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Responsable CX @ NGI</p>
              </div>
            </div>
          </div>
          {/* Fiverr */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-start justify-between mb-4">
              <p className="text-neutral-900 dark:text-neutral-100 italic flex-1">
                "Corentin did an excellent job and my cooperation with him was smooth and easy. He delivered what he promised, he was very open and quick to discuss revisions and delivered even them in no time. My project was not a simple one, as it required collecting information from different places. I'm 100% satisfied with the result."
              </p>
              <span className="ml-4 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 whitespace-nowrap">Fiverr</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">lampro74</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Belgique</p>
              </div>
            </div>
          </div>
          {/* LinkedIn */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-start justify-between mb-4">
              <p className="text-neutral-900 dark:text-neutral-100 italic flex-1">
                "Prestation de scraping impeccable : compréhension rapide du besoin, extraction propre et structurée, délais respectés. Les données livrées sont exploitables immédiatement (format clair, colonnes cohérentes, pas de doublons). Communication fluide et réactif tout au long du projet."
              </p>
              <span className="ml-4 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 whitespace-nowrap">LinkedIn</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">Mohamed-Amine Zaghdoud</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Fondateur Kent</p>
              </div>
            </div>
          </div>
          {/* Malt */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-start justify-between mb-4">
              <p className="text-neutral-900 dark:text-neutral-100 italic flex-1">
                "Très professionnel dans les échanges et a respecté à la fois la demande et les délais. Corentin a aussi été très clair sur ce qu'il allait faire dès le départ, évitant les déceptions ou mauvaises surprises. Je recommande."
              </p>
              <span className="ml-4 text-xs px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 whitespace-nowrap">Malt</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">Denis</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Inovesta</p>
              </div>
            </div>
          </div>
          {/* LinkedIn */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-start justify-between mb-4">
              <p className="text-neutral-900 dark:text-neutral-100 italic flex-1">
                "Nous avons travaillé à plusieurs reprises avec Corentin qui est très professionnel, rigoureux et à l'écoute de nos besoins. Je le recommande !"
              </p>
              <span className="ml-4 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 whitespace-nowrap">LinkedIn</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">Hugues Chavrier</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Président @ Assursafe</p>
              </div>
            </div>
          </div>
          {/* Fiverr */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-start justify-between mb-4">
              <p className="text-neutral-900 dark:text-neutral-100 italic flex-1">
                "Corentin has been exceptionally fast at delivering that order. Great level of expertise! Kudos Corentin."
              </p>
              <span className="ml-4 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 whitespace-nowrap">Fiverr</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">tigerparts</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Pays-Bas</p>
              </div>
            </div>
          </div>
          {/* LinkedIn */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-start justify-between mb-4">
              <p className="text-neutral-900 dark:text-neutral-100 italic flex-1">
                "Je recommande vivement Corentin pour sa réactivité et son professionnalisme. J'ai eu la chance de faire appel à lui à deux reprises, et à chaque fois, son accompagnement a été exemplaire."
              </p>
              <span className="ml-4 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 whitespace-nowrap">LinkedIn</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">Chris Rydahl</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Cofounder & CTO @ Parallel</p>
              </div>
            </div>
          </div>
          {/* Malt */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-start justify-between mb-4">
              <p className="text-neutral-900 dark:text-neutral-100 italic flex-1">
                "Corentin est très pro. Il connait son métier, est de très bon conseils, et force de proposition."
              </p>
              <span className="ml-4 text-xs px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 whitespace-nowrap">Malt</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">Charlotte</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Agence Canopée</p>
              </div>
            </div>
          </div>
          {/* LinkedIn */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-start justify-between mb-4">
              <p className="text-neutral-900 dark:text-neutral-100 italic flex-1">
                "Nous travaillons avec Corentin depuis plus de 3 ans. Il a toujours été de très bons conseils, réactif et appliqué. Je recommande à 💯 % !"
              </p>
              <span className="ml-4 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 whitespace-nowrap">LinkedIn</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">Julien Vabre</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Dirigeant InXpress Gironde</p>
              </div>
            </div>
          </div>
          {/* Fiverr */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-start justify-between mb-4">
              <p className="text-neutral-900 dark:text-neutral-100 italic flex-1">
                "Nous sommes extrêmement satisfaits du travail réalisé. Corentin a fait preuve d'un grand professionnalisme, d'une excellente réactivité et d'un sens du détail remarquable. La communication a toujours été fluide et agréable, et le résultat final dépasse largement nos attentes."
              </p>
              <span className="ml-4 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 whitespace-nowrap">Fiverr</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">jma225845</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">France</p>
              </div>
            </div>
          </div>
          {/* LinkedIn */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-start justify-between mb-4">
              <p className="text-neutral-900 dark:text-neutral-100 italic flex-1">
                "Corentin est redoutablement efficace, il comprend vite et travaille vite. Un plaisir."
              </p>
              <span className="ml-4 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 whitespace-nowrap">LinkedIn</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">Arthur Dalaise</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Co-fondateur @ La Biche-Renard</p>
              </div>
            </div>
          </div>
          {/* Fiverr */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-start justify-between mb-4">
              <p className="text-neutral-900 dark:text-neutral-100 italic flex-1">
                "For any scraping needs, he is amazing, was able to scrape 400K companies from a complex site."
              </p>
              <span className="ml-4 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 whitespace-nowrap">Fiverr</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">buzzinsider</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">États-Unis</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center flex flex-col items-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              <strong>167 projets</strong> réalisés sur Malt avec <strong>107 avis</strong>
            </p>
            <a 
              href={siteConfig.social.malt}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-sm border border-pink-200 dark:border-pink-800 rounded-lg hover:border-pink-300 dark:hover:border-pink-700 transition-colors group text-pink-700 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300"
            >
              Voir tous les témoignages sur Malt
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2 transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
              </svg>
            </a>
          </div>
          <div className="text-center flex flex-col items-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 whitespace-nowrap">
              <strong>103 avis</strong> sur Fiverr • <strong>4,9/5</strong> • <strong>257 commandes</strong>
            </p>
            <a 
              href={siteConfig.social.fiverr}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-sm border border-green-200 dark:border-green-800 rounded-lg hover:border-green-300 dark:hover:border-green-700 transition-colors group text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
            >
              Voir tous les témoignages sur Fiverr
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2 transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Call-to-Action */}
      <section className="mb-16 text-center">
        <h2 className="font-semibold text-xl mb-4 tracking-tighter">Démarrons votre projet ensemble</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Discutons de votre projet et voyons comment je peux vous aider à le concrétiser.
        </p>
        <Link 
          href={siteConfig.social.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          Me contacter
        </Link>
      </section>
    </main>
    </>
  )
} 
