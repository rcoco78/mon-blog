import Link from 'next/link'
import Image from 'next/image'

export default function About() {
  return (
    <main className="flex-auto min-w-0 mt-6 flex flex-col">
      {/* Section Narrative */}
      <section className="mb-16">
        <h1 className="font-semibold text-2xl mb-8 tracking-tighter">À propos</h1>
        <p className="mb-8 text-neutral-900 dark:text-neutral-100 tracking-tight">De développeur chez Airbnb à entrepreneur indépendant, mon parcours est marqué par une constante : la recherche d'innovation et d'impact.</p>
        
        {/* Section Images qui se chevauchent */}
        <div className="relative h-80 mb-12">
          {/* Version mobile */}
          <div className="md:hidden flex flex-col items-center space-y-4">
            <div className="w-48 h-48 rounded-lg overflow-hidden shadow-md">
              <Image 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                alt="Photo de profil" 
                width={192} 
                height={192} 
                className="object-cover"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="w-32 h-32 rounded-lg overflow-hidden shadow-md">
                <Image 
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                  alt="Photo de profil" 
                  width={128} 
                  height={128} 
                  className="object-cover"
                />
              </div>
              <div className="w-32 h-32 rounded-lg overflow-hidden shadow-md">
                <Image 
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                  alt="Photo de profil" 
                  width={128} 
                  height={128} 
                  className="object-cover"
                />
              </div>
              <div className="w-32 h-32 rounded-lg overflow-hidden shadow-md">
                <Image 
                  src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                  alt="Photo de profil" 
                  width={128} 
                  height={128} 
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Version desktop */}
          <div className="hidden md:block relative h-80">
            <div className="absolute top-0 left-0 w-48 h-48 rounded-lg overflow-hidden z-10 shadow-md">
              <Image 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                alt="Photo de profil" 
                width={192} 
                height={192} 
                className="object-cover"
              />
            </div>
            <div className="absolute top-32 left-24 w-40 h-40 rounded-lg overflow-hidden z-20 shadow-md">
              <Image 
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                alt="Photo de profil" 
                width={160} 
                height={160} 
                className="object-cover"
              />
            </div>
            <div className="absolute top-8 left-64 w-36 h-36 rounded-lg overflow-hidden z-30 shadow-md">
              <Image 
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                alt="Photo de profil" 
                width={144} 
                height={144} 
                className="object-cover"
              />
            </div>
            <div className="absolute top-48 left-8 w-32 h-32 rounded-lg overflow-hidden z-40 shadow-md">
              <Image 
                src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                alt="Photo de profil" 
                width={128} 
                height={128} 
                className="object-cover"
              />
            </div>
            <div className="absolute top-16 left-96 w-28 h-28 rounded-lg overflow-hidden z-50 shadow-md">
              <Image 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                alt="Photo de profil" 
                width={112} 
                height={112} 
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section Parcours */}
      <section className="mb-16">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Parcours</h2>
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <div className="w-full sm:w-24 text-sm text-neutral-500 mb-1 sm:mb-0">2023</div>
            <div>
              <h3 className="font-medium">Freelance</h3>
              <p className="text-neutral-600 dark:text-neutral-400">360+ missions réussies sur Malt et Fiverr</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <div className="w-full sm:w-24 text-sm text-neutral-500 mb-1 sm:mb-0">2022</div>
            <div>
              <h3 className="font-medium">White Bird</h3>
              <p className="text-neutral-600 dark:text-neutral-400">CTO - Direction technique et développement produit</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <div className="w-full sm:w-24 text-sm text-neutral-500 mb-1 sm:mb-0">2021</div>
            <div>
              <h3 className="font-medium">Shine</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Lead Developer - Développement d'applications web</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <div className="w-full sm:w-24 text-sm text-neutral-500 mb-1 sm:mb-0">2020</div>
            <div>
              <h3 className="font-medium">Airbnb</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Développeur - Contribution à la plateforme</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <div className="w-full sm:w-24 text-sm text-neutral-500 mb-1 sm:mb-0">2015-2018</div>
            <div>
              <h3 className="font-medium">HETIC</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Formation en développement web et entrepreneuriat</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Startups */}
      <section className="mb-16">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Startups</h2>
        <div className="flex flex-col space-y-4">
          <a 
            href="https://www.outreacher.fr/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
          >
            <div>
              <h3 className="font-medium">Outreacher</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Agence d'outbound marketing
              </p>
            </div>
            <div className="flex items-center transition-all group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
              </svg>
            </div>
          </a>
          <a 
            href="https://datareacher.webflow.io/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
          >
            <div>
              <h3 className="font-medium">Datareacher</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Mise à disposition de bases de données
              </p>
            </div>
            <div className="flex items-center transition-all group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
              </svg>
            </div>
          </a>
          <a 
            href="#" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
          >
            <div>
              <h3 className="font-medium">Immoreacher</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Agence de création de contenus pour les agences immo
              </p>
            </div>
            <div className="flex items-center transition-all group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
              </svg>
            </div>
          </a>
          <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-neutral-500 dark:text-neutral-400">Rare Item Club</h3>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">(Arrêté en 2022)</span>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400">
                Achat-revente de sneakers d'occasion
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-neutral-500 dark:text-neutral-400">InstaNinja</h3>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">(Arrêté en 2019)</span>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400">
                Automatisation de compte Instagram
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="mb-16">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Témoignages</h2>
        <div className="space-y-6">
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <p className="italic mb-4">
              "Corentin a apporté une expertise technique exceptionnelle à notre projet. Sa capacité à comprendre nos besoins et à proposer des solutions innovantes a été déterminante."
            </p>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">Jean Dupont</p>
                <p className="text-sm text-neutral-500">CEO, StartupX</p>
              </div>
            </div>
          </div>
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <p className="italic mb-4">
              "Un vrai professionnel qui sait allier expertise technique et vision stratégique. Son accompagnement a été crucial dans le développement de notre plateforme."
            </p>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">Marie Martin</p>
                <p className="text-sm text-neutral-500">CTO, TechCorp</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link 
            href="/temoignages" 
            className="inline-flex items-center px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
          >
            Voir tous les témoignages
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2 transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Call-to-Action */}
      <section className="mb-16 text-center">
        <h2 className="font-semibold text-xl mb-4 tracking-tighter">Démarrons votre projet ensemble</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Discutons de votre projet et voyons comment je peux vous aider à le concrétiser.
        </p>
        <Link 
          href="/contact" 
          className="inline-block px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          Me contacter
        </Link>
      </section>
    </main>
  )
} 