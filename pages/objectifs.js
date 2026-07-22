import Link from 'next/link'
import Image from 'next/image'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import { useState, useEffect, useMemo } from 'react'
import FAQ from '../components/FAQ'

function findAbonnesKeyResult(keyResults) {
  return keyResults.find((kr) => {
    const nameLower = (kr.name || '').toLowerCase()
    const categoryLower = (kr.category || '').toLowerCase()
    return (
      (nameLower.includes('abonnés') || nameLower.includes('abonne')) &&
      (categoryLower.includes('logement') || categoryLower.includes('entrepreneurial'))
    )
  })
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

/** Au plus un point par jour calendaire : comble les trous entre deux mesures avec la valeur du point précédent (pas d’interpolation). */
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
        syntheticDailyFill: true
      })
    }
  }
  return out
}

/**
 * Valeur de référence pour l’année : idéalement le 1er janvier à 0h (local),
 * sinon première mesure de l’année, sinon dernière avant le 1er janv.
 */
function getYearStartValueFromHistory(history, year) {
  const empty = { valeur: null, date: null, label: null }
  if (!Array.isArray(history) || history.length === 0) return empty

  const sorted = [...history]
    .filter((h) => h && h.date != null && h.date !== '')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (sorted.length === 0) return empty

  const sameCalendarDay = (dateStr, y, monthIndex, day) => {
    const x = new Date(dateStr)
    if (isNaN(x.getTime())) return false
    return x.getFullYear() === y && x.getMonth() === monthIndex && x.getDate() === day
  }

  const jan1Start = new Date(year, 0, 1).getTime()

  const exact = sorted.find((h) => sameCalendarDay(h.date, year, 0, 1))
  if (exact) {
    const v = Number(exact.valeur)
    return { valeur: Number.isFinite(v) ? v : null, date: exact.date, label: 'exact' }
  }

  const firstInYear = sorted.find((h) => {
    const t = new Date(h.date).getTime()
    return !isNaN(t) && t >= jan1Start
  })
  if (firstInYear) {
    const v = Number(firstInYear.valeur)
    return { valeur: Number.isFinite(v) ? v : null, date: firstInYear.date, label: 'first_in_year' }
  }

  const lastBefore = [...sorted].reverse().find((h) => {
    const t = new Date(h.date).getTime()
    return !isNaN(t) && t < jan1Start
  })
  if (lastBefore) {
    const v = Number(lastBefore.valeur)
    return { valeur: Number.isFinite(v) ? v : null, date: lastBefore.date, label: 'last_before_year' }
  }

  return empty
}

/** L’historique remonté n’est pas toujours à jour ; on aligne sur le Current result du KR affiché sur les cartes. */
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
    syntheticFromKeyResult: true
  })
  return h
}

function findApifyUsersTotalKeyResult(keyResults) {
  let kr = keyResults.find((k) => {
    const nameLower = (k.name || '').toLowerCase()
    const categoryLower = (k.category || '').toLowerCase()
    return (
      (nameLower.includes('utilisateurs total') || nameLower.includes('total users') || nameLower.includes('total utilisateurs')) &&
      (nameLower.includes('apify') || categoryLower.includes('apify') || categoryLower.includes('scraping')) &&
      !nameLower.includes('mensuel') &&
      !nameLower.includes('monthly')
    )
  })
  if (!kr) {
    const matchingKRs = keyResults.filter((k) => {
      const nameLower = (k.name || '').toLowerCase()
      const categoryLower = (k.category || '').toLowerCase()
      return (
        (nameLower.includes('utilisateur') || nameLower.includes('user')) &&
        (nameLower.includes('apify') || categoryLower.includes('apify') || categoryLower.includes('scraping')) &&
        !nameLower.includes('mensuel') &&
        !nameLower.includes('monthly')
      )
    })
    if (matchingKRs.length > 0) {
      // Préférer le KR avec le plus grand currentResult (pas la cible)
      kr = matchingKRs.reduce((max, k) =>
        (k.currentResult || 0) > (max.currentResult || 0) ? k : max
      )
    }
  }
  return kr
}

/**
 * Objectif considéré comme terminé : statut dans la base (souvent « Complete », pas « completed »)
 * ou cible numérique atteinte / dépassée.
 */
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
  const [selectedCategory, setSelectedCategory] = useState(null) // Filtre par catégorie
  const [selectedPeriod, setSelectedPeriod] = useState(7) // Période d'évolution : 3, 7 ou 30 jours
  const [keyResultsHistory, setKeyResultsHistory] = useState({}) // Historique par Key Result ID
  const [historyLoading, setHistoryLoading] = useState(true) // État de chargement de l'historique
  const [chartMaxPoints, setChartMaxPoints] = useState(30) // Nombre de points affichés selon la largeur (14 / 21 / 30)

  const abonnesHistorySynced = useMemo(() => {
    const kr = findAbonnesKeyResult(keyResults)
    return mergeHistoryWithCurrentKR(abonnesHistory, kr?.currentResult, 'kr-abonnes')
  }, [abonnesHistory, keyResults])

  const apifyUsersHistorySynced = useMemo(() => {
    const kr = findApifyUsersTotalKeyResult(keyResults)
    return mergeHistoryWithCurrentKR(apifyUsersHistory, kr?.currentResult, 'kr-apify-users')
  }, [apifyUsersHistory, keyResults])

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

  // Adapter le nombre de points du graphique à la largeur d'écran (éviter le scroll horizontal)
  useEffect(() => {
    const updateChartMaxPoints = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024
      setChartMaxPoints(w < 640 ? 14 : w < 1024 ? 21 : 30)
    }
    updateChartMaxPoints()
    window.addEventListener('resize', updateChartMaxPoints)
    return () => window.removeEventListener('resize', updateChartMaxPoints)
  }, [])

  useEffect(() => {
    const fetchMeetingsHistory = async () => {
      try {
        setMeetingsLoading(true)
        const response = await fetch('/api/meetings-history')
        if (response.ok) {
          const data = await response.json()
          setMeetingsHistory(Array.isArray(data) ? data : [])
        } else {
          // Même en cas d'erreur HTTP, on peut avoir reçu un tableau vide
          const data = await response.json().catch(() => [])
          setMeetingsHistory(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des meetings:', error)
        setMeetingsHistory([])
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
          setAbonnesHistory(Array.isArray(data) ? data : [])
        } else {
          // Même en cas d'erreur HTTP, on peut avoir reçu un tableau vide
          const data = await response.json().catch(() => [])
          setAbonnesHistory(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des abonnés:', error)
        setAbonnesHistory([])
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
          setApifyUsersHistory(Array.isArray(data) ? data : [])
        } else {
          // Même en cas d'erreur HTTP, on peut avoir reçu un tableau vide
          const data = await response.json().catch(() => [])
          setApifyUsersHistory(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des utilisateurs Apify:', error)
        setApifyUsersHistory([])
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

  // Récupérer l'historique pour chaque Key Result selon la période sélectionnée
  useEffect(() => {
    const fetchAllKeyResultsHistory = async () => {
      setHistoryLoading(true)
      console.log(`🔄 Récupération de l'historique pour ${keyResults.length} Key Results sur ${selectedPeriod} jours...`)
      const historyPromises = keyResults
        .filter(kr => kr.id && kr.id !== 'chess-rapid-virtual') // Exclure les Key Results virtuels
        .map(async (kr) => {
          try {
            const response = await fetch(`/api/key-result-history?keyResultId=${kr.id}&days=${selectedPeriod}`)
            // Même en cas d'erreur HTTP (rate limit géré côté serveur), essayer de récupérer les données
            const history = await response.json().catch(() => [])
            const historyArray = Array.isArray(history) ? history : []
            
            if (response.ok) {
              if (historyArray.length > 0) {
                console.log(`✅ ${kr.name}: ${historyArray.length} entrées d'historique trouvées`)
              } else {
                console.log(`⚠️ ${kr.name}: Aucun historique trouvé`)
              }
            } else {
              if (response.status === 429) {
                console.warn(`⚠️ ${kr.name}: Rate limit détecté, historique vide`)
              } else {
                console.error(`❌ ${kr.name}: Erreur HTTP ${response.status}`)
              }
            }
            
            return { keyResultId: kr.id, history: historyArray }
          } catch (error) {
            console.error(`❌ Erreur lors de la récupération de l'historique pour ${kr.name} (${kr.id}):`, error)
            return { keyResultId: kr.id, history: [] }
          }
        })
      
      const results = await Promise.all(historyPromises)
      const historyMap = {}
      let totalWithHistory = 0
      results.forEach(({ keyResultId, history }) => {
        historyMap[keyResultId] = history
        if (history.length > 0) totalWithHistory++
      })
      console.log(`✅ Historique récupéré: ${totalWithHistory}/${results.length} Key Results ont un historique`)
      setKeyResultsHistory(historyMap)
      setHistoryLoading(false)
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

  // Filtrer par catégorie sélectionnée
  const filteredGroupedByCategory = selectedCategory 
    ? Object.fromEntries(Object.entries(groupedByCategory).filter(([cat]) => cat === selectedCategory))
    : groupedByCategory

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
  const completedKeyResults = businessKeyResults.filter(isKeyResultCompleted).length
  const inProgressKeyResults =
    businessKeyResults.filter((kr) => {
      if (isKeyResultCompleted(kr)) return false
      if (isKeyResultNotStarted(kr)) return false
      return true
    }).length + chessVirtualKRsCount
  const overallProgress =
    totalKeyResults > 0
      ? Math.round(
          (businessKeyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0) + chessVirtualProgress) /
            totalKeyResults
        )
      : 0

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || ''
    if (statusLower === 'done' || statusLower === 'complete' || statusLower === 'completed') {
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

  // Composant Skeleton avec effet shimmer
  const SkeletonCard = ({ className = '' }) => {
    return (
      <div className={`p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 relative overflow-hidden ${className}`}>
        {/* Effet shimmer */}
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
      </div>
    )
  }

  const SkeletonMetric = ({ className = '' }) => {
    return (
      <div className={`p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
      </div>
    )
  }

  // Composant mini-graphique pour les cartes individuelles
  // Hauteurs en px (pas en %) : les % sur flex items ne reflètent pas toujours les vraies proportions.
  // Même logique d’échelle « amplifiée » que GrowthChart quand la variation est faible vs le niveau (ex. abonnés +12 sur ~430).
  const MiniGrowthChart = ({ history, height = 40, color = 'blue', maxBars = 18 }) => {
    if (!history || history.length === 0) return null

    const dense = densifyHistoryWithForwardFill(history)
    const slice = dense.slice(-Math.max(1, maxBars))
    const narrowBars = slice.length > 8
    const barMaxClass = narrowBars
      ? 'max-w-[6px] sm:max-w-[7px] md:max-w-[8px]'
      : 'max-w-[12px]'
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
      const useAmplifiedScale = range < maxValue * 0.15
      scaleMax = useAmplifiedScale ? maxValue + range * 0.03 : maxValue + range * 0.05
      scaleMin = useAmplifiedScale ? Math.max(0, minValue - range * 0.02) : Math.max(0, minValue - range * 0.02)
    }
    const scaleRange = Math.max(scaleMax - scaleMin, 1e-9)

    const colorClasses = {
      blue: 'bg-blue-500 dark:bg-blue-400',
      green: 'bg-green-500 dark:bg-green-400',
      purple: 'bg-purple-500 dark:bg-purple-400'
    }
    const colorClass = colorClasses[color] || colorClasses.blue

    const columns = []
    slice.forEach((item, index) => {
      const v = Number(item.valeur)
      const safeV = Number.isFinite(v) ? v : 0
      const t = (safeV - scaleMin) / scaleRange
      const barPx = Math.max(3, Math.round(t * height))

      let dateDisplay = item.date
      try {
        const date = new Date(item.date)
        if (!isNaN(date.getTime())) {
          dateDisplay = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        }
      } catch (e) {
        // Garder la date originale si le parsing échoue
      }

      const synthetic = Boolean(item.syntheticFromKeyResult)
      const dailyFill = Boolean(item.syntheticDailyFill)

      columns.push(
        <div
          key={item.id || index}
          className="flex-1 min-w-0 flex flex-col justify-end relative group/bar"
        >
          <div
            className={`w-full ${barMaxClass} mx-auto ${colorClass} rounded-t transition-all relative ${
              dailyFill ? 'opacity-45 border border-dashed border-neutral-400/40 dark:border-neutral-500/35' : 'opacity-70'
            } hover:opacity-100 ${
              synthetic
                ? 'ring-2 ring-amber-500/60 dark:ring-amber-400/50 ring-offset-1 ring-offset-white dark:ring-offset-neutral-950'
                : ''
            }`}
            style={{ height: `${barPx}px` }}
            title={
              synthetic
                ? 'Total actuel du Key Result — compléter l’historique pour les jours manquants.'
                : dailyFill
                  ? 'Aucune mesure ce jour dans l’historique — valeur reportée (grille journalière).'
                  : undefined
            }
          >
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-10 max-w-[min(16rem,calc(100vw-2rem))]">
              <div className="font-medium whitespace-nowrap">{formatNumber(safeV)}</div>
              <div className="text-[10px] opacity-80 whitespace-nowrap">{dateDisplay}</div>
              {synthetic && (
                <div className="text-[10px] opacity-90 mt-1 pt-1 border-t border-white/20 dark:border-neutral-800 whitespace-normal leading-snug">
                  Synchro Key Result : pas de point d’historique pour chaque jour jusqu’à cette date.
                </div>
              )}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="w-2 h-2 bg-neutral-900 dark:bg-neutral-100 rotate-45" />
              </div>
            </div>
          </div>
        </div>
      )
    })

    return (
      <div
        className={`flex items-stretch justify-between mt-2 relative ${narrowBars ? 'gap-px' : 'gap-0.5'}`}
        style={{ height: `${height}px` }}
      >
        {columns}
      </div>
    )
  }

  // Indices des barres pour lesquelles afficher date et valeur (max 8, répartis pour lisibilité)
  const getChartLabelIndices = (n, maxLabels = 8) => {
    if (n <= maxLabels) return new Set(Array.from({ length: n }, (_, i) => i))
    const indices = new Set([0, n - 1])
    for (let i = 1; i < maxLabels - 1; i++) {
      indices.add(Math.round((i / (maxLabels - 1)) * (n - 1)))
    }
    return indices
  }

  // Composant réutilisable pour les graphiques de croissance
  const GrowthChart = ({ title, description, history, loading, colorFrom = 'blue', colorTo = 'blue', insight, targetValue }) => {
    // Une barre par jour : combler les trous de l’historique par report de la dernière valeur (pas d’interpolation).
    const densifiedHistory =
      history && history.length > 0 ? densifyHistoryWithForwardFill(history) : []
    const displayHistory =
      densifiedHistory.length > 0 ? densifiedHistory.slice(-chartMaxPoints) : []

    // Couleurs pastel/claires comme dans MiniGrowthChart
    const colorClasses = {
      blue: 'bg-blue-400 dark:bg-blue-500 hover:bg-blue-500 dark:hover:bg-blue-400',
      green: 'bg-green-400 dark:bg-green-500 hover:bg-green-500 dark:hover:bg-green-400',
      purple: 'bg-purple-400 dark:bg-purple-500 hover:bg-purple-500 dark:hover:bg-purple-400'
    }
    const colorClass = colorClasses[colorFrom] || colorClasses.blue

    // Calculer l'insight sur la plage affichée
    let calculatedInsight = insight
    if (!calculatedInsight && displayHistory.length > 1) {
      const referenceYear = new Date().getFullYear()
      const ys = getYearStartValueFromHistory(history, referenceYear)
      const firstValue = Number.isFinite(Number(ys.valeur))
        ? Number(ys.valeur)
        : Number(displayHistory[0].valeur)
      const lastValue = Number(displayHistory[displayHistory.length - 1].valeur)
      const growth = firstValue > 0 ? ((lastValue / firstValue - 1) * 100).toFixed(1) : 0
      const trend = lastValue >= firstValue ? 'croissance' : 'baisse'
      calculatedInsight = `Tendance ${trend} de ${Math.abs(growth)}% depuis le 1er janvier ${referenceYear} (dernière valeur affichée vs référence année).`
    }

    return (
      <section className="mb-16" aria-label={title}>
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">{title}</h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
        
        {loading ? (
          <div className="h-64 bg-neutral-100 dark:bg-neutral-900 rounded-lg relative overflow-hidden flex items-end justify-around p-4">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-8 bg-neutral-300 dark:bg-neutral-700 rounded-t" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
            ))}
          </div>
        ) : displayHistory.length === 0 ? (
          <p className="text-neutral-600 dark:text-neutral-400">Aucune donnée disponible pour le moment.</p>
        ) : (
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 overflow-x-auto">
            <div className="sr-only">
              <p>
                Graphique en barres représentant l&apos;évolution de {title.toLowerCase()}. Derniers{' '}
                {displayHistory.length} jours (grille journalière ; jours sans mesure dans l’historique = dernière valeur connue),
                chronologiquement de gauche à droite.
              </p>
            </div>
            {densifiedHistory.length > chartMaxPoints && (
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-3">
                Derniers {chartMaxPoints} jours affichés — une colonne par jour ; les trous dans l’historique sont comblés par
                la dernière valeur mesurée.
              </p>
            )}
            {(() => {
              const numericValues = displayHistory.map((h) => {
                const n = Number(h.valeur)
                return Number.isFinite(n) ? n : 0
              })
              const minValue = Math.min(...numericValues)
              const maxValue = Math.max(...numericValues)
              const range = maxValue - minValue
              // Ne pas étendre l’axe Y jusqu’à l’objectif annuel : à ~400 / objectif 1200 les barres deviennent illisibles.
              // L’objectif 2026 reste affiché dans le récap sous le graphique (targetValue).
              const useAmplifiedScale = range > 0 && range < maxValue * 0.15
              const scaleMax =
                range > 0
                  ? useAmplifiedScale
                    ? maxValue + range * 0.03
                    : maxValue + range * 0.05
                  : maxValue + Math.max(maxValue * 0.05, 1)
              const scaleMin =
                range > 0
                  ? useAmplifiedScale
                    ? Math.max(0, minValue - range * 0.02)
                    : Math.max(0, minValue - range * 0.02)
                  : Math.max(0, minValue - Math.max(minValue * 0.02, 1))
              const scaleRange = Math.max(scaleMax - scaleMin, 1e-9)
              const labelIndices = getChartLabelIndices(displayHistory.length, displayHistory.length > 12 ? 6 : 8)
              const yTicks = [scaleMin, scaleMin + scaleRange * 0.25, scaleMin + scaleRange * 0.5, scaleMin + scaleRange * 0.75, scaleMax].map(v => Math.round(v))
              const uniqueYTicks = [...new Set(yTicks)].sort((a, b) => a - b)
              const yTicksTopToBottom = [...uniqueYTicks].reverse()
              return (
                <div className="flex gap-3 min-w-0">
                  {/* Axe Y : valeurs */}
                  <div className="flex flex-col justify-between text-right shrink-0 py-0.5" style={{ minHeight: '240px' }} aria-hidden="true">
                    <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Valeur</span>
                    <div className="flex-1 flex flex-col justify-between mt-1">
                      {yTicksTopToBottom.map((tick, i) => (
                        <span key={i} className="text-xs text-neutral-700 dark:text-neutral-300 tabular-nums">{formatNumber(tick)}</span>
                      ))}
                    </div>
                  </div>
                  {/* Zone graphique : barres flexibles pour tenir dans l'écran sans scroll */}
                  <div className="flex-1 min-w-0 relative">
                    {/* Grille horizontale alignée sur l'axe Y */}
                    {yTicksTopToBottom.length > 1 && (
                      <div className="absolute left-0 right-0 bottom-12 h-[240px] pointer-events-none z-0" aria-hidden="true">
                        {yTicksTopToBottom.map((_, i) => (
                          <div
                            key={i}
                            className="absolute left-0 right-0 border-t border-neutral-200 dark:border-neutral-700/80"
                            style={{ bottom: `${(i / (yTicksTopToBottom.length - 1)) * 100}%` }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-end justify-between gap-0.5 md:gap-1 h-80 md:h-72 relative overflow-y-visible z-10" role="img" aria-label={`Graphique de ${title.toLowerCase()}`}>
                      {displayHistory.map((item, index) => {
                              const val = Number(item.valeur)
                              const safeVal = Number.isFinite(val) ? val : 0
                              const height = scaleRange > 0 ? ((safeVal - scaleMin) / scaleRange) * 100 : 0
                              const showLabel = labelIndices.has(index)
                              const isFirstBars = index < 3
                              const isLastBars = index >= displayHistory.length - 3
                              // Format court pour l’axe : JJ/MM (ex. 23/01)
                              const formatDateForAxis = (dateStr) => {
                                try {
                                  const date = new Date(dateStr)
                                  if (!isNaN(date.getTime())) return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
                                } catch (e) {}
                                return dateStr
                              }
                              const formatDateForTooltip = (dateStr) => {
                                try {
                                  const date = new Date(dateStr)
                                  if (!isNaN(date.getTime())) return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`
                                } catch (e) {}
                                return dateStr
                              }
                              return (
                                <div key={item.id || `${item.date}-${index}`} className="flex flex-col items-center flex-1 min-w-0 relative overflow-visible group/bar z-0 hover:z-[100]" style={{ height: '100%', minWidth: 4 }}>
                                  <div className="relative w-full flex items-end justify-center flex-1" style={{ minHeight: '240px', maxHeight: '240px' }}>
                                    <div 
                                      className={`w-full max-w-[24px] min-w-[3px] ${colorClass} rounded-t transition-all duration-500 relative shadow-sm hover:shadow-md hover:opacity-90 ${
                                        item.syntheticDailyFill ? 'opacity-55 border border-dashed border-neutral-400/50 dark:border-neutral-500/40' : ''
                                      } ${
                                        item.syntheticFromKeyResult
                                          ? 'ring-2 ring-amber-500/55 dark:ring-amber-400/45 ring-offset-1 ring-offset-neutral-50 dark:ring-offset-neutral-900'
                                          : ''
                                      }`}
                                      style={{ height: `${height}%`, minHeight: height > 0 ? '8px' : '0' }}
                                      title={
                                        item.syntheticFromKeyResult
                                          ? `${formatDateForTooltip(item.date)}: ${formatNumber(safeVal)} — total actuel du Key Result (synchro)`
                                          : item.syntheticDailyFill
                                            ? `${formatDateForTooltip(item.date)}: ${formatNumber(safeVal)} — pas de mesure ce jour dans l’historique (valeur reportée)`
                                            : `${formatDateForTooltip(item.date)}: ${formatNumber(safeVal)}`
                                      }
                                    >
                                      {/* Tooltip : au-dessus par défaut, à droite au début, à gauche à la fin pour rester visible */}
                                      <div 
                                        className={`absolute opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl rounded-lg border border-neutral-200 dark:border-neutral-700 z-[100] px-3 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs
                                          ${isFirstBars ? 'left-full ml-2 bottom-1/2 translate-y-1/2' : ''}
                                          ${isLastBars && !isFirstBars ? 'right-full mr-2 bottom-1/2 translate-y-1/2' : ''}
                                          ${!isFirstBars && !isLastBars ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : ''}
                                        `}
                                      >
                                        <div className="font-medium">{formatDateForTooltip(item.date)}</div>
                                        <div className="font-semibold mt-0.5">{formatNumber(safeVal)}</div>
                                        {/* Petite flèche vers la barre */}
                                        {!isFirstBars && !isLastBars && (
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-100" />
                                        )}
                                        {isFirstBars && (
                                          <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px border-4 border-transparent border-r-neutral-900 dark:border-r-neutral-100" />
                                        )}
                                        {isLastBars && !isFirstBars && (
                                          <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-px border-4 border-transparent border-l-neutral-900 dark:border-l-neutral-100" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-neutral-700 dark:text-neutral-300 mt-2 w-full px-0.5 text-center shrink-0 overflow-visible" style={{ minHeight: '2.5rem' }}>
                                    {showLabel ? (
                                      <>
                                        <div className="font-semibold tabular-nums">{formatNumber(safeVal)}</div>
                                        <div className="hidden sm:block text-[11px] mt-0.5 leading-tight tabular-nums font-medium text-neutral-600 dark:text-neutral-400" title={formatDateForTooltip(item.date)}>{formatDateForAxis(item.date)}</div>
                                      </>
                                    ) : (
                                      <div className="h-5" aria-hidden="true" />
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                    </div>
                    <div className="mt-1 text-[10px] text-neutral-600 dark:text-neutral-400 text-center font-medium uppercase tracking-wider">Date (période)</div>
                  </div>
                </div>
              )
            })()}

            {displayHistory.some((h) => h.syntheticDailyFill || h.syntheticFromKeyResult) && (
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-3 leading-relaxed">
                Barres pâles = jours sans mesure (dernière valeur connue reportée). Contour ambré = valeur actuelle de l&apos;objectif, plus récente que l&apos;historique.
              </p>
            )}

            {/* Résumé tendance : référence = 1er janvier de l’année courante (tout l’historique), pas seulement la fenêtre du graphique */}
            {displayHistory.length > 1 && (() => {
              const referenceYear = new Date().getFullYear()
              const yearStart = getYearStartValueFromHistory(history, referenceYear)
              const startV = Number(yearStart.valeur)
              const startOk = Number.isFinite(startV)
              const lastV = Number(displayHistory[displayHistory.length - 1].valeur) || 0
              const fmtRefDate = (d) => {
                try {
                  const x = new Date(d)
                  return isNaN(x.getTime())
                    ? ''
                    : x.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                } catch {
                  return ''
                }
              }
              const delta = startOk ? lastV - startV : null
              const pct =
                startOk && startV > 0 ? (((lastV / startV - 1) * 100).toFixed(1)) : null

              return (
                <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-start justify-between text-sm gap-3">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Valeur au 1er janvier {referenceYear}
                    </span>
                    <span className="font-semibold tabular-nums text-right shrink-0">
                      {startOk ? formatNumber(startV) : '—'}
                    </span>
                  </div>
                  {yearStart.label === 'first_in_year' && yearStart.date && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1.5 leading-snug">
                      Aucune ligne exactement le 1er janv. : première mesure de {referenceYear} le{' '}
                      <span className="tabular-nums font-medium">{fmtRefDate(yearStart.date)}</span>.
                    </p>
                  )}
                  {yearStart.label === 'last_before_year' && yearStart.date && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1.5 leading-snug">
                      Aucune mesure en {referenceYear} avant la fenêtre affichée : valeur retenue = dernière avant le 1er janv. (
                      <span className="tabular-nums font-medium">{fmtRefDate(yearStart.date)}</span>).
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm mt-3">
                    <span className="text-neutral-600 dark:text-neutral-400">Dernière valeur</span>
                    <span className="font-semibold tabular-nums">{formatNumber(lastV)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Croissance depuis le 1er janv. {referenceYear}
                    </span>
                    <span
                      className={`font-semibold tabular-nums ${
                        !startOk
                          ? ''
                          : lastV >= startV
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-orange-700 dark:text-orange-400'
                      }`}
                    >
                      {!startOk || delta === null
                        ? '—'
                        : (
                            <>
                              {lastV >= startV ? '+' : ''}
                              {formatNumber(delta)}
                              {pct !== null && (
                                <>
                                  {' '}
                                  ({pct}%)
                                </>
                              )}
                            </>
                          )}
                    </span>
                  </div>
                  {targetValue && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-neutral-600 dark:text-neutral-400">Objectif 2026</span>
                      <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {formatNumber(targetValue)}
                      </span>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
        {calculatedInsight && !loading && displayHistory.length > 0 && (
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
      <main className="flex-auto min-w-0 mt-6 flex flex-col overflow-x-hidden">
        <section className="mb-8">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">Objectifs 2026</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-2 tracking-tight">
            Journal public de ma progression métier — scraping, automatisation, data et CA cumulé, suivi en build in public.
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-8 tracking-tight">
            Inclut aussi Logement Atypique (projet avec mon frère), en annexe du cœur de métier freelance.
          </p>
        </section>

        {/* Hero CA cumulé */}
        {!loading && (
          <section className="mb-12" aria-label="CA cumulé objectif 2026">
            {(() => {
              const caFreelanceKRs = keyResults.filter(kr => {
                const categoryLower = (kr.category || '').toLowerCase()
                const nameLower = (kr.name || '').toLowerCase()
                return (categoryLower.includes('freelance') || categoryLower.includes('freelancing')) &&
                       (nameLower.includes('ca') || nameLower.includes('chiffre')) &&
                       !nameLower.includes('affiliation')
              })
              const caFreelanceTotalKR = caFreelanceKRs.find(kr => (kr.name || '').toLowerCase().includes('total'))
              const caFreelance = caFreelanceTotalKR
                ? (caFreelanceTotalKR.targetResult || 0)
                : (caFreelanceKRs.length > 0 ? Math.max(...caFreelanceKRs.map(kr => kr.targetResult || 0)) : 0)

              const caAffiliationKRs = keyResults.filter(kr => {
                const categoryLower = (kr.category || '').toLowerCase()
                const nameLower = (kr.name || '').toLowerCase()
                return (categoryLower.includes('affiliation') || categoryLower.includes('partenariats')) &&
                       (nameLower.includes('ca') || nameLower.includes('chiffre') || nameLower.includes('revenus'))
              })
              const caAffiliationTotalKR = caAffiliationKRs.find(kr => (kr.name || '').toLowerCase().includes('total'))
              const caAffiliation = caAffiliationTotalKR
                ? (caAffiliationTotalKR.targetResult || 0)
                : (caAffiliationKRs.length > 0 ? caAffiliationKRs.reduce((sum, kr) => sum + (kr.targetResult || 0), 0) : 0)

              const caLogementAtypiqueKRs = keyResults.filter(kr => {
                const categoryLower = (kr.category || '').toLowerCase()
                const nameLower = (kr.name || '').toLowerCase()
                return (categoryLower.includes('logement') || categoryLower.includes('entrepreneurial')) &&
                       (nameLower.includes('arr') || nameLower.includes('ca') || nameLower.includes('chiffre')) &&
                       nameLower.includes('logement')
              })
              const caLogementAtypiqueTotalKR = caLogementAtypiqueKRs.find(kr => (kr.name || '').toLowerCase().includes('arr'))
              const caLogementAtypique = caLogementAtypiqueTotalKR
                ? (caLogementAtypiqueTotalKR.targetResult || 0)
                : (caLogementAtypiqueKRs.length > 0 ? Math.max(...caLogementAtypiqueKRs.map(kr => kr.targetResult || 0)) : 0)

              const totalCA = caFreelance + caAffiliation + caLogementAtypique

              return (
                <>
                  <div className="mb-6 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Objectif 2026 — CA cumulé</p>
                    <p className="text-4xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2 tracking-tight">
                      {totalCA > 0 ? `${formatNumber(Math.round(totalCA))} €` : '—'}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-500">
                      Freelance + affiliation + projets, suivi en build in public
                    </p>
                    {overallProgress > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-neutral-600 dark:text-neutral-400">Progression globale</span>
                          <span className="text-xs text-neutral-600 dark:text-neutral-400">{overallProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-500"
                            style={{ width: `${Math.min(100, overallProgress)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Freelance</p>
                      <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {caFreelance > 0 ? `${formatNumber(Math.round(caFreelance))} €` : '—'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Affiliation</p>
                      <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                        {caAffiliation > 0 ? `${formatNumber(Math.round(caAffiliation))} €` : '—'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Logement Atypique</p>
                      <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                        {caLogementAtypique > 0 ? `${formatNumber(Math.round(caLogementAtypique))} €` : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">5/5</p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Note moyenne Malt & Fiverr</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">&lt; 7 jours</p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Délai moyen de livraison</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">20–30</p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Projets livrés / mois</p>
                    </div>
                  </div>
                </>
              )
            })()}
          </section>
        )}


        <section className="mb-16" aria-label="Détail des objectifs par catégorie">
          {/* Vue détaillée des Key Results */}
          <div className="mb-8">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Objectifs 2026 — Détail</h2>
          
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
              
              {/* Sélecteur de période d'évolution - déplacé ici */}
              <div className="mt-6">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Période d'évolution
                </label>
                <div className="flex flex-wrap gap-2">
                  {[3, 7, 30].map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        selectedPeriod === period
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                          : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      {period} jours
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Détail par catégorie */}
          {loading ? (
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"></div>
                  </div>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, j) => (
                      <SkeletonCard key={j} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
                              </h2>
                              {isKeyResultCompleted(kr) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 bg-green-600 dark:bg-green-500 text-white">
                                  Terminé
                                </span>
                              )}
                              {!isKeyResultCompleted(kr) && !isKeyResultNotStarted(kr) && (
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
                                {/* Indicateur d'évolution - avec fond coloré pour plus de visibilité */}
                                {(() => {
                                  // Afficher un skeleton pendant le chargement de l'historique
                                  if (historyLoading) {
                                    return (
                                      <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 relative overflow-hidden">
                                        <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"></span>
                                        <span className="w-8 h-3"></span>
                                      </span>
                                    )
                                  }
                                  
                                  const evolution = calculateEvolution(kr)
                                  if (evolution) {
                                    return (
                                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${
                                        evolution.isPositive 
                                          ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                                          : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                                      }`}>
                                        {evolution.isPositive ? (
                                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                                            <path d="M6 2L2 6H5V10H7V6H10L6 2Z" fill="currentColor" />
                                          </svg>
                                        ) : (
                                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                                            <path d="M6 10L10 6H7V2H5V6H2L6 10Z" fill="currentColor" />
                                          </svg>
                                        )}
                                        <span>{evolution.isPositive ? '+' : ''}{evolution.percentage}%</span>
                                      </span>
                                    )
                                  }
                                  // Debug: vérifier pourquoi l'évolution n'est pas calculée
                                  const nameLower = (kr.name || '').toLowerCase()
                                  const title = improveTitle(kr.name, kr.category)
                                  const isMaltKR = nameLower.includes('mission malt') || title.includes('Projets réalisés sur Malt')
                                  const isChessKR = (nameLower.includes('rapid') || nameLower.includes('échecs') || nameLower.includes('chess')) && 
                                                   (title.includes('Classement échecs') || title.includes('échecs chess.com'))
                                  if (isMaltKR || isChessKR) {
                                    const history = isChessKR && chessHistory.length > 0 
                                      ? chessHistory 
                                      : keyResultsHistory[kr.id] || []
                                    if (history.length === 0) {
                                      // Log silencieux pour debug (peut être retiré en production)
                                      // console.log(`⚠️ Pas d'historique pour ${kr.name} (${kr.id})`)
                                    }
                                  }
                                  return null
                                })()}
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
                                    // Le targetResult du total est déjà en EUR dans les données, pas besoin de conversion
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
                        
                        {/* Mini-graphique de croissance pour plusieurs Key Results */}
                        {(() => {
                          const nameLower = (kr.name || '').toLowerCase()
                          const title = improveTitle(kr.name, kr.category)
                          const categoryLower = (kr.category || '').toLowerCase()
                          
                          // Détecter les différents types de Key Results
                          const isMaltKR = nameLower.includes('mission malt') || title.includes('Projets réalisés sur Malt')
                          const isChessKR = (nameLower.includes('rapid') || nameLower.includes('échecs') || nameLower.includes('chess')) && 
                                           (title.includes('Classement échecs') || title.includes('échecs chess.com'))
                          const isMeetingsKR = title.includes('Rendez-vous et appels clients') || 
                                               (categoryLower.includes('relation client') && (nameLower.includes('rendez-vous') || nameLower.includes('meeting')))
                          const isInstagramKR = (nameLower.includes('abonnés') || nameLower.includes('abonne')) && 
                                               (categoryLower.includes('logement') || categoryLower.includes('entrepreneurial'))
                          // Détecter uniquement "Utilisateurs total Apify", pas les mensuels
                          const isApifyKR = (nameLower.includes('utilisateurs total') || nameLower.includes('total users') || nameLower.includes('total utilisateurs')) && 
                                           (nameLower.includes('apify') || categoryLower.includes('apify') || categoryLower.includes('scraping')) &&
                                           !nameLower.includes('mensuel') && !nameLower.includes('monthly')
                          
                          // Récupérer l'historique pour ce Key Result
                          let history = []
                          let color = 'blue'
                          
                          if (isMaltKR) {
                            history = keyResultsHistory[kr.id] || []
                            color = 'blue'
                          } else if (isChessKR) {
                            // Pour Chess, utiliser l'historique Chess.com si disponible
                            history = chessHistory.length > 0 ? chessHistory : (keyResultsHistory[kr.id] || [])
                            color = 'green'
                          } else if (isMeetingsKR) {
                            history = meetingsHistory
                            color = 'blue'
                          } else if (isInstagramKR) {
                            history = abonnesHistorySynced
                            color = 'green'
                          } else if (isApifyKR) {
                            history = apifyUsersHistorySynced
                            color = 'purple'
                          }
                          
                          if ((isMaltKR || isChessKR || isMeetingsKR || isInstagramKR || isApifyKR) && history.length > 0) {
                            return (
                              <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                <MiniGrowthChart
                                  history={history}
                                  height={36}
                                  color={color}
                                  maxBars={18}
                                />
                              </div>
                            )
                          }
                          return null
                        })()}
                        
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
          history={abonnesHistorySynced}
          loading={abonnesLoading}
          colorFrom="green"
          targetValue={(() => {
            const abonnesKR = findAbonnesKeyResult(keyResults)
            return abonnesKR?.targetResult || null
          })()}
          insight={abonnesHistorySynced.length > 1 ? `Croissance de la communauté avec ${abonnesHistorySynced[abonnesHistorySynced.length - 1].valeur - abonnesHistorySynced[0].valeur >= 0 ? '+' : ''}${abonnesHistorySynced[abonnesHistorySynced.length - 1].valeur - abonnesHistorySynced[0].valeur} abonnés sur la période.` : null}
        />

        <GrowthChart
          title="Évolution des utilisateurs Apify"
          description="Nombre d'utilisateurs actifs de mes scrapers publics sur Apify. Cette métrique reflète l'adoption et l'utilité de mes outils open source."
          history={apifyUsersHistorySynced}
          loading={apifyUsersLoading}
          colorFrom="purple"
          targetValue={(() => {
            const apifyKR = findApifyUsersTotalKeyResult(keyResults)
            return apifyKR?.targetResult || null
          })()}
          insight={apifyUsersHistorySynced.length > 1 ? `Adoption croissante de mes scrapers avec ${(Number(apifyUsersHistorySynced[apifyUsersHistorySynced.length - 1].valeur) || 0) - (Number(apifyUsersHistorySynced[0].valeur) || 0) >= 0 ? '+' : ''}${formatNumber((Number(apifyUsersHistorySynced[apifyUsersHistorySynced.length - 1].valeur) || 0) - (Number(apifyUsersHistorySynced[0].valeur) || 0))} nouveaux utilisateurs.` : null}
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
