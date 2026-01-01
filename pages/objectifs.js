import Link from 'next/link'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import { useState, useEffect } from 'react'
import FAQ from '../components/FAQ'

export default function DonneesPubliques() {
  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.donneesPubliques.title,
    description: siteConfig.seo.pages.donneesPubliques.description,
    path: '/objectifs',
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
  const [chessStats, setChessStats] = useState(null)
  const [chessLoading, setChessLoading] = useState(true)
  const [chessHistory, setChessHistory] = useState([])
  const [chessHistoryLoading, setChessHistoryLoading] = useState(true)
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)

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

  useEffect(() => {
    const fetchChessStats = async () => {
      try {
        setChessLoading(true)
        const response = await fetch('/api/chess-stats')
        if (response.ok) {
          const data = await response.json()
          setChessStats(data)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des stats d\'échecs:', error)
      } finally {
        setChessLoading(false)
      }
    }

    fetchChessStats()
  }, [])

  useEffect(() => {
    const fetchChessHistory = async () => {
      try {
        setChessHistoryLoading(true)
        const response = await fetch('/api/chess-history')
        if (response.ok) {
          const data = await response.json()
          setChessHistory(data)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique Chess.com:', error)
      } finally {
        setChessHistoryLoading(false)
      }
    }

    fetchChessHistory()
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

  // Grouper les Key Results par catégorie
  const groupedByCategory = keyResults.reduce((acc, kr) => {
    const category = kr.category || 'Sans catégorie'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(kr)
    return acc
  }, {})

  // Calculer les objectifs virtuels Chess.com qui seront ajoutés
  const chessVirtualKRsCount = (() => {
    if (!chessStats || chessLoading) return 0
    
    // Vérifier si on a une catégorie Loisir/Bien-être/Santé
    const hasLoisirCategory = Object.keys(groupedByCategory).some(cat => 
      cat.toLowerCase().includes('santé') || 
      cat.toLowerCase().includes('loisir') || 
      cat.toLowerCase().includes('bien-être')
    )
    
    if (!hasLoisirCategory) return 0
    
    // Trouver la catégorie Loisir
    const loisirCategory = Object.keys(groupedByCategory).find(cat => 
      cat.toLowerCase().includes('santé') || 
      cat.toLowerCase().includes('loisir') || 
      cat.toLowerCase().includes('bien-être')
    )
    
    if (!loisirCategory) return 0
    
    const loisirResults = groupedByCategory[loisirCategory] || []
    
    // Vérifier si le Key Result Rapid existe déjà dans Notion
    const hasRapidKR = loisirResults.some(kr => {
      const nameLower = (kr.name || '').toLowerCase()
      return nameLower.includes('rapid') || nameLower.includes('échecs') || nameLower.includes('chess')
    })
    
    // Ajouter Rapid si les données existent et qu'il n'existe pas déjà
    if (!hasRapidKR && chessStats.rapid && chessStats.rapid.current > 0) {
      return 1
    }
    
    return 0
  })()

  // Calculer les statistiques globales (incluant les objectifs virtuels Chess.com)
  const totalKeyResults = keyResults.length + chessVirtualKRsCount
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
  }).length + chessVirtualKRsCount // Ajouter les objectifs Chess.com virtuels (toujours "In progress")
  // Calculer la progression globale basée sur le pourcentage moyen de tous les objectifs
  // Inclure la progression de l'objectif Chess.com virtuel
  const chessVirtualProgress = chessVirtualKRsCount > 0 && chessStats && chessStats.rapid
    ? (chessStats.rapid.current / 1000) * 100 // Objectif Rapid: 1000
    : 0
  const overallProgress = totalKeyResults > 0 
    ? Math.round((keyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0) + chessVirtualProgress) / totalKeyResults)
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
    // Arrondir à 1 décimale si c'est un nombre décimal
    const rounded = num % 1 !== 0 ? Math.round(num * 10) / 10 : num
    if (rounded >= 1000) {
      return rounded.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
    }
    return rounded.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
    }

  // Fonction pour convertir USD en EUR (taux approximatif: 1 USD = 0.92 EUR)
  const usdToEur = (usd) => {
    if (usd === null || usd === undefined || isNaN(usd)) {
      return 0
    }
    return usd * 0.92
  }

  // Fonction pour détecter si un Key Result est lié aux revenus d'affiliation
  const isAffiliationRevenue = (kr) => {
    const nameLower = (kr.name || '').toLowerCase()
    const categoryLower = (kr.category || '').toLowerCase()
    return (nameLower.includes('revenus d\'affiliation') || nameLower.includes('affiliation') || nameLower.includes('ca affiliation') || nameLower.includes('chiffre d\'affaires affiliation')) &&
           (categoryLower.includes('affiliation') || categoryLower.includes('partenariats'))
  }

  // Fonction pour déterminer si une métrique est en temps réel ou mensuelle
  const isRealTimeMetric = (kr) => {
    const nameLower = (kr.name || '').toLowerCase()
    const categoryLower = (kr.category || '').toLowerCase()
    
    // Métriques en temps réel
    const realTimeIndicators = [
      'rendez-vous',
      'meeting',
      'calendly',
      'appel',
      'call',
      'utilisateurs',
      'users',
      'abonnés',
      'abonne',
      'classement échecs',
      'elo',
      'chess'
    ]
    
    // Métriques mensuelles (blog, CA, etc.)
    const monthlyIndicators = [
      'articles publiés',
      'visiteurs',
      'impression',
      'échanges grâce au blog',
      'chiffre d\'affaires',
      'ca ',
      'revenus'
    ]
    
    // Vérifier d'abord les indicateurs mensuels
    if (monthlyIndicators.some(indicator => nameLower.includes(indicator))) {
      return false
    }
    
    // Vérifier les indicateurs temps réel
    if (realTimeIndicators.some(indicator => nameLower.includes(indicator))) {
      return true
    }
    
    // Par défaut, considérer comme mensuel si c'est dans la catégorie Blog/Personnel
    if (categoryLower.includes('personnel') || categoryLower.includes('blog')) {
      return false
    }
    
    // Par défaut, temps réel pour les autres
    return true
  }

  // Fonction pour trier les objectifs dans un ordre logique
  const sortKeyResults = (results, category) => {
    // Ordre de priorité pour chaque catégorie
    const orderMap = {
      'Apify': [
        'Nombre de scrapers disponibles',
        'Utilisateurs total Apify',
        'Utilisateurs mensuels',
        'Utilisateurs mensuels Apify',
        'Chiffre d\'affaires Apify',
        'Ventes via Datareacher Apify',
        'Revenus d\'affiliation Apify'
      ],
      'Apify & Scraping': [
        'Nombre de scrapers disponibles',
        'Utilisateurs total Apify',
        'Utilisateurs mensuels',
        'Utilisateurs mensuels Apify',
        'Chiffre d\'affaires Apify',
        'Ventes via Datareacher Apify',
        'Revenus d\'affiliation Apify'
      ],
      'Meetings Call': [
        'Rendez-vous obtenu via Calendly',
        'Calendly (génération de leads)',
        'Rendez-vous ponctuels',
        'Moyenne de durée d\'un appel',
        'Moyenne mensuelle des rendez-vous',
        'Moyenne hebdomadaire des rendez-vous'
      ],
      'Relation client': [
        'Rendez-vous obtenu via Calendly',
        'Calendly (génération de leads)',
        'Rendez-vous ponctuels',
        'Moyenne de durée d\'un appel',
        'Moyenne mensuelle des rendez-vous',
        'Moyenne hebdomadaire des rendez-vous'
      ],
      'Personnel': [
        'Elo chess.com',
        'Classement échecs (Rapid)',
        'Articles publiés blog',
        'Visiteurs totaux blog',
        'Impression Google blog',
        'Rendez-vous par blog'
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
      'Affiliation': 'Affiliation',
      'Meetings Call': 'Relation client',
      'Logement Atypique': 'Logement Atypique',
      'Apify': 'Scrapers publics',
      'Apify & Scraping': 'Scrapers publics',
      'Freelance': 'Activité freelance',
      'Santé': 'Loisir',
      'Personnel': 'Blog',
      'default': category
    }
    // Vérifier aussi si la catégorie contient "Apify" (insensible à la casse)
    if (category.toLowerCase().includes('apify')) {
      return categoryMap[category] || 'Scrapers publics'
    }
    return categoryMap[category] || category
  }
  
  // Fonction pour obtenir le lien d'affiliation selon le service
  const getAffiliationLink = (title) => {
    const titleLower = title.toLowerCase()
    if (titleLower.includes('lemlist')) {
      return 'https://get.lemlist.com/glt9nlkvruwf'
    }
    if (titleLower.includes('apify')) {
      return 'https://apify.com?fpr=0n7ukq'
    }
    if (titleLower.includes('zapier') || titleLower.includes('zapmail')) {
      return 'https://zapmail.ai?via=corentin'
    }
    return null
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
      'Total users Apify': 'Utilisateurs total Apify',
      'Utilisateurs total': 'Utilisateurs total Apify',
      'Utilisateurs total Apify': 'Utilisateurs total Apify',
      'Actors publiés': 'Scrapers publics',
      'Total monthly users': 'Utilisateurs mensuels Apify',
      'Total monthly users (Apify)': 'Utilisateurs mensuels Apify',
      'Utilisateurs mensuels': 'Utilisateurs mensuels Apify',
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
      'Zapmail affiliation': 'Revenus d\'affiliation Zapmail',
      'Apify affiliation': 'Revenus d\'affiliation Apify',
      
      // Logement Atypique (retirer "Logement Atypique" car déjà dans le titre de catégorie)
      'CA Logement Atypique': 'Chiffre d\'affaires',
      'CA Logement Atypique (€)': 'Chiffre d\'affaires',
      'Abonnés': category?.toLowerCase().includes('logement') ? 'Abonnés Instagram' : 'Abonnés',
      'Vidéos publiées': category?.toLowerCase().includes('logement') ? 'Vidéos publiées' : 'Vidéos publiées',
      
      // Meetings / Appels
      'Meetings Call': 'Rendez-vous et appels clients',
      'Calendly': 'Rendez-vous obtenu via Calendly',
      'Meeting Ad-hoc': 'Rendez-vous ponctuels',
      'Meetings ad-hoc': 'Rendez-vous ponctuels',
      'Calendly (lead gen)': 'Rendez-vous obtenu via Calendly',
      'Meeting via Calendly': 'Rendez-vous obtenu via Calendly',
      'Meetings Call - Duration Avg (min)': 'Durée moyenne des rendez-vous (min)',
      'Meetings Call - Duration Avg': 'Durée moyenne des rendez-vous',
      'Rendez-vous Appels - Duration Avg (min)': 'Moyenne de durée d\'un appel',
      'Meetings Call - Duration Avg (min)': 'Moyenne de durée d\'un appel',
      'Rendez-vous Appels - Monthly Moyenne': 'Moyenne mensuelle des appels',
      'Rendez-vous Appels - Weekly Moyenne': 'Moyenne hebdomadaire des appels',
      
      // Freelance
      'Mission Malt': 'Projets réalisés sur Malt',
      'Mission Fiverr': 'Projets réalisés sur Fiverr',
      
      // Personnel / Chess
      'Elo chess.com': 'Elo chess.com',
      'Elo Chess.com': 'Elo chess.com',
      'Elo Chess': 'Elo chess.com',
      'Classement échecs (Rapid)': 'Classement échecs chess.com',
      'Classement échecs Rapid': 'Classement échecs chess.com',
      
      // Blog
      'Articles publiés blog': 'Articles publiés',
      'Articles publiés': 'Articles publiés',
      'Visiteurs totaux blog': 'Visiteurs blog',
      'Visiteurs totaux': 'Visiteurs blog',
      'Impression Google blog': 'Impressions Google',
      'Impression Google': 'Impressions Google',
      'Rendez-vous par blog': 'Échanges grâce au blog',
      'Échanges blog': 'Échanges grâce au blog',
      
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
    
    // Retirer "Logement Atypique" des titres si on est dans la catégorie Logement Atypique
    const categoryLower = category?.toLowerCase() || ''
    if (categoryLower.includes('logement') || categoryLower.includes('entrepreneurial')) {
      improved = improved.replace(/\s*Logement\s+Atypique\s*/gi, ' ').trim()
      improved = improved.replace(/\s+/g, ' ').trim()
    }
    
    // Nettoyer les espaces multiples
    improved = improved.replace(/\s+/g, ' ').trim()
    
    return improved
  }

  // Composant réutilisable pour les graphiques de croissance
  const GrowthChart = ({ title, description, history, loading, colorFrom = 'blue', colorTo = 'blue', insight, targetValue }) => {
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
            <div className="flex items-end justify-between gap-1 md:gap-2 h-64 relative" role="img" aria-label={`Graphique de ${title.toLowerCase()}`}>
              {/* Ligne d'objectif si targetValue est fourni */}
              {targetValue && (() => {
                const maxValue = Math.max(...history.map(h => h.valeur), targetValue || 0)
                const targetHeight = maxValue > 0 ? (targetValue / maxValue) * 100 : 0
                return (
                  <div 
                    className="absolute left-0 right-0 border-t-2 border-dashed border-neutral-400 dark:border-neutral-500 z-10"
                    style={{ bottom: `${targetHeight}%` }}
                    title={`Objectif: ${formatNumber(targetValue)}`}
                  >
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-0 md:translate-x-full ml-0 md:ml-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded whitespace-nowrap -mr-2 md:mr-0">
                      Objectif: {formatNumber(targetValue)}
                    </div>
                  </div>
                )
              })()}
              {history.map((item, index) => {
                const maxValue = Math.max(...history.map(h => h.valeur), targetValue || 0)
                const height = maxValue > 0 ? (item.valeur / maxValue) * 100 : 0
                
                return (
                  <div key={item.id} className="flex-1 flex flex-col items-center gap-1 md:gap-2 min-w-0 relative">
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
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 text-center mt-2 min-w-0 w-full px-0.5">
                      <div className="font-medium truncate">{formatNumber(item.valeur)}</div>
                      <div className="hidden md:block text-[10px] mt-1 leading-tight">{item.date}</div>
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
                {targetValue && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-neutral-600 dark:text-neutral-400">Objectif 2026</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {formatNumber(targetValue)}
                    </span>
                  </div>
                )}
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
            name: 'Objectifs',
            item: `${siteConfig.url}/objectifs`
          }
        ]
      }} />
      <StructuredData type="Dataset" data={{
        name: 'Objectifs 2026 et Progression Business',
        description: 'Objectifs business, métriques de croissance et progression des projets freelance.',
        url: `${siteConfig.url}/objectifs`,
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        keywords: ['objectifs business', 'métriques', 'progression', 'key results']
      }} />
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="mb-8">
          <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Objectifs 2026</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-0 tracking-tight">
            Transparence totale sur mes <strong className="text-neutral-900 dark:text-neutral-100">objectifs</strong>, mes <strong className="text-neutral-900 dark:text-neutral-100">challenges</strong> et ma <strong className="text-neutral-900 dark:text-neutral-100">progression</strong>. Voici mes objectifs 2026 et quelques métriques publiques. Certaines sont mises à jour en <strong className="text-neutral-900 dark:text-neutral-100">temps réel</strong>, d'autres une <strong className="text-neutral-900 dark:text-neutral-100">fois par mois</strong>. En parallèle de mon activité freelance, je développe <Link href="https://logement-atypique.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-900 dark:hover:text-neutral-100"><strong className="text-neutral-900 dark:text-neutral-100">Logement Atypique</strong></Link> avec mon frère — on met en avant des logements d'exception partout en France. Cette page vous permet de suivre l'évolution de mes projets, de mes partenariats et de mes métriques business.
          </p>
        </section>

        {/* TL;DR - Métriques clés */}
        {!loading && (
          <section className="mb-12 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50" aria-label="Métriques clés">
            <h2 className="font-semibold text-lg mb-4 tracking-tighter">En un coup d'œil</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  {(() => {
                    const maltRemaining = keyResults
                      .filter(kr => {
                        const nameLower = (kr.name || '').toLowerCase()
                        return nameLower.includes('mission malt')
                      })
                      .reduce((sum, kr) => {
                        const remaining = (kr.targetResult || 0) - (kr.currentResult || 0)
                        return sum + Math.max(0, remaining) // Ne pas afficher de nombre négatif
                      }, 0)
                    const fiverrRemaining = keyResults
                      .filter(kr => {
                        const nameLower = (kr.name || '').toLowerCase()
                        return nameLower.includes('mission fiverr')
                      })
                      .reduce((sum, kr) => {
                        const remaining = (kr.targetResult || 0) - (kr.currentResult || 0)
                        return sum + Math.max(0, remaining) // Ne pas afficher de nombre négatif
                      }, 0)
                    const totalRemaining = maltRemaining + fiverrRemaining
                    return totalRemaining > 0 ? `${totalRemaining}+` : '0'
                  })()}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Missions restantes 2026</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">5/5</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Taux de réussite</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">7 jours</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Délai moyen</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">20-30</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Projets/mois</p>
              </div>
            </div>
          </section>
        )}


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
                    
                    // CA Freelance : chercher le KR principal (le plus grand ou celui avec "total")
                    const caFreelanceKRs = keyResults.filter(kr => {
                      const categoryLower = (kr.category || '').toLowerCase()
                      const nameLower = (kr.name || '').toLowerCase()
                      return (categoryLower.includes('freelance') || categoryLower.includes('freelancing')) &&
                             (nameLower.includes('ca') || nameLower.includes('chiffre')) &&
                             !nameLower.includes('affiliation')
                    })
                    
                    // Prendre le KR avec "total" s'il existe, sinon le plus grand
                    const caFreelanceTotalKR = caFreelanceKRs.find(kr => {
                      const nameLower = (kr.name || '').toLowerCase()
                      return nameLower.includes('total')
                    })
                    
                    let caFreelance = 0
                    if (caFreelanceTotalKR) {
                      caFreelance = caFreelanceTotalKR.targetResult || 0
                    } else if (caFreelanceKRs.length > 0) {
                      // Prendre le plus grand si pas de "total"
                      caFreelance = Math.max(...caFreelanceKRs.map(kr => kr.targetResult || 0))
                    }
                    
                    // CA Affiliation : chercher le KR principal (le plus grand ou celui avec "total")
                    const caAffiliationKRs = keyResults.filter(kr => {
                      const categoryLower = (kr.category || '').toLowerCase()
                      const nameLower = (kr.name || '').toLowerCase()
                      return (categoryLower.includes('affiliation') || categoryLower.includes('partenariats')) &&
                             (nameLower.includes('ca') || nameLower.includes('chiffre') || nameLower.includes('revenus'))
                    })
                    
                    // Prendre le KR avec "total" s'il existe, sinon additionner tous les revenus d'affiliation
                    const caAffiliationTotalKR = caAffiliationKRs.find(kr => {
                      const nameLower = (kr.name || '').toLowerCase()
                      return nameLower.includes('total')
                    })
                    
                    let caAffiliation = 0
                    if (caAffiliationTotalKR) {
                      caAffiliation = caAffiliationTotalKR.targetResult || 0
                    } else if (caAffiliationKRs.length > 0) {
                      // Additionner tous les revenus d'affiliation (Apify, Lemlist, Zapmail, etc.)
                      caAffiliation = caAffiliationKRs.reduce((sum, kr) => sum + (kr.targetResult || 0), 0)
                    }
                    
                    // CA Logement Atypique : chercher le KR avec "ARR" (Annual Recurring Revenue)
                    const caLogementAtypiqueKRs = keyResults.filter(kr => {
                      const categoryLower = (kr.category || '').toLowerCase()
                      const nameLower = (kr.name || '').toLowerCase()
                      return (categoryLower.includes('logement') || categoryLower.includes('entrepreneurial')) &&
                             (nameLower.includes('arr') || nameLower.includes('ca') || nameLower.includes('chiffre')) &&
                             nameLower.includes('logement')
                    })
                    
                    // Prendre le KR avec "ARR" s'il existe, sinon le plus grand
                    const caLogementAtypiqueTotalKR = caLogementAtypiqueKRs.find(kr => {
                      const nameLower = (kr.name || '').toLowerCase()
                      return nameLower.includes('arr')
                    })
                    
                    let caLogementAtypique = 0
                    if (caLogementAtypiqueTotalKR) {
                      caLogementAtypique = caLogementAtypiqueTotalKR.targetResult || 0
                    } else if (caLogementAtypiqueKRs.length > 0) {
                      // Prendre le plus grand si pas d'ARR
                      caLogementAtypique = Math.max(...caLogementAtypiqueKRs.map(kr => kr.targetResult || 0))
                    }
                    
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
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4">Taux de réussite</h3>
                <div className="flex flex-col md:flex-row md:gap-4 space-y-3 md:space-y-0">
                  <div className="flex-1">
                    <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">5/5</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Malt</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">sur 160 missions</p>
                    </div>
                  <div className="flex-1">
                    <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">4,9/5</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Fiverr</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">sur 250 missions</p>
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
              {Object.entries(groupedByCategory)
                .filter(([category]) => {
                  // Exclure les catégories "Mission Malt" et "Mission Fiverr"
                  const categoryLower = category.toLowerCase()
                  return !categoryLower.includes('mission malt') && !categoryLower.includes('mission fiverr')
                })
                .map(([category, results]) => {
                const translatedCategory = translateCategory(category)
                const isApifyCategory = category.toLowerCase().includes('apify')
                const isLogementAtypiqueCategory = category.toLowerCase().includes('logement')
                const isFreelanceCategory = category.toLowerCase().includes('freelance') || category.toLowerCase().includes('freelancing')
                const isLoisirCategory = category.toLowerCase().includes('santé') || category.toLowerCase().includes('loisir') || category.toLowerCase().includes('bien-être')
                
                // Ajouter les Key Results d'échecs virtuels si on est dans la catégorie Loisir
                let resultsToDisplay = [...results]
                if (isLoisirCategory && chessStats && !chessLoading) {
                  // Objectif d'échecs Rapid (défini directement, sans Notion)
                  const rapidTarget = 1000
                  
                  // Vérifier si le Key Result Rapid existe déjà dans Notion
                  const hasRapidKR = results.some(kr => {
                    const nameLower = (kr.name || '').toLowerCase()
                    return nameLower.includes('rapid') || nameLower.includes('échecs') || nameLower.includes('chess')
                  })
                  
                  // Ajouter Rapid si les données existent
                  if (!hasRapidKR && chessStats.rapid.current > 0) {
                    resultsToDisplay.push({
                      id: 'chess-rapid-virtual',
                      name: 'Classement échecs (Rapid)',
                      category: category,
                      status: 'In progress',
                      currentResult: chessStats.rapid.current,
                      targetResult: rapidTarget,
                      progress: rapidTarget > 0 ? (chessStats.rapid.current / rapidTarget) * 100 : 0
                    })
                  }
                }
                
                // Trier les résultats dans un ordre logique
                const sortedResults = sortKeyResults(resultsToDisplay, category)
                
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
                        Scrapers publics sur Apify
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                      </Link>
                    ) : isLogementAtypiqueCategory ? (
                      <Link 
                        href="https://logement-atypique.fr/?utm_source=corentinrobert&utm_medium=website&utm_campaign=objectifs" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
                      >
                        Logement Atypique
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
                      {(() => {
                        // Compter uniquement les Key Results qui seront réellement affichés (après filtrage)
                        const filteredCount = sortedResults.filter((kr) => {
                          const title = improveTitle(kr.name, kr.category)
                          const nameLower = (kr.name || '').toLowerCase()
                          const categoryLower = (kr.category || '').toLowerCase()
                          return !title.includes('Rendez-vous ponctuels') &&
                                 !title.includes('ponctuels') &&
                                 !nameLower.includes('ad-hoc') &&
                                 !nameLower.includes('ad hoc') &&
                                 !(nameLower.includes('calendly') && (nameLower.includes('%') || nameLower.includes('pourcentage') || nameLower.includes('génération'))) &&
                                 !(nameLower.includes('appels malt') || nameLower.includes('appels fiverr')) &&
                                 !(categoryLower.includes('personnel') && (nameLower.includes('elo') || nameLower.includes('chess') || nameLower.includes('échecs')))
                        }).length
                        return `(${filteredCount} ${filteredCount > 1 ? 'objectifs' : 'objectif'})`
                      })()}
                    </span>
                  </h3>
                  
                  {/* Encart service - Flux de données clients */}
                  {translatedCategory === 'Relation client' && (
                    <div className="mb-4 p-4 rounded-lg border-dashed border border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors group min-h-[96px]">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h2 className="font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200 mb-1">
                            Achat flux de données clients
                          </h2>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                            Accès en temps réel aux nouveaux rendez-vous. Notifications sur Slack, Discord, Telegram ou webhook.
                          </p>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            10 000 € HT / an
                          </p>
                        </div>
                        <button
                          onClick={openCalendly}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex-shrink-0 self-start sm:self-auto"
                          aria-label="Réserver un créneau Calendly"
                        >
                          Réserver un créneau
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {sortedResults
                      .filter((kr) => {
                        const title = improveTitle(kr.name, kr.category)
                        const nameLower = (kr.name || '').toLowerCase()
                        const categoryLower = (kr.category || '').toLowerCase()
                        // Exclure "Rendez-vous ponctuels", "% Calendly (génération de leads)", et les appels Malt/Fiverr (ils seront affichés comme sous-éléments)
                        // Exclure "Elo chess.com" de la catégorie Blog/Personnel
                        return !title.includes('Rendez-vous ponctuels') &&
                               !title.includes('ponctuels') &&
                               !nameLower.includes('ad-hoc') &&
                               !nameLower.includes('ad hoc') &&
                               !(nameLower.includes('calendly') && (nameLower.includes('%') || nameLower.includes('pourcentage') || nameLower.includes('génération'))) &&
                               !(nameLower.includes('appels malt') || nameLower.includes('appels fiverr')) &&
                               !(categoryLower.includes('personnel') && (nameLower.includes('elo') || nameLower.includes('chess') || nameLower.includes('échecs')))
                      })
                      .map((kr) => {
                        // Détecter si c'est "Rendez-vous obtenu via Calendly"
                        const title = improveTitle(kr.name, kr.category)
                        const isCalendlyMain = title.includes('Rendez-vous obtenu via Calendly')
                        
                        // Trouver les sous-éléments (Appels Malt et Appels Fiverr) dans la même catégorie
                        const subItems = isCalendlyMain ? sortedResults.filter(subKr => {
                          const subNameLower = (subKr.name || '').toLowerCase()
                          return (subNameLower.includes('appels malt') || subNameLower.includes('appels fiverr')) &&
                                 subKr.category === kr.category
                        }) : []
                        
                        return (
                      <div
                        key={kr.id}
                        className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group min-h-[96px]"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap sm:flex-nowrap">
                              <h2 className="font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200 flex-1 min-w-0 sm:flex-initial">
                                {(() => {
                                  const title = improveTitle(kr.name, kr.category)
                                  const nameLower = (kr.name || '').toLowerCase()
                                  const categoryLower = (kr.category || '').toLowerCase()
                                  const isAffiliationKR = isAffiliationRevenue(kr)
                                  const affiliationLink = isAffiliationKR ? getAffiliationLink(kr.name) : null
                                  
                                  if (affiliationLink) {
                                    return (
                                      <Link 
                                        href={affiliationLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors group/link"
                                      >
                                        <span className="break-words">{title}</span>
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 flex-shrink-0">
                                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                                        </svg>
                                      </Link>
                                    )
                                  }
                                  return <span className="break-words">{title}</span>
                                })()}
                              </h2>
                              {kr.status?.toLowerCase() === 'done' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 bg-green-600 dark:bg-green-500 text-white">
                                  Terminé
                                </span>
                              )}
                              {kr.status?.toLowerCase() !== 'done' && kr.status?.toLowerCase() !== 'not started' && (
                                <>
                                  {kr.progress > 100 ? (
                                    <span className="relative flex h-2 w-2 flex-shrink-0 mt-1 sm:mt-0" title="Objectif dépassé">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600 dark:bg-orange-500"></span>
                                    </span>
                                  ) : (
                                    <span className="relative flex h-2 w-2 flex-shrink-0 mt-1 sm:mt-0" title="En cours">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-500"></span>
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-0">
                              <span className="flex items-center gap-1">
                                <span className={`text-sm font-medium ${
                                  kr.progress > 100 ? 'text-orange-700 dark:text-orange-400' : 'text-neutral-900 dark:text-neutral-100'
                                }`}>
                                  {(() => {
                                    // Pour les objectifs d'échecs, utiliser les données Chess.com
                                    const nameLower = (kr.name || '').toLowerCase()
                                    const categoryLower = (kr.category || '').toLowerCase()
                                    const isChessKR = (nameLower.includes('rapid') || nameLower.includes('blitz') || nameLower.includes('tactics') || nameLower.includes('tactiques') || nameLower.includes('échecs') || nameLower.includes('chess')) &&
                                                      (categoryLower.includes('santé') || categoryLower.includes('loisir') || categoryLower.includes('bien-être'))
                                    
                                    if (isChessKR && chessStats) {
                                      if (nameLower.includes('rapid')) {
                                        return formatNumber(chessStats.rapid.current || 0)
                                      }
                                      if (nameLower.includes('blitz')) {
                                        return formatNumber(chessStats.blitz.current || 0)
                                      }
                                      if (nameLower.includes('tactics') || nameLower.includes('tactiques')) {
                                        return formatNumber(chessStats.tactics.highest || 0)
                                      }
                                    }
                                    
                                    // Pour "Revenus d'affiliation" (sans nom de service), calculer la somme de tous les revenus d'affiliation individuels
                                    const isAffiliationTotal = (nameLower.includes('revenus d\'affiliation') || nameLower.includes('ca affiliation') || nameLower.includes('chiffre d\'affaires affiliation')) &&
                                                               !nameLower.includes('apify') && !nameLower.includes('lemlist') && !nameLower.includes('zapier') &&
                                                               (categoryLower.includes('affiliation') || categoryLower.includes('partenariats'))
                                    
                                    if (isAffiliationTotal) {
                                      // Somme de tous les revenus d'affiliation individuels (en USD, convertis en EUR)
                                      const affiliationKRs = keyResults.filter(otherKr => {
                                        const otherNameLower = (otherKr.name || '').toLowerCase()
                                        const otherCategoryLower = (otherKr.category || '').toLowerCase()
                                        return (otherNameLower.includes('revenus d\'affiliation') || otherNameLower.includes('affiliation')) &&
                                               (otherNameLower.includes('apify') || otherNameLower.includes('lemlist') || otherNameLower.includes('zapier')) &&
                                               (otherCategoryLower.includes('affiliation') || otherCategoryLower.includes('partenariats'))
                                      })
                                      const totalAffiliationUSD = affiliationKRs.reduce((sum, otherKr) => sum + (otherKr.currentResult || 0), 0)
                                      const totalAffiliationEUR = usdToEur(totalAffiliationUSD)
                                      return formatNumber(Math.round(totalAffiliationEUR))
                                    }
                                    // Pour les revenus d'affiliation individuels, convertir USD en EUR
                                    if (isAffiliationRevenue(kr)) {
                                      return formatNumber(Math.round(usdToEur(kr.currentResult || 0)))
                                    }
                                    return formatNumber(kr.currentResult)
                                  })()}
                                </span>
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">/</span>
                                <span className="text-sm">{(() => {
                                  // Convertir les targetResult des revenus d'affiliation de USD en EUR
                                  if (isAffiliationRevenue(kr)) {
                                    return formatNumber(Math.round(usdToEur(kr.targetResult || 0)))
                                  }
                                  return formatNumber(kr.targetResult)
                                })()}</span>
                                {(() => {
                                  // Calculer le remaining et progress avec la valeur réelle pour "Revenus d'affiliation"
                                  const nameLower = (kr.name || '').toLowerCase()
                                  const categoryLower = (kr.category || '').toLowerCase()
                                  const isAffiliationTotal = (nameLower.includes('revenus d\'affiliation') || nameLower.includes('ca affiliation') || nameLower.includes('chiffre d\'affaires affiliation')) &&
                                                             !nameLower.includes('apify') && !nameLower.includes('lemlist') && !nameLower.includes('zapier') &&
                                                             (categoryLower.includes('affiliation') || categoryLower.includes('partenariats'))
                                  
                                  let actualCurrentResult = kr.currentResult || 0
                                  let actualTargetResult = kr.targetResult || 0
                                  
                                  // Convertir USD en EUR pour les revenus d'affiliation
                                  if (isAffiliationRevenue(kr)) {
                                    actualCurrentResult = usdToEur(actualCurrentResult)
                                    actualTargetResult = usdToEur(actualTargetResult)
                                  }
                                  
                                  if (isAffiliationTotal) {
                                    const affiliationKRs = keyResults.filter(otherKr => {
                                      const otherNameLower = (otherKr.name || '').toLowerCase()
                                      const otherCategoryLower = (otherKr.category || '').toLowerCase()
                                      return (otherNameLower.includes('revenus d\'affiliation') || otherNameLower.includes('affiliation')) &&
                                             (otherNameLower.includes('apify') || otherNameLower.includes('lemlist') || otherNameLower.includes('zapier')) &&
                                             (otherCategoryLower.includes('affiliation') || otherCategoryLower.includes('partenariats'))
                                    })
                                    const totalAffiliationUSD = affiliationKRs.reduce((sum, otherKr) => sum + (otherKr.currentResult || 0), 0)
                                    actualCurrentResult = usdToEur(totalAffiliationUSD)
                                    // Le targetResult du total est déjà en EUR dans Notion, pas besoin de conversion
                                  }
                                  
                                  const actualRemaining = actualTargetResult - actualCurrentResult
                                  const actualProgress = actualTargetResult > 0 ? (actualCurrentResult / actualTargetResult) * 100 : 0
                                  
                                  if (actualProgress <= 100 && actualRemaining >= 0) {
                                    return (
                                      <span className="ml-4 text-sm text-neutral-500 dark:text-neutral-500">
                                        Reste: {formatNumber(actualRemaining)}
                              </span>
                                    )
                                  }
                                  if (actualProgress > 100) {
                                    return (
                                      <span className="ml-4 text-sm text-orange-700 dark:text-orange-400 font-medium">
                                        Dépassé de {Math.abs(actualRemaining).toFixed(1)}
                                </span>
                                    )
                                  }
                                  return null
                                })()}
                                </span>
                            </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                            {(() => {
                              // Calculer le progress avec la valeur réelle pour "Revenus d'affiliation" et échecs
                              const nameLower = (kr.name || '').toLowerCase()
                              const categoryLower = (kr.category || '').toLowerCase()
                              
                              // Pour les objectifs d'échecs, utiliser les données Chess.com
                              const isChessKR = (nameLower.includes('rapid') || nameLower.includes('blitz') || nameLower.includes('tactics') || nameLower.includes('tactiques') || nameLower.includes('échecs') || nameLower.includes('chess')) &&
                                                (categoryLower.includes('santé') || categoryLower.includes('loisir') || categoryLower.includes('bien-être'))
                              
                              let actualCurrentResult = kr.currentResult || 0
                              let actualTargetResult = kr.targetResult || 0
                              
                              if (isChessKR && chessStats) {
                                if (nameLower.includes('rapid')) {
                                  actualCurrentResult = chessStats.rapid.current || 0
                                } else if (nameLower.includes('blitz')) {
                                  actualCurrentResult = chessStats.blitz.current || 0
                                } else if (nameLower.includes('tactics') || nameLower.includes('tactiques')) {
                                  actualCurrentResult = chessStats.tactics.highest || 0
                                }
                              }
                              
                              const isAffiliationTotal = (nameLower.includes('revenus d\'affiliation') || nameLower.includes('ca affiliation') || nameLower.includes('chiffre d\'affaires affiliation')) &&
                                                         !nameLower.includes('apify') && !nameLower.includes('lemlist') && !nameLower.includes('zapier') &&
                                                         (categoryLower.includes('affiliation') || categoryLower.includes('partenariats'))
                              
                              let actualProgress = kr.progress || 0
                              
                              if (isChessKR && actualTargetResult > 0) {
                                actualProgress = (actualCurrentResult / actualTargetResult) * 100
                              } else if (isAffiliationTotal) {
                                const affiliationKRs = keyResults.filter(otherKr => {
                                  const otherNameLower = (otherKr.name || '').toLowerCase()
                                  const otherCategoryLower = (otherKr.category || '').toLowerCase()
                                  return (otherNameLower.includes('revenus d\'affiliation') || otherNameLower.includes('affiliation')) &&
                                         (otherNameLower.includes('apify') || otherNameLower.includes('lemlist') || otherNameLower.includes('zapier')) &&
                                         (otherCategoryLower.includes('affiliation') || otherCategoryLower.includes('partenariats'))
                                })
                                const totalAffiliationUSD = affiliationKRs.reduce((sum, otherKr) => sum + (otherKr.currentResult || 0), 0)
                                const totalAffiliationEUR = usdToEur(totalAffiliationUSD)
                                actualProgress = kr.targetResult > 0 ? (totalAffiliationEUR / kr.targetResult) * 100 : 0
                              } else if (isAffiliationRevenue(kr)) {
                                // Pour les revenus d'affiliation individuels, convertir USD en EUR
                                const currentEUR = usdToEur(kr.currentResult || 0)
                                const targetEUR = usdToEur(kr.targetResult || 0)
                                actualProgress = targetEUR > 0 ? (currentEUR / targetEUR) * 100 : 0
                              }
                              
                              return (
                                <>
                            <div className="w-20 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                        actualProgress > 100 
                                    ? 'bg-orange-600 dark:bg-orange-500' 
                                          : actualProgress >= 100 
                                      ? 'bg-green-600 dark:bg-green-500' 
                                            : actualProgress >= 50 
                                        ? 'bg-blue-600 dark:bg-blue-500' 
                                        : 'bg-neutral-500 dark:bg-neutral-500'
                                }`}
                                      style={{ width: `${Math.min(100, actualProgress)}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm tabular-nums text-right w-12 font-medium ${
                                    actualProgress > 100 ? 'text-orange-700 dark:text-orange-400' : ''
                            }`}>
                                    {actualProgress > 100 ? 'Dépassé' : `${actualProgress.toFixed(1)}%`}
                            </span>
                                </>
                              )
                            })()}
                          </div>
                        </div>
                        
                        {/* Sous-éléments pour "Rendez-vous obtenu via Calendly" */}
                        {isCalendlyMain && subItems.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                            {subItems.map((subKr) => (
                              <div
                                key={subKr.id}
                                className="pl-4 py-2 rounded border-l-2 border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/30"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                      {improveTitle(subKr.name, subKr.category)}
                                    </h3>
                                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                        {formatNumber(subKr.currentResult || 0)}
                                      </span>
                                      <span className="text-neutral-500 dark:text-neutral-500"> / </span>
                                      <span>{formatNumber(subKr.targetResult || 0)}</span>
                                      {(() => {
                                        const remaining = (subKr.targetResult || 0) - (subKr.currentResult || 0)
                                        const progress = subKr.targetResult > 0 ? (subKr.currentResult / subKr.targetResult) * 100 : 0
                                        if (progress <= 100 && remaining >= 0) {
                                          return (
                                            <span className="ml-3 text-xs text-neutral-500 dark:text-neutral-500">
                                              Reste: {formatNumber(remaining)}
                                            </span>
                                          )
                                        }
                                        return null
                                      })()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="w-16 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full transition-all duration-500 ${
                                          subKr.progress > 100 
                                            ? 'bg-orange-600 dark:bg-orange-500' 
                                            : subKr.progress >= 100 
                                              ? 'bg-green-600 dark:bg-green-500' 
                                              : subKr.progress >= 50 
                                                ? 'bg-blue-600 dark:bg-blue-500' 
                                                : 'bg-neutral-500 dark:bg-neutral-500'
                                        }`}
                                        style={{ width: `${Math.min(100, subKr.progress || 0)}%` }}
                                      ></div>
                                    </div>
                                    <span className={`text-xs tabular-nums w-10 text-right font-medium ${
                                      subKr.progress > 100 ? 'text-orange-700 dark:text-orange-400' : ''
                                    }`}>
                                      {subKr.progress > 100 ? 'Dépassé' : `${(subKr.progress || 0).toFixed(1)}%`}
                                    </span>
                          </div>
                        </div>
                      </div>
                    ))}
                          </div>
                        )}
                      </div>
                    )})}
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
          targetValue={(() => {
            // Trouver l'objectif pour les rendez-vous clients
            // Chercher tous les Key Results qui correspondent aux rendez-vous avec des critères élargis
            const matchingKRs = keyResults.filter(kr => {
              const nameLower = (kr.name || '').toLowerCase()
              const categoryLower = (kr.category || '').toLowerCase()
              const target = kr.targetResult || 0
              
              // Critères élargis pour capturer tous les Key Results liés aux rendez-vous
              // On accepte si le nom OU la catégorie correspond (plus permissif)
              const matchesName = nameLower.includes('rendez-vous') || 
                                  nameLower.includes('meeting') || 
                                  nameLower.includes('calendly') ||
                                  nameLower.includes('appel') ||
                                  nameLower.includes('call')
              const matchesCategory = categoryLower.includes('meeting') || 
                                      categoryLower.includes('relation') || 
                                      categoryLower.includes('client') ||
                                      categoryLower.includes('appel')
              
              // Prioriser aussi les Key Results avec un targetResult proche de 550 (objectif principal)
              const isMainObjective = target >= 500 && target <= 600
              
              return (matchesName || matchesCategory) && target > 0
            })
            
            if (matchingKRs.length > 0) {
              // Toujours prendre celui avec le plus grand targetResult
              // Cela garantit qu'on prend l'objectif principal (550) plutôt qu'un sous-objectif (360, 60, 30)
              const meetingsKR = matchingKRs.reduce((max, kr) => {
                const maxTarget = max.targetResult || 0
                const krTarget = kr.targetResult || 0
                return krTarget > maxTarget ? kr : max
              })
              return meetingsKR?.targetResult || null
            }
            
            // Fallback : chercher spécifiquement un Key Result avec targetResult = 550
            // (au cas où il ne correspondrait pas aux critères de nom/catégorie)
            const kr550 = keyResults.find(kr => kr.targetResult === 550)
            if (kr550) {
              return 550
            }
            
            return null
          })()}
          insight={meetingsHistory.length > 1 ? `Tendance ${meetingsHistory[meetingsHistory.length - 1].valeur >= meetingsHistory[0].valeur ? 'positive' : 'négative'} observée sur la période.` : null}
        />

        <GrowthChart
          title="Évolution des abonnés Logement Atypique"
          description="Croissance de la communauté Instagram de Logement Atypique. Cette métrique mesure l'engagement et la croissance de notre projet entrepreneurial."
          history={abonnesHistory}
          loading={abonnesLoading}
          colorFrom="green"
          targetValue={(() => {
            // Trouver l'objectif pour les abonnés Logement Atypique
            const abonnesKR = keyResults.find(kr => {
              const nameLower = (kr.name || '').toLowerCase()
              const categoryLower = (kr.category || '').toLowerCase()
              return (nameLower.includes('abonnés') || nameLower.includes('abonne')) &&
                     (categoryLower.includes('logement') || categoryLower.includes('entrepreneurial'))
            })
            return abonnesKR?.targetResult || null
          })()}
          insight={abonnesHistory.length > 1 ? `Croissance de la communauté avec ${abonnesHistory[abonnesHistory.length - 1].valeur - abonnesHistory[0].valeur >= 0 ? '+' : ''}${abonnesHistory[abonnesHistory.length - 1].valeur - abonnesHistory[0].valeur} abonnés sur la période.` : null}
        />

        <GrowthChart
          title="Évolution des utilisateurs Apify"
          description="Nombre d'utilisateurs actifs de mes scrapers publics sur Apify. Cette métrique reflète l'adoption et l'utilité de mes outils open source."
          history={apifyUsersHistory}
          loading={apifyUsersLoading}
          colorFrom="purple"
          targetValue={(() => {
            // Trouver l'objectif pour les utilisateurs Apify
            // Chercher d'abord "Utilisateurs total" ou "Total users" qui est le Key Result principal
            let apifyKR = keyResults.find(kr => {
              const nameLower = (kr.name || '').toLowerCase()
              const categoryLower = (kr.category || '').toLowerCase()
              return (nameLower.includes('utilisateurs total') || nameLower.includes('total users')) &&
                     (categoryLower.includes('apify') || categoryLower.includes('scraping'))
            })
            
            // Si pas trouvé, chercher celui avec le plus grand targetResult parmi ceux qui correspondent
            if (!apifyKR) {
              const matchingKRs = keyResults.filter(kr => {
                const nameLower = (kr.name || '').toLowerCase()
                const categoryLower = (kr.category || '').toLowerCase()
                return (nameLower.includes('utilisateur') || nameLower.includes('user')) &&
                       (categoryLower.includes('apify') || categoryLower.includes('scraping'))
              })
              
              if (matchingKRs.length > 0) {
                // Prendre celui avec le plus grand targetResult
                apifyKR = matchingKRs.reduce((max, kr) => 
                  (kr.targetResult || 0) > (max.targetResult || 0) ? kr : max
                )
              }
            }
            
            return apifyKR?.targetResult || null
          })()}
          insight={apifyUsersHistory.length > 1 ? `Adoption croissante de mes scrapers avec ${apifyUsersHistory[apifyUsersHistory.length - 1].valeur - apifyUsersHistory[0].valeur >= 0 ? '+' : ''}${apifyUsersHistory[apifyUsersHistory.length - 1].valeur - apifyUsersHistory[0].valeur} nouveaux utilisateurs.` : null}
        />

        <GrowthChart
          title="Évolution du classement échecs chess.com"
          description="Progression de mon classement Rapid sur Chess.com. Cette métrique reflète mon engagement dans l'amélioration personnelle et la pratique régulière des échecs."
          history={chessHistory}
          loading={chessHistoryLoading}
          colorFrom="blue"
          targetValue={(() => {
            // Trouver l'objectif pour le classement échecs Rapid
            const chessKR = keyResults.find(kr => {
              const nameLower = (kr.name || '').toLowerCase()
              const categoryLower = (kr.category || '').toLowerCase()
              return (nameLower.includes('elo') || nameLower.includes('rapid') || nameLower.includes('échecs') || nameLower.includes('chess')) &&
                     (categoryLower.includes('personnel') || categoryLower.includes('santé') || categoryLower.includes('loisir') || categoryLower.includes('bien-être'))
            })
            return chessKR?.targetResult || 1000 // Fallback à 1000 si pas trouvé
          })()}
          insight={chessHistory.length > 1 ? `Progression du classement avec ${chessHistory[chessHistory.length - 1].valeur - chessHistory[0].valeur >= 0 ? '+' : ''}${chessHistory[chessHistory.length - 1].valeur - chessHistory[0].valeur} points sur la période.` : null}
        />


        {/* FAQ */}
        <section className="mb-16">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Questions fréquentes</h2>
          <FAQ
            items={[
              {
                question: "Pourquoi partager ces objectifs ?",
                answer: (
                  <>
                    <p className="mb-3">
                      <strong>Transparence et confiance :</strong> En partageant publiquement mes objectifs et ma progression, 
                      je démontre mon engagement envers la transparence et la responsabilité. C'est une façon de construire la confiance avec mes clients et partenaires.
                    </p>
                    <p className="mb-3">
                      <strong>Reconnaissance de la réalité :</strong> Les objectifs ne sont pas toujours atteints, 
                      et c'est normal. Montrer les succès comme les défis permet de donner une vision authentique de mon activité.
                    </p>
                    <p>
                      <strong>Inspiration et partage :</strong> Ces données peuvent inspirer d'autres entrepreneurs 
                      et freelances à adopter une approche similaire de transparence dans leur communication.
                    </p>
                  </>
                )
              },
              {
                question: "Quel est l'impact pour mes clients ?",
                answer: (
                  <>
                    <p className="mb-3">
                      <strong>Réactivité extrême :</strong> Livraison en moins d'une semaine. Je privilégie la rapidité d'exécution pour que vous puissiez exploiter vos données rapidement.
                    </p>
                    <p>
                      <strong>Systèmes longue durée :</strong> Je construis des solutions pérennes — comme les scrapers Apify — qui fonctionnent dans le temps. 
                      Vous gagnez un temps considérable en automatisant des processus répétitifs, et le système continue de tourner même après la livraison.
                    </p>
                  </>
                )
              },
              {
                question: "Quelle est votre capacité et disponibilité ?",
                answer: (
                  <>
                    <p className="mb-3">
                      <strong>Volume de projets :</strong> Je traite jusqu'à <strong>20 à 30 projets par mois</strong>, 
                      avec un suivi rigoureux de chaque mission.
                    </p>
                    <p className="mb-3">
                      <strong>Disponibilité pour échanger :</strong> Jusqu'à <strong>4 appels de 20 minutes par jour</strong> pour discuter de votre projet. 
                      <button onClick={openCalendly} className="underline hover:text-neutral-900 dark:hover:text-neutral-100 ml-1">Réservez un créneau via Calendly</button>.
                    </p>
                    <p>
                      <strong>Secteurs d'expertise :</strong> J'ai une expérience particulière dans <strong>l'immobilier</strong> et 
                      le <strong>secteur de la santé</strong>, mais je travaille avec des entreprises de tous secteurs.
                    </p>
                  </>
                )
              },
              {
                question: "Comment travaillez-vous ?",
                answer: (
                  <>
                    <p className="mb-2"><strong>1. Appel de 20 minutes</strong> pour comprendre vos besoins et votre contexte.</p>
                    <p className="mb-2"><strong>2. Proposition</strong> détaillée avec approche technique et délais.</p>
                    <p className="mb-2"><strong>3. Validation</strong> de votre côté, puis démarrage du projet.</p>
                    <p className="mb-2"><strong>4. Livraison</strong> en moins d'une semaine, avec aller-retour si nécessaire.</p>
                    <p><strong>5. Suivi</strong> — on se reparle si besoin d'ajustements ou d'évolutions.</p>
                  </>
                )
              },
              {
                question: "Quelle est votre vision à long terme ?",
                answer: (
                  <>
                    <p className="mb-3">
                      Dans 2 à 3 ans, je veux construire un <strong>patrimoine avec business physique</strong> qui me permette de vivre pleinement mes passions. 
                      Cette vision guide mes objectifs 2026 et ma façon de travailler — chaque projet freelance, chaque scraper public, chaque outil gratuit contribue à construire ce patrimoine.
                    </p>
                    <p className="mb-3">
                      <strong>Ce qui me ferait kiffer :</strong>
                    </p>
                    <ul className="space-y-2 ml-4 list-disc mb-3">
                      <li>Un <strong>studio de podcast</strong> pour partager mes réflexions et celles d'autres entrepreneurs — créer du lien et de la valeur autour de conversations authentiques</li>
                      <li>Un <strong>immobilier à Annecy</strong> — j'adore cette ville et j'aimerais y avoir un pied-à-terre pour sortir plus régulièrement de Paris, prendre l'air, me ressourcer</li>
                      <li>Toujours autant de <strong>CEOs satisfaits</strong> — la qualité de service reste ma priorité, continuer d'être à l'écoute et de créer de la valeur</li>
                      <li>Pleins d'<strong>outils gratuits délivrés</strong> — continuer à partager et donner accès à mes outils, créer de la valeur pour la communauté</li>
                      <li>Un plus large <strong>parterre de revenus d'affiliation</strong>, notamment avec Apify — développer des partenariats stratégiques qui ont du sens</li>
            </ul>
                    <p>
                      Mais au-delà des objectifs business, je veux aussi <strong>m'améliorer aux échecs</strong>, <strong>savoir prendre plus le temps</strong>, 
                      continuer d'être à l'écoute et <strong>m'épanouir en sortant plus régulièrement de Paris</strong>. 
                      C'est cette recherche d'équilibre entre ambition professionnelle et épanouissement personnel qui me guide.
                    </p>
                  </>
                )
              }
            ]}
          />
        </section>

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
            <h2 className="font-semibold text-xl mb-6 tracking-tighter">Discutons de votre projet</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
              Vous avez un projet de scraping, d'automatisation ou d'outbound marketing ? 
              Réservez un créneau pour échanger sur vos besoins et voir comment je peux vous aider.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={openCalendly}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium"
              aria-label="Réserver un créneau Calendly"
            >
              Réserver un créneau
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
              </svg>
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
          </div>
        </section>

      </main>
    </>
  )
}
