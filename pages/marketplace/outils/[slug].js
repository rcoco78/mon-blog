/**
 * Page dynamique pour les outils Apify
 * Interface simple : search bar pour input → lancement → résultats → paywall popup
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SEOHead from '../../../components/seo/SEOHead'
import StructuredData from '../../../components/seo/StructuredData'
import Toast, { useToast } from '../../../components/Toast'
import FAQ from '../../../components/FAQ'
import { generatePageSEO } from '../../../lib/seo'
import { siteConfig } from '../../../lib/config'
import { getAllEnrichedActors } from '../../../lib/apify-actors-enriched'
import { shortMarketplaceTitle } from '../../../lib/marketplace-display'

export default function MarketplaceTool({ tool, notFound }) {
  // Input principal (comme URL Airbnb pour le scraper)
  const [mainInput, setMainInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [runResults, setRunResults] = useState(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  // Extraire le champ principal depuis inputSchema de manière dynamique
  const getMainInputField = () => {
    if (!tool?.apifyInputSchema?.properties) return null
    
    const properties = tool.apifyInputSchema.properties
    const required = tool.apifyInputSchema.required || []
    
    // Fonction pour générer un placeholder intelligent selon le nom et type du champ
    const generatePlaceholder = (key, field) => {
      const keyLower = key.toLowerCase()
      const description = field.description || field.title || ''
      
      // Si description existe, l'utiliser
      if (description) {
        // Extraire l'exemple de la description si présent
        const exampleMatch = description.match(/[Ee]xample[:\s]+([^\n]+)/i) || 
                            description.match(/[Ee]x[:\s]+([^\n]+)/i)
        if (exampleMatch) {
          return exampleMatch[1].trim()
        }
      }
      
      // Placeholders intelligents selon le nom du champ
      if (keyLower.includes('city') || keyLower.includes('ville') || keyLower.includes('location')) {
        return 'Ex: Paris, Lyon, Marseille...'
      } else if (keyLower.includes('url') || keyLower.includes('link')) {
        if (keyLower.includes('listing')) {
          return 'Ex: https://www.airbnb.com/rooms/12345678'
        }
        return 'Ex: https://example.com'
      } else if (keyLower.includes('search') || keyLower.includes('query')) {
        return 'Ex: Recherche...'
      } else if (keyLower.includes('email')) {
        return 'Ex: contact@example.com'
      } else if (keyLower.includes('date')) {
        return 'Ex: 2026-01-26'
      }
      
      // Par défaut, utiliser la description ou générer un placeholder générique
      return description || `Entrez ${key}...`
    }
    
    // PRIORITÉ 1: Champs requis (s'il y en a)
    if (required.length > 0) {
      for (const reqKey of required) {
        if (properties[reqKey]) {
          const field = properties[reqKey]
          return {
            key: reqKey,
            ...field,
            placeholder: generatePlaceholder(reqKey, field),
            required: true
          }
        }
      }
    }
    
    // PRIORITÉ 2: Chercher des champs communs dans un ordre logique
    const priorityFields = [
      'city', 'listingUrl', 'url', 'search', 'query', 
      'listingUrls', 'keyword', 'location', 'input'
    ]
    
    for (const priorityKey of priorityFields) {
      if (properties[priorityKey]) {
        const field = properties[priorityKey]
        // Permettre les champs de type array pour "city" car on sait les transformer
        // Éviter seulement les autres arrays complexes
        if (field.type === 'array' && !priorityKey.includes('Url') && priorityKey !== 'city') {
          continue
        }
        return {
          key: priorityKey,
          ...field,
          placeholder: generatePlaceholder(priorityKey, field),
          required: false
        }
      }
    }
    
    // PRIORITÉ 3: Prendre le premier champ de type string (le plus simple)
    for (const [key, field] of Object.entries(properties)) {
      // Ignorer les champs de type object, array complexe, ou boolean
      if (field.type === 'string' || field.type === 'integer' || field.type === 'number') {
        // Ignorer les champs qui semblent être des options/filtres
        if (key.toLowerCase().includes('only') || 
            key.toLowerCase().includes('filter') ||
            key.toLowerCase().includes('min') ||
            key.toLowerCase().includes('max')) {
          continue
        }
        return {
          key: key,
          ...field,
          placeholder: generatePlaceholder(key, field),
          required: false
        }
      }
    }
    
    // PRIORITÉ 4: Prendre le premier champ disponible (dernier recours)
    const firstKey = Object.keys(properties)[0]
    if (firstKey) {
      return {
        key: firstKey,
        ...properties[firstKey],
        placeholder: generatePlaceholder(firstKey, properties[firstKey]),
        required: false
      }
    }
    
    return null
  }

  const mainInputField = getMainInputField()

  // Debug: afficher le champ détecté
  useEffect(() => {
    if (mainInputField) {
      console.log('✅ Champ principal détecté:', {
        key: mainInputField.key,
        type: mainInputField.type,
        title: mainInputField.title,
        placeholder: mainInputField.placeholder
      })
    } else {
      console.warn('⚠️ Aucun champ principal détecté. inputSchema:', tool?.apifyInputSchema)
    }
  }, [mainInputField, tool])

  // Vérifier le paiement au chargement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const paymentStatus = urlParams.get('payment')
      const sessionId = urlParams.get('session_id')

      if (paymentStatus === 'success' && sessionId) {
        verifyPayment(sessionId)
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  const verifyPayment = async (sessionId) => {
    try {
      const response = await fetch('/api/tools/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()

      if (data.paid) {
        setPaymentVerified(true)
        setShowPaywall(false)
        showToast('✓ Paiement confirmé ! Vous pouvez maintenant voir tous les résultats.', 'success')
      }
    } catch (error) {
      console.error('Erreur vérification paiement:', error)
    }
  }



  const handleRun = async (isDemo = true) => {
    if (!tool || !tool.apifyActorId) {
      showToast('Erreur: outil non disponible', 'error')
      return
    }

    // En mode démo, on peut lancer même sans input si pas de champ détecté
    if (!isDemo && !mainInput.trim() && mainInputField) {
      showToast('Veuillez entrer une valeur', 'error')
      return
    }
    
    // En mode démo, si pas d'input, utiliser une valeur par défaut
    if (isDemo && !mainInput.trim()) {
      setMainInput('Paris') // Valeur par défaut pour la démo
    }

    setIsRunning(true)
    setRunResults(null)
    setShowPaywall(false)
    
    if (isDemo) {
      showToast('🔄 Démonstration en cours...', 'info')
    } else {
      showToast('Lancement de l\'outil en cours...', 'info')
    }

           try {
             // MODE DÉMO : Lancer réellement l'acteur mais limité à 5 résultats
             if (isDemo) {
               // Construire l'input pour Apify (même logique que mode réel)
               let input = {}
               
               if (mainInputField) {
                 const fieldKey = mainInputField.key
                 const fieldValue = mainInput.trim() || 'Paris' // Fallback si vide
                 
                 console.log('🔍 Construction input démo:', { fieldKey, fieldValue, type: mainInputField.type })
                 
                 // Gérer les différents types de champs - PRIORITÉ au champ "city"
                 if (fieldKey === 'city') {
                   // Pour city, toujours transformer en array
                   input[fieldKey] = fieldValue.includes(',') 
                     ? fieldValue.split(',').map(c => c.trim()).filter(c => c)
                     : [fieldValue]
                 } else if (mainInputField.type === 'array' || fieldKey.toLowerCase().includes('urls')) {
                   if (fieldKey === 'listingUrls') {
                     input[fieldKey] = [{ url: fieldValue }]
                   } else {
                     input[fieldKey] = [fieldValue]
                   }
                 } else if (fieldKey === 'listingUrl' || fieldKey === 'url') {
                   input[fieldKey] = fieldValue
                 } else {
                   input[fieldKey] = fieldValue
                 }
                 
                 // Ajouter des limites pour la démo
                 if (fieldKey === 'city' || !input.maxPages) {
                   input.maxPages = 1 // Limiter à 1 page pour la démo
                 }
                 
                 console.log('📤 Input final démo:', JSON.stringify(input, null, 2))
               } else {
                 // Si pas de champ détecté, utiliser l'input brut avec fallback
                 input = { query: mainInput.trim() || 'Paris' }
               }
               
               // Lancer l'actor
               const response = await fetch('/api/apify/run-actor', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                   actorId: tool.apifyActorId,
                   input: input
                 }),
               })
               
               if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
                 showToast(`Erreur: ${errorData.error || 'Impossible de lancer l\'outil'}`, 'error')
                 setIsRunning(false)
                 return
               }
               
               const data = await response.json()
               
               if (data.error) {
                 showToast(`Erreur: ${data.error}`, 'error')
                 setIsRunning(false)
                 return
               }
               
               // Attendre un peu pour que le dataset soit prêt
               await new Promise(resolve => setTimeout(resolve, 2000))
               
               // Récupérer les résultats du dataset (limité à 5 pour la démo)
               if (data.datasetId) {
                 const resultsResponse = await fetch(`/api/apify/get-dataset?datasetId=${data.datasetId}&limit=5&demo=true`)
                 const resultsData = await resultsResponse.json()
                 
                 if (resultsData.items && resultsData.items.length > 0) {
                   setRunResults({
                     items: resultsData.items,
                     datasetId: data.datasetId,
                     runId: data.runId,
                     totalCount: resultsData.totalCount || resultsData.items.length,
                     isDemo: true
                   })
                   showToast('✅ Démonstration terminée - Voici un aperçu des résultats (5 premiers)', 'success')
                 } else {
                   showToast('Aucun résultat trouvé', 'info')
                 }
               }
               
               setIsRunning(false)
               return
             }

      // MODE RÉEL : Lancer l'actor Apify
      // Construire l'input pour Apify selon le type de champ
      let input = {}
      
      if (mainInputField) {
        const fieldKey = mainInputField.key
        const fieldValue = mainInput.trim()
        
        console.log('🔍 Champ détecté:', {
          key: fieldKey,
          type: mainInputField.type,
          value: fieldValue
        })
        
        // Gérer les différents types de champs
        if (fieldKey === 'city') {
          // Pour city, toujours transformer en array (même si le type n'est pas array dans le schema)
          input[fieldKey] = fieldValue.includes(',') 
            ? fieldValue.split(',').map(c => c.trim()).filter(c => c)
            : [fieldValue]
        } else if (mainInputField.type === 'array' || fieldKey.toLowerCase().includes('urls')) {
          // Pour les autres arrays, créer un tableau
          // Si c'est listingUrls, format: [{"url": "..."}]
          if (fieldKey === 'listingUrls') {
            input[fieldKey] = [{ url: fieldValue }]
          } else {
            input[fieldKey] = [fieldValue]
          }
        } else if (mainInputField.type === 'integer' || mainInputField.type === 'number') {
          input[fieldKey] = parseInt(fieldValue) || fieldValue
        } else {
          // String par défaut
          input[fieldKey] = fieldValue
        }
        
        console.log('📤 Input formaté pour Apify:', JSON.stringify(input, null, 2))
      } else {
        console.warn('⚠️ Aucun champ principal détecté')
      }

      console.log('🚀 Envoi de la requête à l\'API:', {
        actorId: tool.apifyActorId,
        input: input
      })

      const response = await fetch('/api/apify/run-actor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: tool.apifyActorId,
          input: input
        }),
      })
      
      console.log('📡 Réponse API:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
        showToast(`Erreur: ${errorData.error || 'Impossible de lancer l\'outil'}`, 'error')
        setIsRunning(false)
        return
      }

      const data = await response.json()

      if (data.error) {
        showToast(`Erreur: ${data.error}`, 'error')
        setIsRunning(false)
        return
      }

      // Attendre un peu pour que le dataset soit prêt
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Récupérer les résultats du dataset
      if (data.datasetId) {
        // Limiter à 5 résultats si l'utilisateur n'a pas payé
        const limit = paymentVerified ? 100 : 5
        const resultsResponse = await fetch(`/api/apify/get-dataset?datasetId=${data.datasetId}&limit=${limit}`)
        const resultsData = await resultsResponse.json()

        if (resultsData.items && resultsData.items.length > 0) {
          setRunResults({
            items: resultsData.items,
            datasetId: data.datasetId,
            runId: data.runId,
            totalCount: resultsData.totalCount || resultsData.items.length
          })
          showToast('✓ Outil exécuté avec succès !', 'success')
          
          // Afficher le paywall si plus de 5 résultats et pas payé
          if (resultsData.totalCount > 5 && !paymentVerified) {
            setShowPaywall(true)
          }
        } else {
          showToast('Aucun résultat trouvé', 'info')
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution:', error)
      showToast('Erreur lors de l\'exécution de l\'outil', 'error')
    } finally {
      setIsRunning(false)
    }
  }

  // Si pas trouvé, afficher 404
  if (notFound || !tool) {
    return (
      <div className="py-12">
        <h1 className="text-2xl font-semibold mb-4">Outil non trouvé</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Cet outil n&apos;existe pas ou a été supprimé.
        </p>
        <Link
          href="/marketplace"
          className="text-sm text-neutral-900 dark:text-neutral-100 underline underline-offset-4 hover:no-underline"
        >
          Retour à la marketplace
        </Link>
      </div>
    )
  }

  // Extraire les headers depuis les résultats
  const getHeaders = () => {
    if (!runResults || !runResults.items || runResults.items.length === 0) {
      return []
    }

    const firstItem = runResults.items[0]
    if (typeof firstItem === 'object' && firstItem !== null && !Array.isArray(firstItem)) {
      return Object.keys(firstItem)
    }

    return []
  }

  const headers = getHeaders()
  const previewHeaders = headers.slice(0, 5)

  // Déterminer combien de résultats afficher
  const displayedResults = runResults?.items
    ? paymentVerified
      ? runResults.items
      : runResults.items.slice(0, 5)
    : []

  const displayName = shortMarketplaceTitle(tool.name)
  const apifyLink = tool.apifyUrl || tool.url || null
  const category = tool.category || 'Outil'
  const users = tool.apifyStats?.users ?? tool.apifyStats?.totalUsers
  const runs = tool.apifyStats?.runs ?? tool.apifyStats?.totalRuns

  const popularSearches = (() => {
    const actorName = tool?.name?.toLowerCase() || ''
    if (actorName.includes('airbnb')) {
      return ['Paris', 'Lyon', 'Marseille', 'Nice', 'Bordeaux']
    }
    if (actorName.includes('immobilier')) {
      return ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nantes']
    }
    const placeholder = mainInputField?.placeholder || ''
    if (placeholder.toLowerCase().includes('ville') || placeholder.toLowerCase().includes('city')) {
      return ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nantes']
    }
    if (placeholder.toLowerCase().includes('url')) {
      return []
    }
    return []
  })()

  const pageSEO = generatePageSEO({
    title: `${displayName} | Outil de scraping`,
    description:
      tool.description || `Utilisez ${displayName} pour collecter des données automatiquement.`,
    path: `/marketplace/outils/${tool.slug}`,
    keywords: ['scraping', 'automatisation', 'données', tool.name],
  })

  const formatCell = (value) => {
    if (value === null || value === undefined || value === '') return '—'
    if (typeof value === 'object') {
      const text = JSON.stringify(value)
      return text.length > 48 ? `${text.slice(0, 45)}…` : text
    }
    const text = String(value)
    return text.length > 48 ? `${text.slice(0, 45)}…` : text
  }

  const downloadCsv = () => {
    const csvHeaders = getHeaders()
    const csvRows = []
    if (csvHeaders.length > 0) csvRows.push(csvHeaders.join(','))
    displayedResults.forEach((item) => {
      if (csvHeaders.length > 0) {
        const row = csvHeaders.map((header) => {
          const value = item[header]
          return value !== null && value !== undefined
            ? `"${String(value).replace(/"/g, '""')}"`
            : ''
        })
        csvRows.push(row.join(','))
      }
    })
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${tool.slug}-results.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePaywallCheckout = async () => {
    try {
      const response = await fetch('/api/tools/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: tool.slug,
          subscriptionType: 'one-time',
        }),
      })
      const data = await response.json()
      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        showToast(data.error || 'Erreur lors du paiement', 'error')
      }
    } catch (error) {
      console.error('Erreur paiement outil:', error)
      showToast('Erreur lors du paiement', 'error')
    }
  }

  const faqItems =
    tool.enrichedData?.objections?.length > 0 && tool.enrichedData?.objectionsAnswers?.length > 0
      ? tool.enrichedData.objections.map((objection, index) => ({
          question: objection,
          answer: tool.enrichedData.objectionsAnswers[index] || '',
        }))
      : [
          {
            question: 'Comment ça marche ?',
            answer:
              'Entrez un input (ville, URL…), lancez l’outil, consultez les premiers résultats, puis débloquez le reste pour 5 € si besoin.',
          },
          {
            question: 'Quelle différence avec une base Google Sheets ?',
            answer:
              'Les bases Sheets sont un snapshot prêt à copier. Les outils Apify tournent à la demande, avec des données plus fraîches à chaque run.',
          },
        ]

  return (
    <>
      <SEOHead {...pageSEO} />
      <StructuredData
        type="SoftwareApplication"
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: tool.name,
          description: tool.description,
          applicationCategory: 'WebScrapingApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '5',
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
          },
          url: `${siteConfig.url}/marketplace/outils/${tool.slug}`,
        }}
      />

      {toast && <Toast {...toast} onClose={hideToast} />}

      <article className="min-w-0 mt-6 flex flex-col pb-16">
        <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-500" aria-label="Fil d'Ariane">
          <Link
            href="/marketplace"
            className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Marketplace
          </Link>
          <span className="mx-1.5 text-neutral-300 dark:text-neutral-700">/</span>
          <Link
            href="/marketplace?tab=tools"
            className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Outils
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="font-semibold text-2xl md:text-3xl tracking-tighter text-neutral-900 dark:text-neutral-100 mb-3">
            {displayName}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
            {[
              category,
              'API Apify',
              users != null ? `${Number(users).toLocaleString('fr-FR')} utilisateurs` : null,
              runs != null ? `${Number(runs).toLocaleString('fr-FR')} runs` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {tool.description && (
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {tool.description}
            </p>
          )}
        </header>

        <div className="min-w-0 space-y-10">
          <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8" id="lancer">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-5">
              <p className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
                5 €
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500">
                essai gratuit · puis déblocage unique
              </p>
            </div>

            <label htmlFor="tool-main-input" className="sr-only">
              {mainInputField?.title || mainInputField?.key || 'Input'}
            </label>
            <input
              id="tool-main-input"
              type="text"
              value={mainInput}
              onChange={(e) => setMainInput(e.target.value)}
              placeholder={mainInputField?.placeholder || 'Entrez votre input…'}
              disabled={isRunning}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isRunning && mainInput.trim()) {
                  handleRun(true)
                }
              }}
              className="w-full px-0 py-2.5 text-base border-0 border-b border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-500 transition-colors disabled:opacity-50"
            />

            <button
              type="button"
              onClick={() => handleRun(true)}
              disabled={isRunning || !mainInput.trim()}
              className="mt-5 flex w-full items-center justify-center px-5 py-3.5 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Exécution…' : 'Lancer un essai gratuit'}
            </button>

            <ul className="mt-5 space-y-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              <li>5 premiers résultats gratuits pour juger la qualité</li>
              <li>Déblocage à 5 € pour le run complet + export CSV</li>
              <li>Données à jour à chaque exécution</li>
            </ul>

            {popularSearches.length > 0 && (
              <p className="mt-5 text-sm text-neutral-500 dark:text-neutral-500 leading-relaxed">
                Exemples :{' '}
                {popularSearches.map((search, index) => (
                  <span key={search}>
                    {index > 0 ? ' · ' : ''}
                    <button
                      type="button"
                      onClick={() => {
                        setMainInput(search)
                        handleRun(true)
                      }}
                      className="text-neutral-800 dark:text-neutral-200 underline underline-offset-2 hover:no-underline"
                    >
                      {search}
                    </button>
                  </span>
                ))}
              </p>
            )}

            {apifyLink && (
              <p className="mt-5 text-sm text-neutral-500 dark:text-neutral-500 leading-relaxed">
                Préférez une base figée livrée en Sheets ?{' '}
                <Link
                  href="/marketplace"
                  className="text-neutral-800 dark:text-neutral-200 underline underline-offset-2 hover:no-underline"
                >
                  Voir les bases
                </Link>
                {' · '}
                <a
                  href={apifyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-800 dark:text-neutral-200 underline underline-offset-2 hover:no-underline"
                >
                  Page Apify
                </a>
              </p>
            )}
          </section>

          {runResults && runResults.items && runResults.items.length > 0 && (
            <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <div className="flex flex-wrap items-baseline justify-between gap-4 mb-2">
                <h2 className="font-semibold text-xl tracking-tighter">Résultats</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 shrink-0">
                  {displayedResults.length} ligne
                  {displayedResults.length > 1 ? 's' : ''}
                  {!paymentVerified && runResults.totalCount > displayedResults.length
                    ? ` · ${runResults.totalCount} au total`
                    : ''}
                </p>
              </div>

              {previewHeaders.length > 0 ? (
                <div className="mt-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[18rem] text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800">
                        {previewHeaders.map((header) => (
                          <th
                            key={header}
                            className="pr-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-500 whitespace-nowrap"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayedResults.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-neutral-100 dark:border-neutral-900"
                        >
                          {previewHeaders.map((header) => (
                            <td
                              key={header}
                              className="pr-4 py-2.5 text-neutral-800 dark:text-neutral-200 whitespace-nowrap max-w-[10rem] truncate"
                            >
                              {formatCell(item[header])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {runResults.items.length > 0 && !runResults.isDemo && paymentVerified && (
                <button
                  type="button"
                  onClick={downloadCsv}
                  className="mt-5 text-sm text-neutral-900 dark:text-neutral-100 underline underline-offset-4 hover:no-underline"
                >
                  Télécharger en CSV
                </button>
              )}

              {runResults.isDemo && !paymentVerified && (
                <div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-8">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
                      5 €
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-500">
                      paiement unique · run complet
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Aperçu de démonstration. Débloquez le run réel pour récupérer tous les
                    résultats et l’export CSV.
                  </p>
                  <button
                    type="button"
                    onClick={handlePaywallCheckout}
                    className="mt-5 flex w-full items-center justify-center px-5 py-3.5 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                  >
                    Lancer le run complet
                  </button>
                </div>
              )}

              {!runResults.isDemo && !paymentVerified && runResults.totalCount > 5 && (
                <div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-8">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
                      5 €
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-500">
                      paiement unique · tous les résultats
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Vous voyez {displayedResults.length} résultats sur {runResults.totalCount}.
                  </p>
                  <button
                    type="button"
                    onClick={handlePaywallCheckout}
                    className="mt-5 flex w-full items-center justify-center px-5 py-3.5 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                  >
                    Voir tous les résultats
                  </button>
                </div>
              )}
            </section>
          )}

          {runResults && runResults.items && runResults.items.length === 0 && (
            <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Aucun résultat trouvé.</p>
            </section>
          )}

          {tool.enrichedData?.valueProposition && (
            <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <h2 className="font-semibold text-xl tracking-tighter mb-3">
                {tool.enrichedData.valueProposition}
              </h2>
              {tool.enrichedData.expectedResults && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {tool.enrichedData.expectedResults}
                </p>
              )}
            </section>
          )}

          {(tool.enrichedData?.problem?.length > 0 || tool.enrichedData?.solution?.length > 0) && (
            <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8 space-y-8">
              {tool.enrichedData.problem?.length > 0 && (
                <div>
                  <h2 className="font-semibold text-xl tracking-tighter mb-3">Sans cet outil</h2>
                  <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {tool.enrichedData.problem.map((item, index) => (
                      <li key={index}>— {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {tool.enrichedData.solution?.length > 0 && (
                <div>
                  <h2 className="font-semibold text-xl tracking-tighter mb-3">Avec cet outil</h2>
                  <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {tool.enrichedData.solution.map((item, index) => (
                      <li key={index}>→ {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {tool.enrichedData?.useCases?.length > 0 && (
            <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <h2 className="font-semibold text-xl tracking-tighter mb-3">Cas d&apos;usage</h2>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                {tool.enrichedData.useCases.slice(0, 4).map((useCase) => (
                  <li key={useCase}>→ {useCase}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="font-semibold text-xl tracking-tighter mb-4">Livraison</h2>
            <ol className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <li>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">1.</span>{' '}
                Entrez votre input et lancez un essai gratuit (5 premiers résultats).
              </li>
              <li>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">2.</span>{' '}
                Vérifiez la structure des données.
              </li>
              <li>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">3.</span>{' '}
                Débloquez le run complet pour 5 € et exportez en CSV.
              </li>
            </ol>
          </section>

          {tool.enrichedData?.targetAudience?.length > 0 && (
            <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <h2 className="font-semibold text-xl tracking-tighter mb-3">Pour qui</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {tool.enrichedData.targetAudience.join(' · ')}
              </p>
            </section>
          )}

          <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="font-semibold text-xl tracking-tighter mb-4">Questions</h2>
            <FAQ items={faqItems} />
            <StructuredData type="FAQPage" data={{ questions: faqItems }} />
          </section>
        </div>
      </article>

      {showPaywall && !paymentVerified && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-900/50 p-4"
          onClick={() => setShowPaywall(false)}
        >
          <div
            className="w-full max-w-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
              5 €
            </p>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Accès à tous les résultats de ce run + export CSV. Paiement unique.
            </p>
            <button
              type="button"
              onClick={handlePaywallCheckout}
              className="mt-5 flex w-full items-center justify-center px-5 py-3.5 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              Payer et débloquer
            </button>
            <button
              type="button"
              onClick={() => setShowPaywall(false)}
              className="mt-3 w-full text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export async function getServerSideProps({ params }) {
  const { slug } = params

  try {
    const actors = await getAllEnrichedActors()
    let actor = actors.find(a => (a.slug || a.name) === slug)

    if (!actor) {
      return {
        props: {
          tool: null,
          notFound: true
        }
      }
    }

    // Si inputSchema n'est pas présent, le récupérer depuis l'API Apify
    if (!actor.inputSchema && actor.id && process.env.APIFY_API_TOKEN) {
      try {
        const actorId = actor.id.replace('/', '~')
        console.log(`🔍 Récupération inputSchema depuis Apify pour: ${actorId}`)
        
        const response = await fetch(`https://api.apify.com/v2/acts/${actorId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const actorData = await response.json()
          const fullActor = actorData.data || actorData
          
          console.log(`✅ inputSchema récupéré:`, {
            hasInputSchema: !!fullActor.inputSchema,
            hasDefaultRunInput: !!fullActor.defaultRunInput,
            properties: fullActor.inputSchema?.properties ? Object.keys(fullActor.inputSchema.properties) : []
          })
          
          // Enrichir l'actor avec les données de l'API
          actor = {
            ...actor,
            inputSchema: fullActor.inputSchema || actor.inputSchema,
            defaultRunInput: fullActor.defaultRunInput || actor.defaultRunInput
          }
        } else {
          console.warn(`⚠️ Erreur API Apify (${response.status}):`, await response.text())
        }
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer inputSchema depuis Apify:', error.message)
      }
    } else {
      console.log('📋 inputSchema présent dans les données:', {
        hasInputSchema: !!actor.inputSchema,
        properties: actor.inputSchema?.properties ? Object.keys(actor.inputSchema.properties) : []
      })
    }

    // Convertir en format tool
    const { apifyActorToTool } = await import('../../../lib/apify-actors')
    const toolFormatted = apifyActorToTool(actor)

    // S'assurer qu'il n'y a pas de valeurs undefined (remplacer par null)
    const sanitizedTool = JSON.parse(JSON.stringify(toolFormatted, (key, value) => {
      return value === undefined ? null : value
    }))

    return {
      props: {
        tool: sanitizedTool,
        notFound: false
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'outil:', error)
    return {
      props: {
        tool: null,
        notFound: true
      }
    }
  }
}
