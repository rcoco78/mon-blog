import Link from 'next/link'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import { useState, useEffect } from 'react'
import FAQ from '../components/FAQ'
import { openCalendlyPopup } from '../lib/calendly'
import { QuietBone, QuietSkeletonList } from '../components/QuietSkeleton'

function isKeyResultCompleted(kr) {
  const t = Number(kr?.targetResult)
  const c = Number(kr?.currentResult)
  if (t > 0 && Number.isFinite(c) && c >= t) return true

  const raw = (kr?.status || '').trim()
  const s = raw.toLowerCase()
  if (!s) return false

  const terminal = new Set([
    'done',
    'completed',
    'complete',
    'terminé',
    'complété',
    'achieved',
    'atteint',
    'closed',
    'finished',
    'fini',
  ])
  if (terminal.has(s)) return true

  const n = s.normalize('NFD').replace(/\p{M}/gu, '')
  if (
    n === 'termine' ||
    n === 'complet' ||
    n === 'complete' ||
    n === 'acheve' ||
    n === 'realise' ||
    n === 'finalise'
  ) {
    return true
  }

  return false
}

function isKeyResultNotStarted(kr) {
  const s = (kr?.status || '').toLowerCase().trim().normalize('NFD').replace(/\p{M}/gu, '')
  return s === 'not started' || s === 'non demarre' || s === 'notstarted'
}


/** Nombre de jours calendaires entre deux chaînes de date (ISO ou locale). */
function calendarDaysBetween(dateStrA, dateStrB) {
  const a = new Date(dateStrA)
  const b = new Date(dateStrB)
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0
  const startA = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const startB = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return Math.round((startB - startA) / 86400000)
}

function toLocalYMD(dateInput) {
  const x = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (isNaN(x.getTime())) return null
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

function addLocalDaysYMD(ymd, deltaDays) {
  if (!ymd || typeof deltaDays !== 'number') return null
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return null
  const dt = new Date(y, m - 1, d + deltaDays)
  if (isNaN(dt.getTime())) return null
  return toLocalYMD(dt)
}

/** Au plus un point par jour : comble les trous avec la valeur précédente (pas d’interpolation). */
function densifyHistoryWithForwardFill(history, maxFillBetween = 400) {
  if (!Array.isArray(history) || history.length === 0) return []
  const sorted = [...history]
    .filter((h) => h && h.date != null && h.date !== '')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  if (sorted.length === 0) return []

  const out = []
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]
    out.push(cur)
    if (i === sorted.length - 1) break
    const next = sorted[i + 1]
    const gap = calendarDaysBetween(cur.date, next.date)
    if (gap <= 1) continue

    const curYmd = toLocalYMD(cur.date)
    const nextYmd = toLocalYMD(next.date)
    if (!curYmd || !nextYmd) continue

    const baseVal = Number(cur.valeur)
    const v = Number.isFinite(baseVal) ? baseVal : 0
    const maxSteps = Math.min(gap - 1, maxFillBetween)
    for (let s = 1; s <= maxSteps; s++) {
      const fillYmd = addLocalDaysYMD(curYmd, s)
      if (!fillYmd || fillYmd >= nextYmd) break
      out.push({
        id: `daily-fill-${fillYmd}-${String(cur.id || i).slice(0, 12)}`,
        date: fillYmd,
        valeur: v,
        syntheticDailyFill: true,
      })
    }
  }
  return out
}

/** Aligne l’historique sur le currentResult du Key Result. */
function mergeHistoryWithCurrentKR(history, currentResult, syncPrefix = 'kr-sync') {
  const cur = Number(currentResult)
  if (!Number.isFinite(cur) || cur < 0) {
    return Array.isArray(history) ? history : []
  }
  const rounded = Math.round(cur)
  const h = Array.isArray(history) ? [...history] : []
  const now = new Date()
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  if (h.length === 0) {
    return [{ id: `${syncPrefix}-init`, date: todayYMD, valeur: rounded, syntheticFromKeyResult: true }]
  }

  const last = h[h.length - 1]
  const lastNum = Number(last?.valeur)
  let lastYMD = null
  if (last?.date) {
    const d = new Date(last.date)
    if (!isNaN(d.getTime())) {
      lastYMD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
  }

  if (lastYMD === todayYMD) {
    if (Number.isFinite(lastNum) && lastNum !== rounded) {
      h[h.length - 1] = { ...last, valeur: rounded }
    }
    return h
  }

  if (Number.isFinite(lastNum) && lastNum === rounded) {
    return h
  }

  h.push({
    id: `${syncPrefix}-${todayYMD}`,
    date: todayYMD,
    valeur: rounded,
    syntheticFromKeyResult: true,
  })
  return h
}

/** Décompose les KR CA Freelance / Affiliation / Logement (cibles + courants + ids). */
function getCaBreakdown(keyResults, usdToEur) {
  const caFreelanceKRs = keyResults.filter((kr) => {
    const categoryLower = (kr.category || '').toLowerCase()
    const nameLower = (kr.name || '').toLowerCase()
    return (
      (categoryLower.includes('freelance') || categoryLower.includes('freelancing')) &&
      (nameLower.includes('ca') || nameLower.includes('chiffre')) &&
      !nameLower.includes('affiliation')
    )
  })
  const caFreelanceTotalKR =
    caFreelanceKRs.find((kr) => (kr.name || '').toLowerCase().includes('total')) || null
  const freelanceTarget = caFreelanceTotalKR
    ? caFreelanceTotalKR.targetResult || 0
    : caFreelanceKRs.length > 0
      ? Math.max(...caFreelanceKRs.map((kr) => kr.targetResult || 0))
      : 0
  const freelanceCurrent = caFreelanceTotalKR
    ? caFreelanceTotalKR.currentResult || 0
    : caFreelanceKRs.length > 0
      ? Math.max(...caFreelanceKRs.map((kr) => kr.currentResult || 0))
      : 0
  const freelanceKrId = caFreelanceTotalKR?.id || caFreelanceKRs[0]?.id || null

  const caAffiliationKRs = keyResults.filter((kr) => {
    const categoryLower = (kr.category || '').toLowerCase()
    const nameLower = (kr.name || '').toLowerCase()
    return (
      (categoryLower.includes('affiliation') || categoryLower.includes('partenariats')) &&
      (nameLower.includes('ca') || nameLower.includes('chiffre') || nameLower.includes('revenus'))
    )
  })
  const caAffiliationTotalKR =
    caAffiliationKRs.find((kr) => (kr.name || '').toLowerCase().includes('total')) || null
  const affiliationTarget = caAffiliationTotalKR
    ? caAffiliationTotalKR.targetResult || 0
    : caAffiliationKRs.length > 0
      ? caAffiliationKRs.reduce((sum, kr) => sum + (kr.targetResult || 0), 0)
      : 0
  // Même logique que la liste : somme des revenus individuels (Lemlist / Apify / Zapmail), en USD → EUR
  const affiliationIndividuals = keyResults.filter((kr) => {
    const nameLower = (kr.name || '').toLowerCase()
    const categoryLower = (kr.category || '').toLowerCase()
    return (
      (nameLower.includes('revenus d\'affiliation') || nameLower.includes('affiliation')) &&
      (nameLower.includes('apify') ||
        nameLower.includes('lemlist') ||
        nameLower.includes('zapier') ||
        nameLower.includes('zapmail')) &&
      (categoryLower.includes('affiliation') || categoryLower.includes('partenariats'))
    )
  })
  const affiliationCurrentUsd = affiliationIndividuals.reduce(
    (sum, kr) => sum + (kr.currentResult || 0),
    0
  )
  const affiliationCurrent =
    typeof usdToEur === 'function'
      ? usdToEur(affiliationCurrentUsd)
      : affiliationCurrentUsd * 0.92
  const affiliationKrId =
    caAffiliationTotalKR?.id || affiliationIndividuals[0]?.id || null

  const caLogementAtypiqueKRs = keyResults.filter((kr) => {
    const categoryLower = (kr.category || '').toLowerCase()
    const nameLower = (kr.name || '').toLowerCase()
    return (
      (categoryLower.includes('logement') || categoryLower.includes('entrepreneurial')) &&
      (nameLower.includes('arr') || nameLower.includes('ca') || nameLower.includes('chiffre')) &&
      nameLower.includes('logement')
    )
  })
  const caLogementAtypiqueTotalKR =
    caLogementAtypiqueKRs.find((kr) => (kr.name || '').toLowerCase().includes('arr')) || null
  const logementTarget = caLogementAtypiqueTotalKR
    ? caLogementAtypiqueTotalKR.targetResult || 0
    : caLogementAtypiqueKRs.length > 0
      ? Math.max(...caLogementAtypiqueKRs.map((kr) => kr.targetResult || 0))
      : 0
  const logementCurrent = caLogementAtypiqueTotalKR
    ? caLogementAtypiqueTotalKR.currentResult || 0
    : caLogementAtypiqueKRs.length > 0
      ? Math.max(...caLogementAtypiqueKRs.map((kr) => kr.currentResult || 0))
      : 0
  const logementKrId = caLogementAtypiqueTotalKR?.id || caLogementAtypiqueKRs[0]?.id || null

  return {
    freelance: {
      label: 'Freelance',
      current: freelanceCurrent,
      target: freelanceTarget,
      krId: freelanceKrId,
      unit: '€',
    },
    affiliation: {
      label: 'Affiliation',
      current: affiliationCurrent,
      target: affiliationTarget,
      krId: affiliationKrId,
      unit: '€',
    },
    logement: {
      label: 'Logement Atypique',
      current: logementCurrent,
      target: logementTarget,
      krId: logementKrId,
      unit: '€',
    },
  }
}

export default function DonneesPubliques() {
  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.donneesPubliques.title,
    description: siteConfig.seo.pages.donneesPubliques.description,
    path: '/objectifs',
    keywords: siteConfig.seo.pages.donneesPubliques.keywords
  })

  const [keyResults, setKeyResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [chessStats, setChessStats] = useState(null)
  const [chessLoading, setChessLoading] = useState(true)
  const [chessHistory, setChessHistory] = useState([])
  const [chessHistoryLoading, setChessHistoryLoading] = useState(true)
  const [selectedPeriod] = useState(90)
  const [keyResultsHistory, setKeyResultsHistory] = useState({})
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    const fetchKeyResults = async () => {
      try {
        const response = await fetch('/api/key-results')
        if (response.ok) {
          const data = await response.json()
          setKeyResults(data)
        } else {
          // Même en cas d'erreur HTTP, on peut avoir reçu un tableau vide
          const data = await response.json().catch(() => [])
          setKeyResults(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des Key Results:', error)
        // En cas d'erreur, utiliser un tableau vide pour que l'interface reste fonctionnelle
        setKeyResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchKeyResults()
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
          setChessHistory(Array.isArray(data) ? data : [])
        } else {
          const data = await response.json().catch(() => [])
          setChessHistory(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique Chess.com:', error)
        setChessHistory([])
      } finally {
        setChessHistoryLoading(false)
      }
    }

    fetchChessHistory()
  }, [])

  // Récupérer l'historique pour tous les Key Results en un seul appel (évite N+1)
  useEffect(() => {
    const fetchAllKeyResultsHistory = async () => {
      setHistoryLoading(true)
      const ids = keyResults
        .filter((kr) => kr.id && kr.id !== 'chess-rapid-virtual')
        .map((kr) => kr.id)

      if (ids.length === 0) {
        setKeyResultsHistory({})
        setHistoryLoading(false)
        return
      }

      console.log(`🔄 Récupération de l'historique pour ${ids.length} Key Results sur ${selectedPeriod} jours...`)
      try {
        const response = await fetch(
          `/api/key-result-history?days=${selectedPeriod}&keyResultIds=${ids.map(encodeURIComponent).join(',')}`
        )
        const data = await response.json().catch(() => ({}))
        const historyMap = data && typeof data === 'object' && !Array.isArray(data) ? data : {}

        // Garantir une entrée par id même si absente
        const normalized = {}
        let totalWithHistory = 0
        ids.forEach((id) => {
          const history = Array.isArray(historyMap[id]) ? historyMap[id] : []
          normalized[id] = history
          if (history.length > 0) totalWithHistory++
        })
        console.log(`✅ Historique récupéré: ${totalWithHistory}/${ids.length} Key Results ont un historique`)
        setKeyResultsHistory(normalized)
      } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'historique Key Results:', error)
        setKeyResultsHistory({})
      } finally {
        setHistoryLoading(false)
      }
    }

    if (keyResults.length > 0 && selectedPeriod) {
      fetchAllKeyResultsHistory()
    } else {
      setHistoryLoading(false)
    }
  }, [keyResults, selectedPeriod])

  // Fonction pour calculer l'évolution d'un Key Result
  const calculateEvolution = (kr) => {
    const nameLower = (kr.name || '').toLowerCase()
    const title = improveTitle(kr.name, kr.category)
    const categoryLower = (kr.category || '').toLowerCase()
    
    // Pour "Classement échecs chess.com", utiliser l'historique Chess.com
    const isChessKR = (nameLower.includes('rapid') || nameLower.includes('échecs') || nameLower.includes('chess')) && 
                     (title.includes('Classement échecs') || title.includes('échecs chess.com'))
    
    let history = []
    if (isChessKR && chessHistory.length > 0) {
      // Utiliser l'historique Chess.com
      history = chessHistory
    } else {
      // Utiliser l’historique des objectifs (hors Chess.com)
      history = keyResultsHistory[kr.id] || []
    }
    
    if (history.length === 0) return null

    const currentValue = kr.currentResult || 0
    const oldestValue = history[0]?.valeur || currentValue
    const difference = currentValue - oldestValue
    const percentage = oldestValue > 0 ? ((difference / oldestValue) * 100) : (difference > 0 ? 100 : 0)

    return {
      difference,
      percentage: Math.round(percentage * 10) / 10,
      isPositive: difference >= 0
    }
  }

  const openCalendly = () => openCalendlyPopup('goals')

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
    return categoryMap[category] || categoryMap['default'] || category
  }

  // Grouper les Key Results par catégorie (avec traduction)
  const groupedByCategory = keyResults.reduce((acc, kr) => {
    const nameLower = (kr.name || '').toLowerCase()
    let category = kr.category || 'Sans catégorie'

    // Cas particulier : "Coaching Lemlist" n'est pas vraiment de l'affiliation -> le mettre dans une section dédiée
    if (nameLower.includes('coaching lemlist')) {
      category = 'Coaching & accompagnement'
    }

    const translatedCategory = translateCategory(category)
    if (!acc[translatedCategory]) {
      acc[translatedCategory] = []
    }
    acc[translatedCategory].push(kr)
    return acc
  }, {})

  // Objectif Chess.com virtuel (si pas déjà présent dans Notion)
  const chessVirtualKRsCount = (() => {
    if (!chessStats || chessLoading) return 0
    if (!(chessStats.rapid && chessStats.rapid.current > 0)) return 0
    const hasChessKR = keyResults.some((kr) => {
      const nameLower = (kr.name || '').toLowerCase()
      return nameLower.includes('rapid') || nameLower.includes('échecs') || nameLower.includes('chess') || nameLower.includes('elo')
    })
    return hasChessKR ? 0 : 1
  })()

  // Stats globales métier (+ classement échecs)
  const businessKeyResults = keyResults.filter((kr) => {
    const categoryLower = (kr.category || '').toLowerCase()
    const nameLower = (kr.name || '').toLowerCase()
    const isChess =
      nameLower.includes('chess') ||
      nameLower.includes('échec') ||
      nameLower.includes('elo') ||
      nameLower.includes('rapid')
    const isLoisirCat =
      categoryLower.includes('santé') ||
      categoryLower.includes('sante') ||
      categoryLower.includes('loisir') ||
      categoryLower.includes('bien-être') ||
      categoryLower.includes('bien-etre')
    // Dans loisir / santé : ne garder que le classement échecs
    if (isLoisirCat) return isChess
    return true
  })
  const chessVirtualProgress =
    chessVirtualKRsCount > 0 && chessStats?.rapid
      ? (chessStats.rapid.current / 1000) * 100
      : 0
  const totalKeyResults = businessKeyResults.length + chessVirtualKRsCount
  const overallProgress =
    totalKeyResults > 0
      ? Math.round(
          (businessKeyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0) + chessVirtualProgress) /
            totalKeyResults
        )
      : 0


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
        'Classement échecs chess.com',
        'Articles publiés',
        'Visiteurs organiques blog',
        'Impressions Google',
        'Échanges grâce au blog'
      ],
      'Blog': [
        'Articles publiés',
        'Visiteurs organiques blog',
        'Impressions Google',
        'Échanges grâce au blog'
      ],
      'Logement Atypique': [
        'Vidéos publiées Instagram',
        'Abonnés Instagram',
        'Impressions Google',
        'ARR'
      ],
      'default': []
    }

    // Utiliser la catégorie brute pour l'ordre, pas la version traduite
    let categoryKey = category || 'default'
    if (categoryKey === 'Scrapers publics') {
      // Regrouper tous les KPIs Apify sous le même ordre
      categoryKey = 'Apify & Scraping'
    }
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
      'Chiffre d\'affaires affiliation': 'Revenus d\'affiliation total',
      'Coaching Lemlist': 'Coaching Lemlist',
      'Revenus d\'affiliation Lemlist': 'Revenus d\'affiliation Lemlist',
      'CA affiliation': 'Revenus d\'affiliation total',
      'Chiffre d\'affaires affiliation (€)': 'Revenus d\'affiliation total',
      'Revenus d\'affiliation CA': 'Revenus d\'affiliation total',
      'Revenus d\'affiliation Chiffre d\'affaires': 'Revenus d\'affiliation total',
      'CA Revenus d\'affiliation': 'Revenus d\'affiliation total',
      'Chiffre d\'affaires Revenus d\'affiliation': 'Revenus d\'affiliation total',
      'Zapmail affiliation': 'Revenus d\'affiliation Zapmail',
      'Apify affiliation': 'Revenus d\'affiliation Apify',
      
      // Logement Atypique (retirer "Logement Atypique" car déjà dans le titre de catégorie)
      'CA Logement Atypique': 'Chiffre d\'affaires',
      'CA Logement Atypique (€)': 'Chiffre d\'affaires',
      'ARR': 'ARR',
      'Abonnés': 'Abonnés',
      'Abonnés Instagram': 'Abonnés',
      'Vidéos publiées': category?.toLowerCase().includes('logement') ? 'Vidéos publiées Instagram' : 'Vidéos publiées',
      
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
      'Visiteurs organiques blog': 'Visiteurs organiques blog',
      'Visiteurs totaux blog': 'Visiteurs blog',
      'Visiteurs totaux': 'Visiteurs blog',
      'Impression Google blog': 'Impressions Google',
      'Impression Google': 'Impressions Google',
      'Rendez-vous par blog': 'Échanges grâce au blog',
      'Échanges blog': 'Échanges grâce au blog',
      
      // Général
      'CA': 'Chiffre d\'affaires',
    }
    
    // Appliquer les améliorations spécifiques (vérifier d'abord le titre original, puis la version améliorée)
    if (improvements[title]) {
      improved = improvements[title]
    } else if (improvements[improved]) {
      improved = improvements[improved]
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
        // Détection spécifique pour "Revenus d'affiliation CA" ou variations (AVANT les remplacements génériques)
        if (/Revenus\s+d['']affiliation\s+CA/i.test(improved)) {
          improved = 'Revenus d\'affiliation total'
        } else {
          // Améliorations génériques
          improved = improved.replace(/\bCA\b/gi, 'Chiffre d\'affaires')
          improved = improved.replace(/\b€\b/g, '')
          improved = improved.replace(/\$\b/g, '')
          
          // Nettoyer "Revenus d'affiliation" suivi de "Chiffre d'affaires" (après remplacement de CA)
          improved = improved.replace(/Revenus\s+d['']affiliation\s+Chiffre\s+d['']affaires/gi, 'Revenus d\'affiliation total')
          
          // Détection finale pour "Revenus d'affiliation CA" (au cas où CA n'a pas été remplacé)
          improved = improved.replace(/Revenus\s+d['']affiliation\s+CA/gi, 'Revenus d\'affiliation total')
        }
        
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
    
    // Détection finale pour "Revenus d'affiliation" suivi de "CA" ou "Chiffre d'affaires" (après tous les traitements)
    if (/Revenus\s+d['']affiliation\s+(CA|Chiffre\s+d['']affaires)/i.test(improved)) {
      improved = 'Revenus d\'affiliation total'
    }
    
    return improved
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
      <main className="flex-auto min-w-0 mt-6 flex flex-col overflow-x-hidden">
        <section className="mb-8">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">Objectifs 2026</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-2 tracking-tight">
            Journal public de ma progression métier : scraping, automatisation, data et CA cumulé.
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 tracking-tight">
            Inclut aussi Logement Atypique (mise en avant de logements d’exception, photo & vidéo, avec mon frère), en annexe du cœur de métier freelance.
          </p>
        </section>

                {/* CA cumulé */}
        {loading ? (
          <section className="mb-12 pb-8 border-b border-dashed border-neutral-300 dark:border-neutral-700" aria-busy="true">
            <QuietBone className="h-3 w-28 mb-3" />
            <QuietBone className="h-9 w-36 mb-4" />
            <QuietBone className="h-3.5 w-48 mb-2" />
            <QuietBone className="h-3.5 w-40 mb-2" />
            <QuietBone className="h-3.5 w-52" />
          </section>
        ) : (
          <section className="mb-12 pb-8 border-b border-neutral-200 dark:border-neutral-800" aria-label="CA cumulé objectif 2026">
            {(() => {
              const ca = getCaBreakdown(keyResults, usdToEur)
              const totalCA =
                (ca.freelance.target || 0) +
                (ca.affiliation.target || 0) +
                (ca.logement.target || 0)

              return (
                <>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-1">CA cumulé 2026</p>
                  <p className="text-4xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 tracking-tighter tabular-nums">
                    {totalCA > 0 ? `${formatNumber(Math.round(totalCA))} €` : '—'}
                  </p>
                  <div className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    <p>
                      Freelance{' '}
                      <span className="text-neutral-900 dark:text-neutral-100 tabular-nums">
                        {ca.freelance.target > 0 ? `${formatNumber(Math.round(ca.freelance.target))} €` : '—'}
                      </span>
                    </p>
                    <p>
                      Affiliation{' '}
                      <span className="text-neutral-900 dark:text-neutral-100 tabular-nums">
                        {ca.affiliation.target > 0 ? `${formatNumber(Math.round(ca.affiliation.target))} €` : '—'}
                      </span>
                    </p>
                    <p>
                      Logement Atypique{' '}
                      <span className="text-neutral-900 dark:text-neutral-100 tabular-nums">
                        {ca.logement.target > 0 ? `${formatNumber(Math.round(ca.logement.target))} €` : '—'}
                      </span>
                    </p>
                  </div>
                  {overallProgress > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">Progression</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-500 tabular-nums">{overallProgress}%</span>
                      </div>
                      <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-500"
                          style={{ width: `${Math.min(100, overallProgress)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">
                    Note Malt &amp; Fiverr 5/5 · délai moyen &lt; 7 jours · 20–30 projets / mois
                  </p>
                </>
              )
            })()}
          </section>
        )}

        {/* Croissance — séries historiques KR si dispo, sinon actuel → cible par poste */}
        {!loading && (
          <section className="mb-12 pb-8 border-b border-neutral-200 dark:border-neutral-800" aria-label="Croissance">
            {(() => {
              const ca = getCaBreakdown(keyResults, usdToEur)
              const postes = [ca.freelance, ca.affiliation, ca.logement]

              const seriesForPoste = (poste) => {
                if (!poste.krId) return []
                let raw = keyResultsHistory[poste.krId] || []
                if (poste.label === 'Affiliation' && raw.length > 0) {
                  raw = raw.map((h) => ({
                    ...h,
                    valeur: usdToEur(Number(h.valeur) || 0),
                  }))
                }
                const measured = raw.filter(
                  (h) => h && !h.syntheticDailyFill && !h.syntheticFromKeyResult
                )
                if (measured.length < 2) return []
                const merged = mergeHistoryWithCurrentKR(raw, poste.current, `kr-${poste.krId}`)
                return densifyHistoryWithForwardFill(merged)
              }

              const temporalPostes = postes
                .map((poste) => ({ poste, history: seriesForPoste(poste) }))
                .filter(({ history }) => history.length >= 2)

              const useTemporal = temporalPostes.length > 0 && !historyLoading
              const hasHorizontalData = postes.some(
                (poste) => (Number(poste.target) || 0) > 0 || (Number(poste.current) || 0) > 0
              )

              if (!useTemporal && !hasHorizontalData) {
                return null
              }

              const renderTemporalBars = (history, height = 72) => {
                const slice = history.slice(-Math.min(history.length, 36))
                const values = slice.map((h) => {
                  const n = Number(h.valeur)
                  return Number.isFinite(n) ? n : 0
                })
                if (values.length === 0) return null
                const minValue = Math.min(...values)
                const maxValue = Math.max(...values)
                const range = maxValue - minValue
                let scaleMin
                let scaleMax
                if (range === 0) {
                  scaleMin = Math.max(0, minValue - 1)
                  scaleMax = minValue + 1
                } else {
                  scaleMax = maxValue + range * 0.05
                  scaleMin = Math.max(0, minValue - range * 0.02)
                }
                const scaleRange = Math.max(scaleMax - scaleMin, 1e-9)
                const firstDate = slice[0]?.date
                const lastDate = slice[slice.length - 1]?.date
                const fmt = (d) => {
                  try {
                    const x = new Date(d)
                    if (!isNaN(x.getTime())) {
                      return x.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                    }
                  } catch (e) {
                    /* ignore */
                  }
                  return ''
                }

                return (
                  <div>
                    <div
                      className="flex items-stretch justify-between gap-px"
                      style={{ height: `${height}px` }}
                    >
                      {slice.map((item, index) => {
                        const v = Number(item.valeur)
                        const safeV = Number.isFinite(v) ? v : 0
                        const t = (safeV - scaleMin) / scaleRange
                        const barPx = Math.max(2, Math.round(t * height))
                        const dailyFill = Boolean(item.syntheticDailyFill)
                        return (
                          <div
                            key={item.id || index}
                            className="flex-1 min-w-0 flex flex-col justify-end"
                            title={`${formatNumber(safeV)} · ${fmt(item.date)}`}
                          >
                            <div
                              className={`w-full max-w-[10px] mx-auto bg-neutral-900 dark:bg-neutral-100 transition-all ${
                                dailyFill ? 'opacity-35' : 'opacity-80'
                              }`}
                              style={{ height: `${barPx}px` }}
                            />
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-[11px] text-neutral-500 dark:text-neutral-500 tabular-nums">
                      <span>{fmt(firstDate)}</span>
                      <span>{fmt(lastDate)}</span>
                    </div>
                  </div>
                )
              }

              return (
                <>
                  <h2 className="font-semibold text-xl mb-2 tracking-tighter">Croissance</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-6 tracking-tight">
                    {useTemporal
                      ? 'Évolution réelle des postes CA, d’après l’historique des Key Results.'
                      : 'Avancement actuel de chaque poste CA vers sa cible 2026.'}
                  </p>

                  {useTemporal ? (
                    <div className="space-y-8">
                      {temporalPostes.map(({ poste, history }) => {
                        const first = Number(history[0]?.valeur) || 0
                        const last = Number(history[history.length - 1]?.valeur) || 0
                        const delta = last - first
                        return (
                          <div key={poste.label}>
                            <div className="flex items-baseline justify-between gap-3 mb-3">
                              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {poste.label}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-500 tabular-nums">
                                {formatNumber(Math.round(last))}
                                {poste.unit}
                                {delta !== 0 && (
                                  <span className="ml-2">
                                    {delta > 0 ? '+' : ''}
                                    {formatNumber(Math.round(delta))}
                                  </span>
                                )}
                              </p>
                            </div>
                            {renderTemporalBars(history)}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {postes.map((poste) => {
                        const target = Number(poste.target) || 0
                        const current = Number(poste.current) || 0
                        const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
                        if (target <= 0 && current <= 0) return null
                        return (
                          <div key={poste.label}>
                            <div className="flex items-baseline justify-between gap-3 mb-1.5">
                              <p className="text-sm text-neutral-900 dark:text-neutral-100">{poste.label}</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-500 tabular-nums">
                                {formatNumber(Math.round(current))}
                                {poste.unit}
                                {' / '}
                                {formatNumber(Math.round(target))}
                                {poste.unit}
                                <span className="ml-2">{pct}%</span>
                              </p>
                            </div>
                            <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                              <div
                                className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )
            })()}
          </section>
        )}

<section className="mb-16" aria-label="Objectifs par catégorie">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Liste des objectifs</h2>

          {loading ? (
            <QuietSkeletonList count={6} variant="kr" label="Chargement des objectifs" />
          ) : Object.keys(groupedByCategory).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                {loading ? 'Chargement...' : 'Aucun objectif disponible pour le moment.'}
              </p>
              {!loading && (
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  Les données peuvent être temporairement indisponibles (limitation ou indisponibilité de la source).
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries((() => {
                const entries = { ...groupedByCategory }
                const isChessName = (name = '') => {
                  const n = name.toLowerCase()
                  return n.includes('chess') || n.includes('échec') || n.includes('elo') || n.includes('rapid')
                }
                const isLoisirCat = (cat = '') => {
                  const c = cat.toLowerCase()
                  return (
                    c.includes('santé') ||
                    c.includes('sante') ||
                    c.includes('loisir') ||
                    c.includes('bien-être') ||
                    c.includes('bien-etre')
                  )
                }
                const hasChessKR = Object.values(entries).some((results) =>
                  results.some((kr) => isChessName(kr.name))
                )
                // Garantir une section pour le classement Chess si les données live existent
                if (!hasChessKR && chessStats?.rapid?.current > 0 && !chessLoading) {
                  const loisirKey =
                    Object.keys(entries).find((cat) => isLoisirCat(cat)) || 'Loisir'
                  if (!entries[loisirKey]) entries[loisirKey] = []
                }
                return entries
              })())
                .filter(([category, results]) => {
                  const categoryLower = category.toLowerCase()
                  // Exclure mission malt/fiverr
                  if (categoryLower.includes('mission malt') || categoryLower.includes('mission fiverr')) return false
                  // Loisir / santé : n’afficher que s’il y a (ou aura) le classement échecs
                  if (
                    categoryLower.includes('santé') ||
                    categoryLower.includes('sante') ||
                    categoryLower.includes('loisir') ||
                    categoryLower.includes('bien-être') ||
                    categoryLower.includes('bien-etre')
                  ) {
                    const hasChess = results.some((kr) => {
                      const n = (kr.name || '').toLowerCase()
                      return n.includes('chess') || n.includes('échec') || n.includes('elo') || n.includes('rapid')
                    })
                    return hasChess || (chessStats?.rapid?.current > 0 && !chessLoading)
                  }
                  return true
                })
                .sort(([a], [b]) => {
                  const score = (cat) => {
                    const c = cat.toLowerCase()
                    if (c.includes('freelance') || c.includes('freelancing')) return 0
                    if (c.includes('outbound') || c.includes('prospection')) return 1
                    if (c.includes('scraping') || c.includes('data')) return 2
                    if (c.includes('apify')) return 3
                    if (c.includes('affiliation') || c.includes('partenariat')) return 4
                    if (c.includes('logement') || c.includes('entrepreneurial')) return 5
                    if (c.includes('santé') || c.includes('sante') || c.includes('loisir') || c.includes('bien-être') || c.includes('bien-etre')) return 9
                    return 6
                  }
                  return score(a) - score(b)
                })
                .map(([category, results]) => {
                const translatedCategory = translateCategory(category)
                const categoryLower = category.toLowerCase()
                const isApifyCategory = categoryLower.includes('apify') || translatedCategory === 'Scrapers publics'
                const isLogementAtypiqueCategory = categoryLower.includes('logement')
                const isFreelanceCategory = categoryLower.includes('freelance') || categoryLower.includes('freelancing')
                const isLoisirCategory =
                  categoryLower.includes('santé') ||
                  categoryLower.includes('sante') ||
                  categoryLower.includes('loisir') ||
                  categoryLower.includes('bien-être') ||
                  categoryLower.includes('bien-etre')

                // Ajouter le classement Chess.com live si absent de Notion
                let resultsToDisplay = isLoisirCategory
                  ? results.filter((kr) => {
                      const nameLower = (kr.name || '').toLowerCase()
                      return (
                        nameLower.includes('chess') ||
                        nameLower.includes('échec') ||
                        nameLower.includes('elo') ||
                        nameLower.includes('rapid')
                      )
                    })
                  : [...results]

                if (isLoisirCategory && chessStats && !chessLoading) {
                  const rapidTarget = 1000
                  const hasRapidKR = resultsToDisplay.some((kr) => {
                    const nameLower = (kr.name || '').toLowerCase()
                    return (
                      nameLower.includes('rapid') ||
                      nameLower.includes('échecs') ||
                      nameLower.includes('chess') ||
                      nameLower.includes('elo')
                    )
                  })
                  if (!hasRapidKR && chessStats.rapid?.current > 0) {
                    resultsToDisplay.push({
                      id: 'chess-rapid-virtual',
                      name: 'Classement échecs (Rapid)',
                      category,
                      status: 'In progress',
                      currentResult: chessStats.rapid.current,
                      targetResult: rapidTarget,
                      progress:
                        rapidTarget > 0
                          ? (chessStats.rapid.current / rapidTarget) * 100
                          : 0,
                    })
                  }
                }

                // Trier les résultats dans un ordre logique
                const sortedResults = sortKeyResults(resultsToDisplay, category)
                
                return (
                <div key={category} className="mb-10">
                  <h3 className="font-semibold text-lg mb-3 tracking-tighter flex items-center gap-2 group">
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
                    ) : isLoisirCategory ? (
                      <Link
                        href="https://link.chess.com/friend/GYjATb"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
                      >
                        {translatedCategory === category ? 'Loisir' : translatedCategory}
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
                                 !(nameLower.includes('appels malt') || nameLower.includes('appels fiverr'))
                        }).length
                        return `(${filteredCount} ${filteredCount > 1 ? 'objectifs' : 'objectif'})`
                      })()}
                    </span>
                  </h3>
                  
                  {translatedCategory === 'Relation client' && (
                    <div className="py-4 border-t border-b border-neutral-200 dark:border-neutral-800 mb-1">
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100 tracking-tight">
                            Achat flux de données clients
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
                            Accès en temps réel aux nouveaux rendez-vous · 10 000 € HT / an
                          </p>
                        </div>
                        <button
                          onClick={openCalendly}
                          className="text-sm underline hover:text-neutral-900 dark:hover:text-neutral-100 text-neutral-600 dark:text-neutral-400 flex-shrink-0 self-start"
                          aria-label="Réserver un créneau Calendly"
                        >
                          Réserver un créneau
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-neutral-200 dark:border-neutral-800">
                    {sortedResults
                      .filter((kr) => {
                        const title = improveTitle(kr.name, kr.category)
                        const nameLower = (kr.name || '').toLowerCase()
                        const categoryLower = (kr.category || '').toLowerCase()
                        // Exclure "Rendez-vous ponctuels", "% Calendly (génération de leads)", et les appels Malt/Fiverr (ils seront affichés comme sous-éléments)
                        return !title.includes('Rendez-vous ponctuels') &&
                               !title.includes('ponctuels') &&
                               !nameLower.includes('ad-hoc') &&
                               !nameLower.includes('ad hoc') &&
                               !(nameLower.includes('calendly') && (nameLower.includes('%') || nameLower.includes('pourcentage') || nameLower.includes('génération'))) &&
                               !(nameLower.includes('appels malt') || nameLower.includes('appels fiverr'))
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
                        className="py-4 border-b border-neutral-200 dark:border-neutral-800 group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start sm:items-baseline gap-2 flex-wrap">
                              <h3 className="font-medium text-base tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-1 min-w-0 sm:flex-initial">
                                {(() => {
                                  const title = improveTitle(kr.name, kr.category)
                                  const nameLower = (kr.name || '').toLowerCase()
                                  const categoryLower = (kr.category || '').toLowerCase()
                                  const isAffiliationKR = isAffiliationRevenue(kr)
                                  const affiliationLink = isAffiliationKR ? getAffiliationLink(kr.name) : null
                                  
                                  // Détecter les liens externes spécifiques
                                  const isChessKR =
                                    nameLower.includes('échecs') ||
                                    nameLower.includes('chess') ||
                                    nameLower.includes('elo') ||
                                    (nameLower.includes('rapid') &&
                                      (title.includes('Classement') || title.includes('échecs') || title.includes('chess')))
                                  const isInstagramKR = (nameLower.includes('abonnés') || nameLower.includes('abonne')) && 
                                                       (categoryLower.includes('logement') || categoryLower.includes('entrepreneurial'))
                                  const isStravaKR = (nameLower.includes('running') || nameLower.includes('sorties running') || 
                                                      nameLower.includes('hyrox') || nameLower.includes('séances hyrox')) &&
                                                     (title.includes('Sorties Running') || title.includes('Séances Hyrox'))
                                  
                                  const externalLink = isChessKR 
                                    ? 'https://link.chess.com/friend/GYjATb'
                                    : isInstagramKR
                                    ? 'https://www.instagram.com/logement.atypique'
                                    : isStravaKR
                                    ? 'https://www.strava.com/athletes/47201230'
                                    : null
                                  
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
                                  
                                  if (externalLink) {
                                    // Utiliser l'icône appropriée selon le type de lien
                                    const isInstagram = isInstagramKR
                                    const isStrava = isStravaKR
                                    
                                    return (
                                      <Link 
                                        href={externalLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors group/link"
                                      >
                                        <span className="break-words">{title}</span>
                                        {isInstagram ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
                                            <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
                                          </svg>
                                        ) : isStrava ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
                                            <g fillRule="evenodd">
                                              <path d="M6.9 8.8l2.5 4.5 2.4-4.5h-1.5l-.9 1.7-1-1.7z" opacity=".6"/>
                                              <path d="M7.2 2.5l3.1 6.3H4zm0 3.8l1.2 2.5H5.9z"/>
                                            </g>
                                          </svg>
                                        ) : (
                                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 flex-shrink-0">
                                            <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                                          </svg>
                                        )}
                                      </Link>
                                    )
                                  }
                                  
                                  return <span className="break-words">{title}</span>
                                })()}
                              </h3>
                            </div>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
                              <span className="tabular-nums text-neutral-900 dark:text-neutral-100">
                                {(() => {
                                    // Pour les objectifs d'échecs, utiliser les données Chess.com
                                    const nameLower = (kr.name || '').toLowerCase()
                                    const categoryLower = (kr.category || '').toLowerCase()
                                    const isChessKR =
                                      nameLower.includes('rapid') ||
                                      nameLower.includes('blitz') ||
                                      nameLower.includes('tactics') ||
                                      nameLower.includes('tactiques') ||
                                      nameLower.includes('échecs') ||
                                      nameLower.includes('chess') ||
                                      nameLower.includes('elo')

                                    if (isChessKR && chessStats) {
                                      if (nameLower.includes('blitz')) {
                                        return formatNumber(chessStats.blitz.current || 0)
                                      }
                                      if (nameLower.includes('tactics') || nameLower.includes('tactiques')) {
                                        return formatNumber(chessStats.tactics.highest || 0)
                                      }
                                      return formatNumber(chessStats.rapid?.current || 0)
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
                              <span> / </span>
                              <span className="tabular-nums">
                                {(() => {
                                  // Convertir les targetResult des revenus d'affiliation de USD en EUR
                                  if (isAffiliationRevenue(kr)) {
                                    return formatNumber(Math.round(usdToEur(kr.targetResult || 0)))
                                  }
                                  return formatNumber(kr.targetResult)
                                })()}
                              </span>
                              <span> · </span>
                              <span>
                                {isKeyResultCompleted(kr)
                                  ? 'Terminé'
                                  : isKeyResultNotStarted(kr)
                                    ? 'Non démarré'
                                    : kr.progress > 100
                                      ? 'Dépassé'
                                      : 'En cours'}
                              </span>
                              {(() => {
                                  const evolution = !historyLoading ? calculateEvolution(kr) : null
                                  if (evolution) {
                                    return (
                                      <span className={`ml-1 tabular-nums ${
                                        evolution.isPositive
                                          ? 'text-green-700 dark:text-green-400'
                                          : 'text-red-700 dark:text-red-400'
                                      }`}>
                                        {evolution.isPositive ? '+' : ''}{evolution.percentage}%
                                      </span>
                                    )
                                  }
                                  return null
                                })()}
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
                                    // Le targetResult du total est déjà en EUR dans les données, pas besoin de conversion
                                  }
                                  
                                  const actualRemaining = actualTargetResult - actualCurrentResult
                                  const actualProgress = actualTargetResult > 0 ? (actualCurrentResult / actualTargetResult) * 100 : 0
                                  
                                  if (actualProgress <= 100 && actualRemaining >= 0) {
                                    return (
                                      <span className="tabular-nums">
                                        {' · '}reste {formatNumber(actualRemaining)}
                                      </span>
                                    )
                                  }
                                  if (actualProgress > 100) {
                                    return (
                                      <span className="tabular-nums text-orange-700 dark:text-orange-400">
                                        {' · '}+{Math.abs(actualRemaining).toFixed(1)}
                                      </span>
                                    )
                                  }
                                  return null
                                })()}
                            </p>
                            </div>
                            <div className="flex-shrink-0 text-sm tabular-nums text-neutral-500 dark:text-neutral-500 sm:text-right">
                            {(() => {
                              // Calculer le progress avec la valeur réelle pour "Revenus d'affiliation" et échecs
                              const nameLower = (kr.name || '').toLowerCase()
                              const categoryLower = (kr.category || '').toLowerCase()
                              
                              // Pour les objectifs d'échecs, utiliser les données Chess.com
                              const isChessKR =
                                nameLower.includes('rapid') ||
                                nameLower.includes('blitz') ||
                                nameLower.includes('tactics') ||
                                nameLower.includes('tactiques') ||
                                nameLower.includes('échecs') ||
                                nameLower.includes('chess') ||
                                nameLower.includes('elo')

                              let actualCurrentResult = kr.currentResult || 0
                              let actualTargetResult = kr.targetResult || 0

                              if (isChessKR && chessStats) {
                                if (nameLower.includes('blitz')) {
                                  actualCurrentResult = chessStats.blitz.current || 0
                                } else if (nameLower.includes('tactics') || nameLower.includes('tactiques')) {
                                  actualCurrentResult = chessStats.tactics.highest || 0
                                } else {
                                  actualCurrentResult = chessStats.rapid?.current || 0
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
                                <span className={actualProgress > 100 ? 'text-orange-700 dark:text-orange-400' : 'text-neutral-900 dark:text-neutral-100'}>
                                  {actualProgress > 100 ? 'Dépassé' : `${actualProgress.toFixed(0)}%`}
                                </span>
                              )
                            })()}
                          </div>
                        </div>
                        
                        {/* Sous-éléments pour "Rendez-vous obtenu via Calendly" */}
                        {isCalendlyMain && subItems.length > 0 && (
                          <div className="mt-3 ml-0 sm:ml-3 space-y-2 border-l border-neutral-200 dark:border-neutral-800 pl-3">
                            {subItems.map((subKr) => (
                              <div key={subKr.id} className="py-1">
                                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                  {improveTitle(subKr.name, subKr.category)}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-500 tabular-nums">
                                  {formatNumber(subKr.currentResult || 0)} / {formatNumber(subKr.targetResult || 0)}
                                  {' · '}
                                  {(subKr.progress || 0) > 100 ? 'Dépassé' : `${(subKr.progress || 0).toFixed(0)}%`}
                                </p>
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
                question: "Quel est votre délai de livraison réel ?",
                answer: (
                  <>
                    <p className="mb-3">
                      Livraison en moins d'une semaine pour 90% des projets. Concrètement : un scraping simple (1 site, données structurées) : <strong>2-3 jours</strong>, un scraping complexe (multi-sites, anti-bot) : <strong>5-7 jours</strong>, une automatisation complète : <strong>5-7 jours</strong>.
                    </p>
                    <p>
                      Si votre projet est urgent (livraison en 48h), c'est possible selon ma disponibilité. On en discute lors de l'appel initial. Je privilégie la rapidité sans compromettre la qualité : vous avez vos données rapidement pour pouvoir les exploiter sans attendre.
                    </p>
                  </>
                )
              },
              {
                question: "Comment garantissez-vous la pérennité de vos solutions ?",
                answer: (
                  <>
                    <p className="mb-3">
                      Je construis des solutions robustes qui fonctionnent dans le temps : 1) Code maintenable et documenté, 2) Gestion des erreurs et cas limites, 3) Solutions hébergées sur Apify (pour les scrapers publics) qui gèrent l'infrastructure, 4) Documentation complète pour que vous puissiez comprendre et maintenir si besoin.
                    </p>
                    <p>
                      Pour les projets sur-mesure, je propose des options de maintenance (corrections si le site source change, évolutions, support). La plupart des solutions tournent des années sans intervention. Exemple : mes scrapers Apify fonctionnent depuis 2+ ans avec 150+ utilisateurs actifs.
                    </p>
                  </>
                )
              },
              {
                question: "Quelle est votre capacité et disponibilité pour prendre de nouveaux projets ?",
                answer: (
                  <>
                    <p className="mb-3">
                      Je traite <strong>20-30 projets par mois</strong> avec un suivi rigoureux de chaque mission. Disponibilité : jusqu'à <strong>4 appels de 20 minutes par jour</strong> pour discuter de nouveaux projets (<button onClick={openCalendly} className="underline hover:text-neutral-900 dark:hover:text-neutral-100">réservez via Calendly</button>).
                    </p>
                    <p>
                      Secteurs d'expertise : j'ai une expérience particulière dans <strong>l'immobilier</strong> et la <strong>santé</strong>, mais je travaille avec des entreprises de tous secteurs (e-commerce, SaaS, services, etc.). Si votre projet est urgent, on peut s'organiser. Si je suis à capacité, je vous indique un délai réaliste dès le départ. Transparence totale sur les disponibilités.
                    </p>
                  </>
                )
              },
              {
                question: "Comment se déroule un projet de A à Z ?",
                answer: (
                  <>
                    <p className="mb-2"><strong>1. Appel de 20 minutes (gratuit)</strong> : on discute de votre besoin, votre contexte, vos contraintes. Je pose des questions pour bien comprendre.</p>
                    <p className="mb-2"><strong>2. Proposition détaillée</strong> : sous 24-48h, je vous envoie une proposition avec approche technique, délais, prix, format de livraison.</p>
                    <p className="mb-2"><strong>3. Validation</strong> : vous validez la proposition, on signe (ou pas, selon votre préférence), je démarre.</p>
                    <p className="mb-2"><strong>4. Développement</strong> : je code, je teste, je vous tiens informé de l'avancement.</p>
                    <p><strong>5. Livraison</strong> : vous recevez les données/outil + documentation. On fait un point pour s'assurer que tout correspond à vos attentes. Ajustements si nécessaire (inclus).</p>
                  </>
                )
              },
              {
                question: "Quel est l'impact concret pour mes clients ?",
                answer: (
                  <>
                    <p className="mb-3">
                      <strong>Réactivité :</strong> vous avez vos données en moins d'une semaine vs 1-2 mois avec une agence. Vous pouvez prendre des décisions rapidement, réagir aux opportunités, lancer vos campagnes sans attendre.
                    </p>
                    <p>
                      <strong>Systèmes pérennes :</strong> je construis des solutions qui tournent dans le temps. Exemple : un scraper qui collecte les prix concurrents quotidiennement. Une fois livré, il continue de tourner automatiquement. Vous gagnez du temps chaque jour, pas juste une fois. Les solutions Apify que je développe sont utilisées par 150+ personnes, preuve de leur robustesse.
                    </p>
                  </>
                )
              },
              {
                question: "Proposez-vous un support après la livraison ?",
                answer: (
                  <>
                    <p className="mb-3">
                      Oui, le support post-livraison est inclus : 1) <strong>Ajustements mineurs</strong> (corrections, petits changements) : inclus pendant 1 mois après livraison, 2) <strong>Support technique</strong> : si vous avez des questions sur l'utilisation, je réponds sous 24h, 3) <strong>Maintenance optionnelle</strong> : si le site source change et casse le scraper, je peux le corriger (tarif selon la complexité).
                    </p>
                    <p>
                      Pour les projets complexes, je propose des packages de maintenance mensuels. L'objectif : que vous soyez autonome, mais je reste disponible si besoin.
                    </p>
                  </>
                )
              },
              {
                question: "Comment garantissez-vous la confidentialité de mes données ?",
                answer: (
                  <>
                    <p className="mb-2"><strong>Confidentialité totale :</strong> 1) Pas de partage : vos données ne sont jamais partagées, vendues ou utilisées à d'autres fins, 2) Sécurité : accès sécurisé aux données, pas de stockage inutile, suppression après livraison si vous le souhaitez, 3) RGPD : respect strict du RGPD pour les données personnelles, 4) Transparence : je vous explique exactement ce que je fais avec vos données.</p>
                    <p>
                      Pour les projets sensibles, on peut signer un NDA. Votre business reste votre business, je suis juste l'outil technique.
                    </p>
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
        <section className="mb-16" aria-label="Pour aller plus loin">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Pour aller plus loin</h2>
          <div className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <p>
              <Link href="/blog" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Articles métier
              </Link>
              {' • '}
              <Link href="/temoignages" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Témoignages clients
              </Link>
              {' • '}
              <Link href="/marketplace" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Marketplace
              </Link>
              {' • '}
              <Link href="/a-propos" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                À propos
              </Link>
            </p>
          </div>
        </section>

        {/* CTA secondaire */}
        <section className="mb-16 pt-8 border-t border-neutral-200 dark:border-neutral-800" aria-label="Contact">
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
              Un projet de scraping ou d&apos;automatisation ?{' '}
              <button
                onClick={openCalendly}
                className="underline hover:text-neutral-900 dark:hover:text-neutral-100 text-neutral-800 dark:text-neutral-200"
                aria-label="Réserver un créneau Calendly"
              >
                Réserver un appel
              </button>
              {' · '}
              <Link
                href={siteConfig.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                LinkedIn
              </Link>
            </p>
          </div>
        </section>

      </main>
    </>
  )
}
