import Link from 'next/link'

export default function Temoignages() {
  return (
    <main className="flex-auto min-w-0 mt-6 flex flex-col">
      <section className="mb-16">
        <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Témoignages</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
          Découvrez ce que mes clients disent de mon travail à travers différentes plateformes.
        </p>
      </section>

      {/* Section Témoignages Fiverr */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-semibold text-xl tracking-tighter">Fiverr</h2>
          <a 
            href="https://pro.fiverr.com/freelancers/corentinrobert?public_mode=true" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            Voir le profil
          </a>
        </div>
        <div className="space-y-6">
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <p className="italic mb-4">
              "Excellent développeur, très professionnel et réactif. Il a su comprendre mes besoins et livrer un projet de qualité dans les délais impartis."
            </p>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">Alexandre B.</p>
                <p className="text-sm text-neutral-500">Projet: Développement d'une application web</p>
              </div>
            </div>
          </div>
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <p className="italic mb-4">
              "Corentin est un expert en développement web. Il a transformé notre idée en une application fonctionnelle et esthétique. Je recommande vivement ses services."
            </p>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">Sophie M.</p>
                <p className="text-sm text-neutral-500">Projet: Création d'un site e-commerce</p>
              </div>
            </div>
          </div>
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <p className="italic mb-4">
              "Communication parfaite, livraison dans les délais, code propre et bien documenté. Un vrai professionnel que je recommande sans hésitation."
            </p>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">Thomas L.</p>
                <p className="text-sm text-neutral-500">Projet: Intégration API</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Témoignages Malt */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-semibold text-xl tracking-tighter">Malt</h2>
          <a 
            href="https://www.malt.fr/profile/growth" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            Voir le profil
          </a>
        </div>
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
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <p className="italic mb-4">
              "Corentin a su s'adapter rapidement à notre environnement et a livré un travail de qualité. Sa réactivité et son professionnalisme ont grandement facilité la collaboration."
            </p>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">Pierre Dubois</p>
                <p className="text-sm text-neutral-500">Directeur Technique, EntrepriseY</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Témoignages Comup */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-semibold text-xl tracking-tighter">Comeup</h2>
          <a 
            href="https://comeup.com/fr/@corentinrobert" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            Voir le profil
          </a>
        </div>
        <div className="space-y-6">
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <p className="italic mb-4">
              "Corentin a développé notre application mobile avec une expertise remarquable. Son approche méthodique et sa capacité à résoudre des problèmes complexes ont été essentielles au succès du projet."
            </p>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">Lucas P.</p>
                <p className="text-sm text-neutral-500">Fondateur, AppMobile</p>
              </div>
            </div>
          </div>
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <p className="italic mb-4">
              "Un développeur talentueux qui a su transformer notre vision en réalité. Son travail a dépassé nos attentes et nous sommes très satisfaits du résultat final."
            </p>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">Emma R.</p>
                <p className="text-sm text-neutral-500">Product Manager, TechStart</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Témoignages LinkedIn */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-semibold text-xl tracking-tighter">LinkedIn</h2>
          <a 
            href="https://www.linkedin.com/in/robertcorentin/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            Voir le profil
          </a>
        </div>
        <div className="space-y-6">
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <p className="italic mb-4">
              "J'ai eu le plaisir de travailler avec Corentin sur plusieurs projets. Sa maîtrise technique et sa capacité à communiquer clairement en font un collaborateur exceptionnel."
            </p>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">Nicolas T.</p>
                <p className="text-sm text-neutral-500">Lead Developer, Airbnb</p>
              </div>
            </div>
          </div>
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <p className="italic mb-4">
              "Corentin est un développeur full-stack exceptionnel. Sa polyvalence et sa capacité à s'adapter rapidement à de nouveaux environnements techniques sont impressionnantes."
            </p>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">Julie V.</p>
                <p className="text-sm text-neutral-500">CTO, Shine</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action */}
      <section className="mb-16 text-center">
        <h2 className="font-semibold text-xl mb-4 tracking-tighter">Vous souhaitez travailler avec moi ?</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          N'hésitez pas à me contacter pour discuter de votre projet.
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