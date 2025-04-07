import Link from 'next/link'
import { useState } from 'react'

export default function Outils() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tous')

  const categories = ['Tous', 'Outreach', 'Scraping', 'Immobilier', 'Productivité']

  const tools = [
    {
      name: 'Générateur de Templates d\'Emails',
      description: 'Créez des templates d\'outreach performants avec notre outil gratuit. Personnalisez vos messages et augmentez vos taux de réponse.',
      category: 'Outreach',
      icon: '✉️',
      link: '/outils/email-generator',
      isNew: true
    },
    {
      name: 'Extracteur LinkedIn',
      description: 'Extrayez des données de profils LinkedIn de manière éthique et efficace. Version gratuite limitée à 50 profils par jour.',
      category: 'Scraping',
      icon: '🔍',
      link: '/outils/linkedin-extractor',
      isNew: true
    },
    {
      name: 'Générateur de Descriptions Immobilières',
      description: 'Créez des descriptions immobilières optimisées pour le luxe. Templates et suggestions de mots-clés inclus.',
      category: 'Immobilier',
      icon: '🏠',
      link: '/outils/real-estate-generator',
      isNew: false
    },
    {
      name: 'Dashboard Notion pour Agents',
      description: 'Template Notion complet pour la gestion de votre activité immobilière. Suivi des clients, visites et contenus.',
      category: 'Productivité',
      icon: '📊',
      link: '/outils/notion-dashboard',
      isNew: false
    }
  ]

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Tous' || tool.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <main className="min-w-0 mt-6 flex flex-col">
      <section className="mb-8">
        <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Outils Gratuits</h1>
        <p className="mb-8 text-neutral-900 dark:text-neutral-100 tracking-tight">
          Découvrez une collection d'outils gratuits pour optimiser votre productivité et automatiser vos tâches.
        </p>
      </section>

      <section className="mb-16">
        <div className="mb-12 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un outil..."
                className="w-full px-4 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
                className="absolute right-3 top-2.5 w-5 h-5 text-neutral-400 dark:text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                  selectedCategory === category
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTools.map((tool) => (
            <Link
              key={tool.name}
              href={tool.link}
              className="group block p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tool.icon}</span>
                  <h2 className="font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                    {tool.name}
                    {tool.isNew && (
                      <span className="ml-2 text-xs bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2 py-0.5 rounded-full">
                        Nouveau
                      </span>
                    )}
                  </h2>
                </div>
              </div>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                {tool.description}
              </p>
              <div className="mt-4 flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
                  {tool.category}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-16 text-center">
        <h2 className="font-semibold text-xl mb-4 tracking-tighter">Vous avez une idée d'outil ?</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Partagez vos suggestions et nous pourrons développer de nouveaux outils pour la communauté.
        </p>
        <a
          className="inline-block px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          href="/contact"
        >
          Nous contacter
        </a>
      </section>
    </main>
  )
} 