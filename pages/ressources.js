import Link from 'next/link'

export default function Ressources() {
  return (
    <main className="flex-auto min-w-0 mt-6 flex flex-col">
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Ressources</h1>

      {/* Guides & Templates */}
      <section className="mb-16">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Guides & Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-medium text-lg mb-4">Guide de démarrage startup</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Un guide complet pour lancer votre startup, de l'idée à la première version.
            </p>
            <Link 
              href="/blog/guide-demarrage-startup" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Lire le guide →
            </Link>
          </div>
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-medium text-lg mb-4">Template de pitch deck</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Un modèle de présentation pour convaincre vos investisseurs.
            </p>
            <Link 
              href="/blog/template-pitch-deck" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Voir le template →
            </Link>
          </div>
        </div>
      </section>

      {/* Outils recommandés */}
      <section className="mb-16">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Outils recommandés</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-medium text-lg mb-4">Développement</h3>
            <ul className="space-y-2">
              <li>• VSCode - Éditeur de code</li>
              <li>• GitHub - Gestion de code</li>
              <li>• Docker - Conteneurisation</li>
            </ul>
          </div>
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-medium text-lg mb-4">Design</h3>
            <ul className="space-y-2">
              <li>• Figma - Design d'interface</li>
              <li>• Notion - Documentation</li>
              <li>• Canva - Création graphique</li>
            </ul>
          </div>
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-medium text-lg mb-4">Productivité</h3>
            <ul className="space-y-2">
              <li>• Slack - Communication</li>
              <li>• Trello - Gestion de projet</li>
              <li>• Zoom - Réunions</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Articles techniques */}
      <section className="mb-16">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Articles techniques</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-medium text-lg mb-4">Architecture Web</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog/architecture-microservices" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Les microservices : avantages et inconvénients
                </Link>
              </li>
              <li>
                <Link href="/blog/optimisation-performance" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Optimiser les performances de votre application
                </Link>
              </li>
            </ul>
          </div>
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-medium text-lg mb-4">Growth Hacking</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog/strategies-acquisition" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Stratégies d'acquisition utilisateurs
                </Link>
              </li>
              <li>
                <Link href="/blog/optimisation-conversion" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Optimiser votre taux de conversion
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Ressources pour freelances */}
      <section className="mb-16">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Ressources pour freelances</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-medium text-lg mb-4">Gestion de projet</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog/facturation-freelance" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Guide de facturation pour freelances
                </Link>
              </li>
              <li>
                <Link href="/blog/contrats-freelance" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Modèles de contrats
                </Link>
              </li>
            </ul>
          </div>
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-medium text-lg mb-4">Développement business</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog/pricing-freelance" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Comment fixer vos tarifs
                </Link>
              </li>
              <li>
                <Link href="/blog/marketing-freelance" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Marketing pour freelances
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
} 