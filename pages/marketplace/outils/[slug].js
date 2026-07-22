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
import Breadcrumb from '../../../components/Breadcrumb'
import { getAllEnrichedActors } from '../../../lib/apify-actors-enriched'

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
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-semibold mb-4">Outil non trouvé</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Cet outil n'existe pas ou a été supprimé.
        </p>
        <Link href="/marketplace" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Retour à la marketplace
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
  
  // Déterminer combien de résultats afficher
  const displayedResults = runResults?.items 
    ? (paymentVerified ? runResults.items : runResults.items.slice(0, 5))
    : []

  const pageSEO = generatePageSEO({
    title: `${tool.name} | Outil de scraping`,
    description: tool.description || `Utilisez ${tool.name} pour collecter des données automatiquement.`,
    path: `/marketplace/outils/${tool.slug}`,
    keywords: ['scraping', 'automatisation', 'données', tool.name]
  })

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
            price: '0',
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock'
          },
          url: `${siteConfig.url}/marketplace/outils/${tool.slug}`
        }}
      />
      
      <Breadcrumb
        items={[
          { label: 'Marketplace', href: '/marketplace' },
          { label: 'Outils', href: '/marketplace?tab=tools' },
          { label: tool.name }
        ]}
      />

      <main className="min-w-0 mt-6 flex flex-col">
        {/* En-tête simplifié et centré */}
        <div className="mb-12 text-center">
          <h1 className="font-semibold text-3xl mb-4 tracking-tighter">
            {tool.name}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 max-w-2xl mx-auto">
            Scraper public sur Apify — tu utilises mon API. Entre ton input, lance le run, débloque les résultats.
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg max-w-2xl mx-auto">
            {tool.description}
          </p>
          {tool.apifyUrl || tool.url ? (
            <p className="mt-3 text-sm">
              <a
                href={tool.apifyUrl || tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-neutral-900 dark:hover:text-neutral-100 text-neutral-600 dark:text-neutral-400"
              >
                Voir sur Apify
              </a>
            </p>
          ) : null}
        </div>

        {/* Section principale : Grande barre de recherche centrale */}
        <section className="mb-12">
          <div className="max-w-3xl mx-auto">
            {/* Barre de recherche principale */}
            <div className="relative mb-6">
              <input
                type="text"
                value={mainInput}
                onChange={(e) => setMainInput(e.target.value)}
                placeholder={mainInputField?.placeholder || 'Rechercher...'}
                disabled={isRunning}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isRunning && mainInput.trim()) {
                    handleRun(true)
                  }
                }}
                className="w-full px-6 py-4 text-lg border-2 border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-neutral-900 dark:focus:border-white disabled:opacity-50 transition-all"
              />
              <button
                onClick={() => handleRun(true)}
                disabled={isRunning || !mainInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {isRunning ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Popular Searches */}
            {(() => {
              // Générer des exemples de recherches populaires basés sur le type d'outil
              const getPopularSearches = () => {
                const actorName = tool?.name?.toLowerCase() || ''
                if (actorName.includes('airbnb') && actorName.includes('host')) {
                  return ['Paris', 'Lyon', 'Marseille', 'Nice', 'Bordeaux']
                } else if (actorName.includes('airbnb') && actorName.includes('property')) {
                  return ['Paris', 'Lyon', 'Marseille', 'Nice', 'Bordeaux']
                } else if (actorName.includes('airbnb') && actorName.includes('review')) {
                  return ['https://www.airbnb.com/rooms/123456', 'https://www.airbnb.com/rooms/789012']
                } else if (actorName.includes('immobilier')) {
                  return ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nantes']
                } else {
                  // Exemples génériques basés sur le placeholder
                  const placeholder = mainInputField?.placeholder || ''
                  if (placeholder.toLowerCase().includes('ville') || placeholder.toLowerCase().includes('city')) {
                    return ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nantes']
                  } else if (placeholder.toLowerCase().includes('url')) {
                    return ['https://example.com', 'https://example.org']
                  } else {
                    return ['Exemple 1', 'Exemple 2', 'Exemple 3']
                  }
                }
              }
              
              const popularSearches = getPopularSearches()
              
              return popularSearches.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wide mb-3 text-center">
                    Recherches populaires
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {popularSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setMainInput(search)
                          if (search.trim()) {
                            handleRun(true)
                          }
                        }}
                        className="px-4 py-2 text-sm rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null
            })()}
            
            {/* Message discret sur le mode démo */}
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-6 text-center">
              Mode démonstration • Les résultats affichés sont des exemples
            </p>
          </div>
        </section>

        {/* Résultats */}
        {runResults && runResults.items && runResults.items.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-neutral-600 dark:text-neutral-400">
                {displayedResults.length} résultat{displayedResults.length > 1 ? 's' : ''}{!paymentVerified && runResults.items.length > 5 ? ` sur ${runResults.items.length}` : ''}
              </h2>
              {runResults.items.length > 0 && !runResults.isDemo && (
                <button
                  onClick={() => {
                    // Convertir en CSV et télécharger
                    const headers = getHeaders()
                    const csvRows = []
                    
                    // Headers
                    if (headers.length > 0) {
                      csvRows.push(headers.join(','))
                    }
                    
                    // Data
                    displayedResults.forEach(item => {
                      if (headers.length > 0) {
                        const row = headers.map(header => {
                          const value = item[header]
                          return value !== null && value !== undefined 
                            ? `"${String(value).replace(/"/g, '""')}"` 
                            : ''
                        })
                        csvRows.push(row.join(','))
                      }
                    })
                    
                    const csvContent = csvRows.join('\n')
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                    const link = document.createElement('a')
                    const url = URL.createObjectURL(blob)
                    link.setAttribute('href', url)
                    link.setAttribute('download', `${tool.slug}-results.csv`)
                    link.style.visibility = 'hidden'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                  className="text-sm px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  📥 Télécharger CSV
                </button>
              )}
            </div>

            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                    {headers.map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300"
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
                      className="border-b border-neutral-100 dark:border-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                    >
                      {headers.map((header) => {
                        const value = item[header]
                        return (
                          <td
                            key={header}
                            className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400"
                          >
                            {value !== null && value !== undefined ? (
                              typeof value === 'object' ? (
                                <pre className="text-xs bg-neutral-100 dark:bg-neutral-800 p-2 rounded overflow-x-auto max-w-xs">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              ) : (
                                String(value)
                              )
                            ) : (
                              <span className="text-neutral-400">-</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Message pour la démo ou paywall pour les vrais résultats */}
            {runResults.isDemo ? (
              <div className="mt-8 text-center">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Vous avez vu un aperçu de démonstration. Les données affichées sont des exemples.
                </p>
                <button
                  onClick={() => setShowPaywall(true)}
                  className="px-8 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors font-medium"
                >
                  Lancer l'outil réel (5€)
                </button>
              </div>
            ) : !paymentVerified && runResults.items.length > 5 ? (
              <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-center">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  Vous voyez {displayedResults.length} résultats sur {runResults.items.length} au total.
                </p>
                <button
                  onClick={() => setShowPaywall(true)}
                  className="px-6 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors font-medium"
                >
                  Voir tous les résultats (5€)
                </button>
              </div>
            ) : null}
          </section>
        )}

        {/* Message si aucun résultat */}
        {runResults && runResults.items && runResults.items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-600 dark:text-neutral-400">
              Aucun résultat trouvé.
            </p>
          </div>
        )}

        {/* TUNNEL DE VENTE - Sections marketing */}
        {tool.enrichedData && (
          <>
            {/* Proposition de valeur */}
            {tool.enrichedData.valueProposition && (
              <section className="mb-16 border-t border-neutral-200 dark:border-neutral-800 pt-8">
                <h2 className="font-semibold text-xl mb-4 tracking-tighter">
                  {tool.enrichedData.valueProposition}
                </h2>
                {tool.enrichedData.expectedResults && (
                  <p className="text-neutral-600 dark:text-neutral-400 tracking-tight">
                    {tool.enrichedData.expectedResults}
                  </p>
                )}
              </section>
            )}

            {/* Problèmes / Solutions */}
            {(tool.enrichedData.problem?.length > 0 || tool.enrichedData.solution?.length > 0) && (
              <section className="mb-16 border-t border-neutral-200 dark:border-neutral-800 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                  {/* Colonne Problème */}
                  {tool.enrichedData.problem?.length > 0 && (
                    <div>
                      <h2 className="font-semibold text-xl mb-6 tracking-tighter">Problème ?</h2>
                      <ul className="space-y-3">
                        {tool.enrichedData.problem.map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0">×</span>
                            <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
          
                  {/* Colonne Solution */}
                  {tool.enrichedData.solution?.length > 0 && (
                    <div>
                      <h2 className="font-semibold text-xl mb-6 tracking-tighter">La solution</h2>
                      <ul className="space-y-3">
                        {tool.enrichedData.solution.map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0">✓</span>
                            <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Cas d'usage */}
            {tool.enrichedData.useCases?.length > 0 && (
              <section className="mb-16 border-t border-neutral-200 dark:border-neutral-800 pt-8">
                <h2 className="font-semibold text-xl mb-6 tracking-tighter">Comment utiliser cet outil ?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tool.enrichedData.useCases.slice(0, 4).map((useCase, index) => (
                    <div key={index} className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                      <h3 className="font-semibold text-lg mb-3 tracking-tighter">{useCase}</h3>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                        Utilisez cet outil pour {useCase.toLowerCase()}. Les résultats sont prêts à l'emploi et peuvent être exportés directement.
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* À qui s'adresse cet outil */}
            {tool.enrichedData.targetAudience?.length > 0 && (
              <section className="mb-16 border-t border-neutral-200 dark:border-neutral-800 pt-8">
                <h2 className="font-semibold text-xl mb-6 tracking-tighter">
                  À qui s'adresse cet outil ?
                </h2>
                <div className="flex flex-wrap gap-3">
                  {tool.enrichedData.targetAudience.map((audience, index) => (
                    <span key={index} className="px-3 py-1.5 rounded-md text-sm bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                      {audience}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Comment ça marche */}
            <section className="mb-16 border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <h2 className="font-semibold text-xl mb-6 tracking-tighter">
                Comment ça marche ?
              </h2>
              <div className="relative pl-4 sm:pl-6">
                {/* Ligne verticale en pointillés */}
                <div className="absolute left-0 top-0 bottom-0 w-[1px]" style={{ background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 4px, rgb(212 212 212) 4px, rgb(212 212 212) 8px)' }}></div>
                <div className="absolute left-0 top-0 bottom-0 w-[1px] hidden dark:block" style={{ background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 4px, rgb(64 64 64) 4px, rgb(64 64 64) 8px)' }}></div>
                <div className="space-y-6">
                  {/* Étape 1 : Tester gratuitement */}
                  <div className="relative flex flex-col sm:flex-row sm:gap-4">
                    {/* Point sur la ligne */}
                    <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100 border-2 border-white dark:border-neutral-900 z-10"></div>
                    <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2 sm:mb-0 pl-0 sm:pl-4">
                      <div>Étape 1</div>
                    </div>
                    <div className="flex-1 min-w-0 pl-0 sm:pl-4">
                      <h3 className="font-semibold text-lg mb-1 tracking-tighter text-neutral-900 dark:text-neutral-100">Testez gratuitement</h3>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                        Utilisez la barre de recherche ci-dessus pour lancer une recherche. Vous obtiendrez les <strong className="text-neutral-900 dark:text-neutral-100">5 premiers résultats gratuitement</strong> pour évaluer la qualité des données.
                      </p>
                    </div>
                  </div>

                  {/* Étape 2 : Voir les résultats */}
                  <div className="relative flex flex-col sm:flex-row sm:gap-4">
                    {/* Point sur la ligne */}
                    <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100 border-2 border-white dark:border-neutral-900 z-10"></div>
                    <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2 sm:mb-0 pl-0 sm:pl-4">
                      <div>Étape 2</div>
                    </div>
                    <div className="flex-1 min-w-0 pl-0 sm:pl-4">
                      <h3 className="font-semibold text-lg mb-1 tracking-tighter text-neutral-900 dark:text-neutral-100">Consultez les résultats</h3>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                        Les résultats s'affichent dans un tableau. Vous pouvez voir la structure des données et vérifier qu'elles correspondent à vos besoins avant de payer.
                      </p>
                    </div>
                  </div>

                  {/* Étape 3 : Payer pour accéder à toutes les données */}
                  <div className="relative flex flex-col sm:flex-row sm:gap-4">
                    {/* Point sur la ligne - vert pour étape importante */}
                    <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-green-500 border-2 border-white dark:border-neutral-900 z-10"></div>
                    <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2 sm:mb-0 pl-0 sm:pl-4">
                      <div>Étape 3</div>
                    </div>
                    <div className="flex-1 min-w-0 pl-0 sm:pl-4">
                      <h3 className="font-semibold text-lg mb-1 tracking-tighter text-neutral-900 dark:text-neutral-100">Accédez à toutes les données</h3>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                        Pour accéder à <strong className="text-neutral-900 dark:text-neutral-100">tous les résultats</strong> (au-delà des 5 premiers), effectuez un paiement unique de <strong className="text-neutral-900 dark:text-neutral-100">5€</strong>. Vous pourrez ensuite télécharger l'ensemble des données en CSV.
                      </p>
                    </div>
                  </div>

                  {/* Étape 4 : Télécharger et utiliser */}
                  <div className="relative flex flex-col sm:flex-row sm:gap-4">
                    {/* Point sur la ligne */}
                    <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100 border-2 border-white dark:border-neutral-900 z-10"></div>
                    <div className="w-full sm:w-28 sm:flex-shrink-0 text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2 sm:mb-0 pl-0 sm:pl-4">
                      <div>Étape 4</div>
                    </div>
                    <div className="flex-1 min-w-0 pl-0 sm:pl-4">
                      <h3 className="font-semibold text-lg mb-1 tracking-tighter text-neutral-900 dark:text-neutral-100">Téléchargez et utilisez</h3>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                        Une fois le paiement effectué, téléchargez le fichier CSV complet et importez-le dans votre CRM, outil de prospection ou tableur pour commencer à utiliser les données.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Objections / Réponses */}
            {tool.enrichedData.objections?.length > 0 && tool.enrichedData.objectionsAnswers?.length > 0 && (
              <section className="mb-16 border-t border-neutral-200 dark:border-neutral-800 pt-8">
                <h2 className="font-semibold text-xl mb-6 tracking-tighter">
                  Questions fréquentes
                </h2>
                <FAQ 
                  items={tool.enrichedData.objections.map((objection, index) => ({
                    question: objection,
                    answer: tool.enrichedData.objectionsAnswers[index] || ''
                  }))} 
                />
                <StructuredData
                  type="FAQPage"
                  data={{
                    questions: tool.enrichedData.objections.map((objection, index) => ({
                      '@type': 'Question',
                      name: objection,
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: tool.enrichedData.objectionsAnswers[index] || ''
                      }
                    }))
                  }}
                />
              </section>
            )}
          </>
        )}
      </main>

      {/* Popup Paywall */}
      {showPaywall && !paymentVerified && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-md w-full p-6">
            <h3 className="font-semibold text-xl mb-4">
              Accéder à tous les résultats
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Pour accéder à tous les {runResults?.items?.length || 0} résultats, effectuez un paiement unique de 5€.
            </p>
            <form
              action="/api/tools/create-checkout"
              method="POST"
              className="space-y-4"
            >
              <input type="hidden" name="toolId" value={tool.slug} />
              <input type="hidden" name="subscriptionType" value="one-time" />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaywall(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors font-medium"
                >
                  Payer 5€
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={hideToast} />
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
