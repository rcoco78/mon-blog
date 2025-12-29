import Link from 'next/link'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import { useState, useEffect } from 'react'

export default function DonneesPubliques() {
  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.donneesPubliques.title,
    description: siteConfig.seo.pages.donneesPubliques.description,
    path: '/donnees-publiques',
    keywords: siteConfig.seo.pages.donneesPubliques.keywords
  })

  const [keyResults, setKeyResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [meetingsHistory, setMeetingsHistory] = useState([])
  const [meetingsLoading, setMeetingsLoading] = useState(true)
  const [abonnesHistory, setAbonnesHistory] = useState([])
  const [abonnesLoading, setAbonnesLoading] = useState(true)
  const [apifyUsersHistory, setApifyUsersHistory] = useState([])
  const [apifyUsersLoading, setApifyUsersLoading] = useState(true)

  useEffect(() => {
    const fetchKeyResults = async () => {
      try {
        const response = await fetch('/api/key-results')
        if (response.ok) {
          const data = await response.json()
          // Debug: afficher les statuts uniques pour comprendre le format
          const uniqueStatuses = [...new Set(data.map(kr => kr.status))]
          console.log('Statuts uniques des Key Results:', uniqueStatuses)
          setKeyResults(data)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des Key Results:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchKeyResults()
  }, [])

  useEffect(() => {
    const fetchMeetingsHistory = async () => {
      try {
        setMeetingsLoading(true)
        const response = await fetch('/api/meetings-history')
        if (response.ok) {
          const data = await response.json()
          setMeetingsHistory(data)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des meetings:', error)
      } finally {
        setMeetingsLoading(false)
      }
    }

    fetchMeetingsHistory()
  }, [])

  useEffect(() => {
    const fetchAbonnesHistory = async () => {
      try {
        setAbonnesLoading(true)
        const response = await fetch('/api/abonnes-history')
        if (response.ok) {
          const data = await response.json()
          setAbonnesHistory(data)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des abonnés:', error)
      } finally {
        setAbonnesLoading(false)
      }
    }

    fetchAbonnesHistory()
  }, [])

  useEffect(() => {
    const fetchApifyUsersHistory = async () => {
      try {
        setApifyUsersLoading(true)
        const response = await fetch('/api/apify-users-history')
        if (response.ok) {
          const data = await response.json()
          setApifyUsersHistory(data)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des utilisateurs Apify:', error)
      } finally {
        setApifyUsersLoading(false)
      }
    }

    fetchApifyUsersHistory()
  }, [])

  // Grouper les Key Results par catégorie
  const groupedByCategory = keyResults.reduce((acc, kr) => {
    const category = kr.category || 'Sans catégorie'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(kr)
    return acc
  }, {})

  // Calculer les statistiques globales
  const totalKeyResults = keyResults.length
  const completedKeyResults = keyResults.filter(kr => {
    const status = kr.status?.toLowerCase() || ''
    return status === 'done' || status === 'completed' || status === 'terminé'
  }).length
  const inProgressKeyResults = keyResults.filter(kr => {
    const status = kr.status?.toLowerCase() || ''
    // Détecter tous les statuts qui indiquent un travail en cours
    // Notion peut retourner: "In progress", "In Progress", "in progress", etc.
    const isInProgress = status.includes('progress') || 
                        status.includes('en cours') || 
                        status.includes('in_progress') ||
                        status.includes('inprogress')
    
    // Si le statut n'est pas "done", "completed", "terminé", "not started", etc., considérer comme en cours
    const isNotCompleted = status !== 'done' && 
                          status !== 'completed' && 
                          status !== 'terminé' && 
                          status !== 'not started' && 
                          status !== 'notstarted' && 
                          status !== 'non démarré' &&
                          status !== ''
    
    return isInProgress || isNotCompleted
  }).length
  // Calculer la progression globale basée sur le pourcentage moyen de tous les objectifs
  const overallProgress = totalKeyResults > 0 
    ? Math.round(keyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0) / totalKeyResults)
    : 0

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || ''
    if (statusLower === 'done') {
      return 'bg-green-500 text-white'
    }
    if (statusLower === 'in progress' || statusLower === 'in_progress') {
      return 'bg-blue-500 text-white'
    }
    if (statusLower === 'not started') {
      return 'bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
    }
    return 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
  }

  // Fonction pour formater les nombres
  const formatNumber = (num) => {
    if (num >= 1000) {
      return num.toLocaleString('fr-FR')
    }
    return num.toString()
  }

  // Fonction pour trier les objectifs dans un ordre logique
  const sortKeyResults = (results, category) => {
    // Ordre de priorité pour chaque catégorie
    const orderMap = {
      'Apify': [
        'Nombre de scrapers disponibles',
        'Utilisateurs total',
        'Utilisateurs mensuels',
        'Utilisateurs mensuels Apify',
        'Chiffre d\'affaires Apify',
        'Ventes via Datareacher Apify',
        'Revenus d\'affiliation Apify'
      ],
      'Apify & Scraping': [
        'Nombre de scrapers disponibles',
        'Utilisateurs total',
        'Utilisateurs mensuels',
        'Utilisateurs mensuels Apify',
        'Chiffre d\'affaires Apify',
        'Ventes via Datareacher Apify',
        'Revenus d\'affiliation Apify'
      ],
      'Meetings Call': [
        'Rdv obtenu via Calendly',
        'Calendly (génération de leads)',
        'Rendez-vous ponctuels',
        'Moyenne de durée d\'un appel',
        'Moyenne mensuelle des rendez-vous',
        'Moyenne hebdomadaire des rendez-vous'
      ],
      'Relation client': [
        'Rdv obtenu via Calendly',
        'Calendly (génération de leads)',
        'Rendez-vous ponctuels',
        'Moyenne de durée d\'un appel',
        'Moyenne mensuelle des rendez-vous',
        'Moyenne hebdomadaire des rendez-vous'
      ],
      'default': []
    }

    const categoryKey = category || 'default'
    const order = orderMap[categoryKey] || orderMap['default']
    
    if (order.length === 0) {
      return results
    }

    return [...results].sort((a, b) => {
      const titleA = improveTitle(a.name, a.category)
      const titleB = improveTitle(b.name, b.category)
      
      const indexA = order.indexOf(titleA)
      const indexB = order.indexOf(titleB)
      
      // Si les deux sont dans l'ordre, trier selon l'ordre
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }
      // Si seul A est dans l'ordre, A vient en premier
      if (indexA !== -1) return -1
      // Si seul B est dans l'ordre, B vient en premier
      if (indexB !== -1) return 1
      // Sinon, garder l'ordre original
      return 0
    })
  }

  // Fonction pour traduire les catégories en bénéfices business
  const translateCategory = (category) => {
    const categoryMap = {
      'Affiliation': 'Partenariats stratégiques',
      'Meetings Call': 'Relation client',
      'Logement Atypique': 'Projet entrepreneurial',
      'Apify': 'Scrapers publics',
      'Apify & Scraping': 'Scrapers publics',
      'Freelance': 'Activité freelance',
      'Santé': 'Bien-être',
      'default': category
    }
    // Vérifier aussi si la catégorie contient "Apify" (insensible à la casse)
    if (category.toLowerCase().includes('apify')) {
      return categoryMap[category] || 'Scrapers publics'
    }
    return categoryMap[category] || category
  }

  // Fonction pour améliorer et simplifier les titres des Key Results
  const improveTitle = (title, category) => {
    if (!title) return title
    
    let improved = title
    
    // Supprimer les unités entre parenthèses ($, €, etc.)
    improved = improved.replace(/\s*\([€$%]\)\s*/gi, '')
    
      // Traduire les anglicismes courants
    const translations = {
      'Total monthly users': 'Utilisateurs mensuels',
      'Total users': 'Utilisateurs',
      'Monthly users': 'Utilisateurs mensuels',
      'Users': 'Utilisateurs',
      'Total Actors': 'Scrapers',
      'Actors': 'Scrapers',
      'Meetings': 'Rendez-vous',
      'Meeting': 'Rendez-vous',
      'Call': 'Appels',
      'Calls': 'Appels',
      'Ad-hoc': 'Ponctuels',
      'ad-hoc': 'ponctuels',
      'Duration': 'Durée',
      'Duration Avg': 'Durée moyenne',
      'Avg': 'Moyenne',
      'min': 'min',
      'lead gen': 'génération de leads',
      'affiliation': 'affiliation',
      'Monthly': 'Mensuel',
      'Weekly': 'Hebdomadaire',
    }
    
    // Appliquer les traductions
    Object.entries(translations).forEach(([en, fr]) => {
      const regex = new RegExp(`\\b${en}\\b`, 'gi')
      improved = improved.replace(regex, fr)
    })
    
    // Améliorations basées sur des patterns courants
    const improvements = {
      // Apify / Scrapers
      'Total Actors publiés': 'Nombre de scrapers disponibles',
      'Total users Apify': 'Utilisateurs total',
      'Actors publiés': 'Scrapers publics',
      'Total monthly users': 'Utilisateurs mensuels',
      'Total monthly users (Apify)': 'Utilisateurs mensuels Apify',
      'CA Apify custom': 'Chiffre d\'affaires Apify',
      'Chiffre d\'affaires Apify custom': 'Chiffre d\'affaires Apify',
      
      // Lemlist / Affiliation
      'Lemlist affiliation': 'Revenus d\'affiliation Lemlist',
      'Lemlist affiliation ($)': 'Revenus d\'affiliation Lemlist',
      'Chiffre d\'affaires affiliation': 'Revenus d\'affiliation',
      'Coaching Lemlist': 'Coaching Lemlist',
      'Revenus d\'affiliation Lemlist': 'Revenus d\'affiliation Lemlist',
      'CA affiliation': 'Revenus d\'affiliation',
      'Chiffre d\'affaires affiliation (€)': 'Revenus d\'affiliation',
      'Zapmail affiliation': 'Revenus d\'affiliation Zapier',
      'Apify affiliation': 'Revenus d\'affiliation Apify',
      
      // Logement Atypique
      'CA Logement Atypique': 'Chiffre d\'affaires Logement Atypique',
      'CA Logement Atypique (€)': 'Chiffre d\'affaires Logement Atypique',
      'Abonnés': category?.toLowerCase().includes('logement') ? 'Abonnés Instagram Logement Atypique' : 'Abonnés',
      'Vidéos publiées': category?.toLowerCase().includes('logement') ? 'Vidéos publiées Logement Atypique' : 'Vidéos publiées',
      
      // Meetings / Appels
      'Meetings Call': 'Rendez-vous et appels clients',
      'Calendly': 'Rdv obtenu via Calendly',
      'Meeting Ad-hoc': 'Rendez-vous ponctuels',
      'Meetings ad-hoc': 'Rendez-vous ponctuels',
      'Calendly (lead gen)': 'Rdv obtenu via Calendly',
      'Meeting via Calendly': 'Rdv obtenu via Calendly',
      'Meetings Call - Duration Avg (min)': 'Durée moyenne des rendez-vous (min)',
      'Meetings Call - Duration Avg': 'Durée moyenne des rendez-vous',
      'Rendez-vous Appels - Duration Avg (min)': 'Moyenne de durée d\'un appel',
      'Meetings Call - Duration Avg (min)': 'Moyenne de durée d\'un appel',
      'Rendez-vous Appels - Monthly Moyenne': 'Moyenne mensuelle des rendez-vous',
      'Rendez-vous Appels - Weekly Moyenne': 'Moyenne hebdomadaire des rendez-vous',
      
      // Freelance
      'Mission Malt': 'Projets réalisés sur Malt',
      'Mission Fiverr': 'Projets réalisés sur Fiverr',
      
      // Général
      'CA': 'Chiffre d\'affaires',
    }
    
    // Appliquer les améliorations spécifiques
    if (improvements[title]) {
      improved = improvements[title]
    } else {
      // Détection flexible pour les affiliations (ex: "Apify affiliation", "Zapmail affiliation")
      const affiliationMatch = improved.match(/^(.+?)\s+affiliation$/i)
      if (affiliationMatch) {
        const serviceName = affiliationMatch[1].trim()
        // Traductions spécifiques pour les services
        const serviceTranslations = {
          'Apify': 'Apify',
          'Zapmail': 'Zapmail',
          'Zapier': 'Zapmail',
          'Lemlist': 'Lemlist'
        }
        const translatedService = serviceTranslations[serviceName] || serviceName
        improved = `Revenus d'affiliation ${translatedService}`
      } else {
        // Améliorations génériques
        improved = improved.replace(/\bCA\b/gi, 'Chiffre d\'affaires')
        improved = improved.replace(/\b€\b/g, '')
        improved = improved.replace(/\$\b/g, '')
        
        // Supprimer "custom" qui est redondant
        improved = improved.replace(/\s+custom\s*/gi, '')
        
        // Nettoyer les patterns spécifiques
        improved = improved.replace(/\s*-\s*Duration\s*Avg\s*/gi, ' - Durée moyenne')
        improved = improved.replace(/\s*\(lead gen\)\s*/gi, '')
        improved = improved.replace(/\s*\(min\)\s*/gi, ' (min)')
        
        // Supprimer les mentions entre parenthèses si elles sont redondantes avec la catégorie
        const categoryLower = category?.toLowerCase() || ''
        if (categoryLower.includes('apify')) {
          improved = improved.replace(/\s*\(Apify\)\s*/gi, '')
          if (!improved.toLowerCase().includes('apify')) {
            improved = `${improved} Apify`
          }
        }
      }
    }
    
    // Nettoyer les espaces multiples
    improved = improved.replace(/\s+/g, ' ').trim()
    
    return improved
  }

  // Composant réutilisable pour les graphiques de croissance
  const GrowthChart = ({ title, description, history, loading, colorFrom = 'blue', colorTo = 'blue', insight }) => {
    // Couleurs plus douces et moins saturées pour différencier tout en restant subtiles
    const colorClasses = {
      blue: 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400',
      green: 'bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-400',
      purple: 'bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-400'
    }
    const colorClass = colorClasses[colorFrom] || colorClasses.blue

    // Calculer l'insight si non fourni
    let calculatedInsight = insight
    if (!calculatedInsight && history.length > 1) {
      const firstValue = history[0].valeur
      const lastValue = history[history.length - 1].valeur
      const growth = firstValue > 0 ? ((lastValue / firstValue - 1) * 100).toFixed(1) : 0
      const trend = lastValue >= firstValue ? 'croissance' : 'baisse'
      calculatedInsight = `Tendance ${trend} de ${Math.abs(growth)}% sur la période observée.`
    }

    return (
      <section className="mb-16" aria-label={title}>
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">{title}</h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
        
        {loading ? (
          <div className="h-64 bg-neutral-100 dark:bg-neutral-900 rounded-lg animate-pulse flex items-end justify-around p-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-8 bg-neutral-300 dark:bg-neutral-700 rounded-t" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-neutral-600 dark:text-neutral-400">Aucune donnée disponible pour le moment.</p>
        ) : (
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="sr-only">
              <p>Graphique en barres représentant l'évolution de {title.toLowerCase()}. Les données sont affichées chronologiquement de gauche à droite.</p>
            </div>
            <div className="flex items-end justify-between gap-2 h-64" role="img" aria-label={`Graphique de ${title.toLowerCase()}`}>
              {history.map((item, index) => {
                const maxValue = Math.max(...history.map(h => h.valeur))
                const height = maxValue > 0 ? (item.valeur / maxValue) * 100 : 0
                
                return (
                  <div key={item.id} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                      <div 
                        className={`w-full ${colorClass} rounded-t transition-all duration-500 group relative`}
                        style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                        title={`${item.date}: ${item.valeur}`}
                      >
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {item.date}: {formatNumber(item.valeur)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 text-center mt-2">
                      <div className="font-medium">{item.valeur}</div>
                      <div className="text-[10px] mt-1">{item.date}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Ligne de tendance */}
            {history.length > 1 && (
              <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Première valeur</span>
                  <span className="font-semibold">{formatNumber(history[0].valeur)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-neutral-600 dark:text-neutral-400">Dernière valeur</span>
                  <span className="font-semibold">{formatNumber(history[history.length - 1].valeur)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-neutral-600 dark:text-neutral-400">Croissance</span>
                  <span className={`font-semibold ${
                    history[history.length - 1].valeur >= history[0].valeur
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-orange-700 dark:text-orange-400'
                  }`}>
                    {history[history.length - 1].valeur >= history[0].valeur ? '+' : ''}
                    {formatNumber(history[history.length - 1].valeur - history[0].valeur)}
                    {' '}
                    ({history[0].valeur > 0 
                      ? ((history[history.length - 1].valeur / history[0].valeur - 1) * 100).toFixed(1)
                      : '0'
                    }%)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        {calculatedInsight && !loading && history.length > 0 && (
          <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              <strong className="text-neutral-900 dark:text-neutral-100">Insight :</strong> {calculatedInsight}
            </p>
          </div>
        )}
      </section>
    )
  }

  return (
    <>
      <SEOHead {...pageSEO} />
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
            name: 'Données publiques',
            item: `${siteConfig.url}/donnees-publiques`
          }
        ]
      }} />
      <StructuredData type="Dataset" data={{
        name: 'Objectifs 2026 et Progression Business',
        description: 'Données publiques sur mes objectifs business, métriques de croissance et progression des projets freelance.',
        url: `${siteConfig.url}/donnees-publiques`,
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        keywords: ['objectifs business', 'métriques', 'progression', 'key results']
      }} />
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="mb-8">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">Objectifs 2026 et Progression Business</h1>
          <div className="mb-6 space-y-3">
            <p className="text-neutral-600 dark:text-neutral-400 tracking-tight">
              Transparence totale sur mes objectifs, mes challenges et ma progression. 
              Voici mes objectifs 2026 et quelques métriques publiques mises à jour en temps réel.
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 tracking-tight">
              Cette page vous permet de suivre l'évolution de mes projets, de mes partenariats et de mes métriques business. 
              Chaque objectif est suivi avec précision, et les graphiques montrent la progression dans le temps.
            </p>
          </div>
        </section>

        {/* Section "Pourquoi ces données ?" */}
        <section className="mb-16 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50" aria-label="Pourquoi ces données">
          <h2 className="font-semibold text-lg mb-4 tracking-tighter">Pourquoi ces données ?</h2>
          <div className="space-y-3 text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
            <p>
              <strong className="text-neutral-900 dark:text-neutral-100">Transparence et confiance :</strong> En partageant publiquement mes objectifs et ma progression, 
              je démontre mon engagement envers la transparence et la responsabilité. C'est une façon de construire la confiance avec mes clients et partenaires.
            </p>
            <p>
              <strong className="text-neutral-900 dark:text-neutral-100">Reconnaissance de la réalité :</strong> Les objectifs ne sont pas toujours atteints, 
              et c'est normal. Montrer les succès comme les défis permet de donner une vision authentique de mon activité.
            </p>
            <p>
              <strong className="text-neutral-900 dark:text-neutral-100">Inspiration et partage :</strong> Ces données peuvent inspirer d'autres entrepreneurs 
              et freelances à adopter une approche similaire de transparence dans leur communication.
            </p>
          </div>
        </section>

        {/* Tableaux détaillés des Key Results par catégorie */}
        <section className="mb-16" aria-label="Détail des objectifs par catégorie">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Détail des objectifs</h2>
          
          {/* Métriques business intégrées */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 animate-pulse">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-3"></div>
                  <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* CA/Turnover */}
              <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Chiffre d'affaires</h3>
                <p className="text-3xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
                  {(() => {
                    // Calculer le CA total objectif depuis les Key Results
                    // Chercher spécifiquement les Key Results de CA principal par catégorie
                    
                    // CA Freelance : chercher le Key Result principal (le plus grand)
                    const caFreelanceKRs = keyResults
                      .filter(kr => {
                        const categoryLower = (kr.category || '').toLowerCase()
                        const nameLower = (kr.name || '').toLowerCase()
                        // Chercher uniquement le CA principal freelance (pas les revenus d'affiliation, pas les totaux)
                        return (categoryLower.includes('freelance') || categoryLower.includes('freelancing')) &&
                               (nameLower.includes('ca') || nameLower.includes('chiffre')) &&
                               !nameLower.includes('affiliation') &&
                               !nameLower.includes('apify') &&
                               !nameLower.includes('lemlist') &&
                               !nameLower.includes('zapmail') &&
                               !nameLower.includes('total')
                      })
                    const caFreelance = caFreelanceKRs.length > 0 
                      ? Math.max(...caFreelanceKRs.map(kr => kr.targetResult || 0))
                      : 0
                    
                    // CA Affiliation : chercher le Key Result principal "CA" ou "Chiffre d'affaires" dans la catégorie Affiliation
                    // Si pas trouvé, chercher un Key Result "Revenus d'affiliation" principal (le plus grand)
                    const caAffiliationKRs = keyResults
                      .filter(kr => {
                        const categoryLower = (kr.category || '').toLowerCase()
                        const nameLower = (kr.name || '').toLowerCase()
                        // Chercher un CA principal dans la catégorie affiliation (pas les totaux)
                        return (categoryLower.includes('affiliation') || categoryLower.includes('partenariats')) &&
                               (nameLower.includes('ca') || nameLower.includes('chiffre')) &&
                               !nameLower.includes('total')
                      })
                    
                    let caAffiliation = 0
                    if (caAffiliationKRs.length > 0) {
                      // Prendre le CA principal s'il existe
                      caAffiliation = Math.max(...caAffiliationKRs.map(kr => kr.targetResult || 0))
                    } else {
                      // Sinon, chercher les revenus d'affiliation et prendre le plus grand (pas la somme)
                      const revenusAffiliationKRs = keyResults
                        .filter(kr => {
                          const categoryLower = (kr.category || '').toLowerCase()
                          const nameLower = (kr.name || '').toLowerCase()
                          return (categoryLower.includes('affiliation') || categoryLower.includes('partenariats')) &&
                                 (nameLower.includes('affiliation') || nameLower.includes('revenus')) &&
                                 !nameLower.includes('total')
                        })
                      if (revenusAffiliationKRs.length > 0) {
                        caAffiliation = Math.max(...revenusAffiliationKRs.map(kr => kr.targetResult || 0))
                      }
                    }
                    
                    // CA Logement Atypique : chercher le Key Result principal
                    const caLogementAtypiqueKRs = keyResults
                      .filter(kr => {
                        const categoryLower = (kr.category || '').toLowerCase()
                        const nameLower = (kr.name || '').toLowerCase()
                        // Chercher uniquement le CA Logement Atypique (pas les totaux)
                        return (categoryLower.includes('logement') || categoryLower.includes('entrepreneurial')) &&
                               (nameLower.includes('ca') || nameLower.includes('chiffre')) &&
                               nameLower.includes('logement') &&
                               !nameLower.includes('total')
                      })
                    const caLogementAtypique = caLogementAtypiqueKRs.length > 0
                      ? Math.max(...caLogementAtypiqueKRs.map(kr => kr.targetResult || 0))
                      : 0
                    
                    const totalCA = caFreelance + caAffiliation + caLogementAtypique
                    
                    // Debug pour identifier les Key Results inclus
                    console.log('🔍 Debug CA Total:', {
                      caFreelanceKRs: caFreelanceKRs.map(kr => ({ name: kr.name, category: kr.category, target: kr.targetResult })),
                      caAffiliationKRs: caAffiliationKRs.map(kr => ({ name: kr.name, category: kr.category, target: kr.targetResult })),
                      caLogementAtypiqueKRs: caLogementAtypiqueKRs.map(kr => ({ name: kr.name, category: kr.category, target: kr.targetResult })),
                      totaux: { caFreelance, caAffiliation, caLogementAtypique, totalCA }
                    })
                    
                    if (totalCA > 0) {
                      return `${formatNumber(Math.round(totalCA))} €`
                    }
                    return '—'
                  })()}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  Objectif 2026 (Freelance + Affiliation + Logement Atypique)
                </p>
              </div>

              {/* Délai moyen de livraison */}
              <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Délai moyen de livraison</h3>
                <p className="text-3xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">7 jours</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  Temps moyen pour livrer un projet
                </p>
              </div>

              {/* Taux de réussite */}
              <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">Taux de réussite</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">5/5</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">sur 160 missions</p>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Malt</p>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">4,9/5</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">sur 250 missions</p>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Fiverr</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Séparateur */}
          <div className="my-8 border-t border-neutral-200 dark:border-neutral-800"></div>
          
          {/* Vue d'ensemble des Key Results */}
          <div className="mb-8">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Objectifs 2026 — Vue d'ensemble</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 animate-pulse">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Total objectifs</p>
                <p className="text-2xl font-semibold">{totalKeyResults}</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Complétés</p>
                <p className="text-2xl font-semibold text-green-700 dark:text-green-400">{completedKeyResults}</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">En cours</p>
                <p className="text-2xl font-semibold text-blue-700 dark:text-blue-400">{inProgressKeyResults}</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Progression globale</p>
                <p className="text-2xl font-semibold">{overallProgress}%</p>
              </div>
            </div>
          )}

          {/* Barre de progression globale */}
          {!loading && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progression globale des objectifs</span>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">{overallProgress}%</span>
              </div>
              <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-500 dark:to-green-500 transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          </div>

          {/* Détail par catégorie */}
          {loading ? (
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-4 animate-pulse"></div>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 animate-pulse">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedByCategory).length === 0 ? (
            <p className="text-neutral-600 dark:text-neutral-400">Aucun objectif disponible pour le moment.</p>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedByCategory).map(([category, results]) => {
                const translatedCategory = translateCategory(category)
                const isApifyCategory = category.toLowerCase().includes('apify')
                const isLogementAtypiqueCategory = category.toLowerCase().includes('logement')
                const isFreelanceCategory = category.toLowerCase().includes('freelance') || category.toLowerCase().includes('freelancing')
                // Trier les résultats dans un ordre logique
                const sortedResults = sortKeyResults(results, category)
                
                return (
                <div key={category}>
                  <h3 className="font-semibold text-lg mb-4 tracking-tighter flex items-center gap-2 group">
                    {isApifyCategory ? (
                      <Link 
                        href="https://apify.com?fpr=0n7ukq" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
                      >
                        {translatedCategory}
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                      </Link>
                    ) : isLogementAtypiqueCategory ? (
                      <Link 
                        href="https://logement-atypique.fr/?utm_source=corentinrobert&utm_medium=website&utm_campaign=donnees-publiques" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
                      >
                        {translatedCategory}
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                      </Link>
                    ) : isFreelanceCategory ? (
                      <Link 
                        href="https://www.malt.fr/profile/growth" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
                      >
                        {translatedCategory}
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                      </Link>
                    ) : (
                      translatedCategory
                    )}
                    <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
                      ({results.length} {results.length > 1 ? 'objectifs' : 'objectif'})
                    </span>
                  </h3>
                  
                  {/* Encart service - Flux de données clients */}
                  {translatedCategory === 'Relation client' && (
                    <div className="mb-4 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1 text-neutral-900 dark:text-neutral-100">
                            Achat flux de données clients
                          </h4>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                            Accès en temps réel à chaque nouveau rendez-vous ou sollicitation. Notifications sur Slack, Discord, Telegram ou webhook personnalisé. Contactez directement les prospects dès qu'ils me sollicitent.
                          </p>
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                            10 000 € HT / an
                          </p>
                        </div>
                        <a
                          href="mailto:corentin@outreacher.fr?subject=Demande d'information - Flux de données clients"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors flex-shrink-0"
                          aria-label="Contacter pour le flux de données clients"
                        >
                          Me contacter
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {sortedResults.map((kr) => (
                      <div
                        key={kr.id}
                        className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-900/30"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-sm">{improveTitle(kr.name, kr.category)}</h4>
                              {kr.status?.toLowerCase() === 'done' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 bg-green-600 dark:bg-green-500 text-white">
                                  Terminé
                                </span>
                              )}
                              {kr.status?.toLowerCase() !== 'done' && kr.status?.toLowerCase() !== 'not started' && (
                                <>
                                  {kr.progress > 100 ? (
                                    <span className="relative flex h-2 w-2" title="Objectif dépassé">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600 dark:bg-orange-500"></span>
                                    </span>
                                  ) : (
                                    <span className="relative flex h-2 w-2" title="En cours">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-500"></span>
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                              <span>
                                <span className={`font-medium ${
                                  kr.progress > 100 ? 'text-orange-700 dark:text-orange-400' : 'text-neutral-900 dark:text-neutral-100'
                                }`}>
                                  {formatNumber(kr.currentResult)}
                                </span>
                                {' / '}
                                <span>{formatNumber(kr.targetResult)}</span>
                              </span>
                              {kr.progress <= 100 && kr.remaining >= 0 && (
                                <span className="text-neutral-500 dark:text-neutral-500">
                                  Reste: {formatNumber(kr.remaining)}
                                </span>
                              )}
                              {kr.progress > 100 && (
                                <span className="text-orange-700 dark:text-orange-400 font-medium">
                                  Dépassé de {Math.abs(kr.remaining).toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                            <div className="flex items-center gap-3 sm:flex-shrink-0">
                            <div className="w-20 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  kr.progress > 100 
                                    ? 'bg-orange-600 dark:bg-orange-500' 
                                    : kr.progress >= 100 
                                      ? 'bg-green-600 dark:bg-green-500' 
                                      : kr.progress >= 50 
                                        ? 'bg-blue-600 dark:bg-blue-500' 
                                        : 'bg-neutral-500 dark:bg-neutral-500'
                                }`}
                                style={{ width: `${Math.min(100, kr.progress)}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm tabular-nums text-right w-12 font-medium ${
                              kr.progress > 100 ? 'text-orange-700 dark:text-orange-400' : ''
                            }`}>
                              {kr.progress > 100 ? 'Dépassé' : `${kr.progress.toFixed(1)}%`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Graphiques de croissance */}
        <GrowthChart
          title="Évolution des rendez-vous clients"
          description="Suivi de la croissance du nombre de rendez-vous et appels clients dans le temps. Cette métrique reflète l'activité commerciale et la relation client."
          history={meetingsHistory}
          loading={meetingsLoading}
          colorFrom="blue"
          insight={meetingsHistory.length > 1 ? `Tendance ${meetingsHistory[meetingsHistory.length - 1].valeur >= meetingsHistory[0].valeur ? 'positive' : 'négative'} observée sur la période.` : null}
        />

        <GrowthChart
          title="Évolution des abonnés Logement Atypique"
          description="Croissance de la communauté Instagram de Logement Atypique. Cette métrique mesure l'engagement et la croissance de notre projet entrepreneurial."
          history={abonnesHistory}
          loading={abonnesLoading}
          colorFrom="green"
          insight={abonnesHistory.length > 1 ? `Croissance de la communauté avec ${abonnesHistory[abonnesHistory.length - 1].valeur - abonnesHistory[0].valeur >= 0 ? '+' : ''}${abonnesHistory[abonnesHistory.length - 1].valeur - abonnesHistory[0].valeur} abonnés sur la période.` : null}
        />

        <GrowthChart
          title="Évolution des utilisateurs Apify"
          description="Nombre d'utilisateurs actifs de mes scrapers publics sur Apify. Cette métrique reflète l'adoption et l'utilité de mes outils open source."
          history={apifyUsersHistory}
          loading={apifyUsersLoading}
          colorFrom="purple"
          insight={apifyUsersHistory.length > 1 ? `Adoption croissante de mes scrapers avec ${apifyUsersHistory[apifyUsersHistory.length - 1].valeur - apifyUsersHistory[0].valeur >= 0 ? '+' : ''}${apifyUsersHistory[apifyUsersHistory.length - 1].valeur - apifyUsersHistory[0].valeur} nouveaux utilisateurs.` : null}
        />

        {/* Section liens internes */}
        <section className="mb-16 pt-8 border-t border-neutral-200 dark:border-neutral-800" aria-label="Pour aller plus loin">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Pour aller plus loin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/a-propos"
              className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
              aria-label="Découvrir mon parcours"
            >
              <h3 className="font-medium mb-1">Mon Parcours</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">Découvrez mon parcours professionnel et mes projets entrepreneuriaux.</p>
            </Link>
            <Link
              href="/blog"
              className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
              aria-label="Lire mes articles"
            >
              <h3 className="font-medium mb-1">Mon Blog</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">Réflexions sur le scraping, l'automatisation, l'entrepreneuriat et le voyage.</p>
            </Link>
            <Link
              href="/outils"
              className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
              aria-label="Découvrir mes outils"
            >
              <h3 className="font-medium mb-1">Mes Outils Gratuits</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">Générateurs, extracteurs et templates pour vous aider dans votre quotidien.</p>
            </Link>
            <Link
              href="/temoignages"
              className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
              aria-label="Lire les témoignages"
            >
              <h3 className="font-medium mb-1">Témoignages Clients</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">Découvrez ce que mes clients disent de mes services.</p>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-16 pt-8 border-t border-neutral-200 dark:border-neutral-800" aria-label="Contact">
          <div className="text-center">
            <h2 className="font-semibold text-xl mb-4 tracking-tighter">Discutons de votre projet</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
              Vous avez un projet de scraping, d'automatisation ou d'outbound marketing ? 
              Réservez un créneau pour échanger sur vos besoins et voir comment je peux vous aider.
            </p>
            <Link
              href="/a-propos#contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium"
              aria-label="Réserver un créneau Calendly"
            >
              Réserver un créneau
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
