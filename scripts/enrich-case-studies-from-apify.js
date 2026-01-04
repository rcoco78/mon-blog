#!/usr/bin/env node

/**
 * Script pour enrichir les cas d'usage depuis l'API Apify
 * 
 * Usage:
 *   APIFY_TOKEN=your_token node scripts/enrich-case-studies-from-apify.js
 * 
 * Ce script:
 * 1. Récupère les scrapers populaires depuis Apify
 * 2. Les regroupe par catégories
 * 3. Génère des suggestions de cas d'usage
 */

const APIFY_API_BASE = 'https://console-backend.apify.com/public/store/search'

// Mapping des catégories Apify vers nos secteurs
const categoryMapping = {
  'LEAD_GENERATION': 'Réseaux Sociaux & Lead Generation',
  'SOCIAL_MEDIA': 'Réseaux Sociaux & Lead Generation',
  'JOBS': 'Recrutement & RH',
  'ECOMMERCE': 'E-commerce',
  'REAL_ESTATE': 'Immobilier',
  'SEO_TOOLS': 'SEO & Analytics',
  'NEWS': 'Médias & Actualités',
  'VIDEOS': 'Réseaux Sociaux & Lead Generation',
  'AUTOMATION': 'Automatisation',
  'INTEGRATIONS': 'Intégrations',
  'OTHER': 'Autres'
}

async function fetchApifyScrapers(token, limit = 100, offset = 0) {
  const url = `${APIFY_API_BASE}?search=&category=&offset=${offset}&limit=${limit}&sortBy=relevance`
  
  try {
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Erreur lors de la récupération des scrapers Apify:', error)
    throw error
  }
}

function groupByCategory(scrapers) {
  const grouped = {}
  
  scrapers.forEach(scraper => {
    const categories = scraper.categories || []
    
    categories.forEach(category => {
      const sector = categoryMapping[category] || 'Autres'
      
      if (!grouped[sector]) {
        grouped[sector] = []
      }
      
      grouped[sector].push(scraper)
    })
    
    // Si pas de catégorie, mettre dans "Autres"
    if (categories.length === 0) {
      if (!grouped['Autres']) {
        grouped['Autres'] = []
      }
      grouped['Autres'].push(scraper)
    }
  })
  
  return grouped
}

function generateCaseStudySuggestion(scraper, sector) {
  // Générer un slug à partir du titre
  const slug = scraper.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  
  // Extraire les mots-clés du titre et description
  const titleWords = scraper.title
    .toLowerCase()
    .replace(/[🔥🚀✅🎉🏯🔔]/g, '')
    .split(/[\s-]+/)
    .filter(w => w.length > 3)
  
  const keywords = [
    `scraping ${titleWords[0]}`,
    `extraction ${titleWords[0]}`,
    scraper.name
  ].filter(Boolean)
  
  // Générer des exemples basés sur le titre
  const examples = extractExamples(scraper.description || scraper.title)
  
  return {
    slug: `scraping-${slug}`,
    sector: sector,
    title: `Scraping ${scraper.title.replace(/[🔥🚀✅🎉🏯🔔]/g, '').trim()}`,
    description: scraper.description || `Extraction automatique de données depuis ${scraper.title}`,
    useCase: `Récupérer toutes les données depuis ${scraper.title} pour analyse et automatisation.`,
    dataExtracted: generateDataExtracted(scraper),
    benefits: generateBenefits(scraper),
    examples: examples.length > 0 ? examples : [scraper.title],
    keywords: keywords,
    // Métadonnées Apify pour référence
    apifyActorId: scraper.id,
    apifyActorName: scraper.name,
    apifyUsername: scraper.username,
    apifyStats: scraper.stats
  }
}

function extractExamples(text) {
  const examples = []
  const commonSources = [
    'LinkedIn', 'Instagram', 'Twitter', 'Facebook', 'YouTube', 'Amazon',
    'Google', 'Indeed', 'Zillow', 'Pinterest', 'G2', 'Apollo', 'ZoomInfo',
    'Lusha', 'Doctolib', 'Safti', 'IAD', 'Century 21', 'Orpi'
  ]
  
  commonSources.forEach(source => {
    if (text.toLowerCase().includes(source.toLowerCase())) {
      examples.push(source)
    }
  })
  
  return examples.slice(0, 5)
}

function generateDataExtracted(scraper) {
  const commonData = [
    'Nom et coordonnées',
    'Description et détails',
    'Date de publication',
    'Métriques et statistiques',
    'URL et liens'
  ]
  
  // Personnaliser selon le type de scraper
  if (scraper.title.toLowerCase().includes('profile') || scraper.title.toLowerCase().includes('profil')) {
    return [
      'Nom et coordonnées complètes',
      'Poste et entreprise',
      'Expérience professionnelle',
      'Formation',
      'Compétences',
      'URL profil'
    ]
  }
  
  if (scraper.title.toLowerCase().includes('review') || scraper.title.toLowerCase().includes('avis')) {
    return [
      'Avis et notes',
      'Commentaires détaillés',
      'Auteur et date',
      'Utilité de l\'avis',
      'Produit concerné'
    ]
  }
  
  if (scraper.title.toLowerCase().includes('job') || scraper.title.toLowerCase().includes('emploi')) {
    return [
      'Titre et description du poste',
      'Entreprise et localisation',
      'Salaire et avantages',
      'Type de contrat',
      'Date de publication'
    ]
  }
  
  return commonData
}

function generateBenefits(scraper) {
  const commonBenefits = [
    'Automatisation de processus',
    'Gain de temps',
    'Analyse de données',
    'Veille concurrentielle'
  ]
  
  if (scraper.categories?.includes('LEAD_GENERATION')) {
    return [
      'Lead generation automatisée',
      'Prospection B2B ciblée',
      'Enrichissement CRM',
      'Campagnes emailing'
    ]
  }
  
  if (scraper.categories?.includes('SOCIAL_MEDIA')) {
    return [
      'Monitoring de marque',
      'Veille concurrentielle',
      'Analyse de sentiment',
      'Lead generation social media'
    ]
  }
  
  return commonBenefits
}

async function main() {
  const token = process.env.APIFY_TOKEN
  
  if (!token) {
    console.error('❌ APIFY_TOKEN non défini')
    console.log('Usage: APIFY_TOKEN=your_token node scripts/enrich-case-studies-from-apify.js')
    process.exit(1)
  }
  
  console.log('🔍 Récupération des scrapers Apify...')
  
  try {
    // Récupérer plusieurs pages de résultats
    const allScrapers = []
    const limit = 24
    let offset = 0
    let hasMore = true
    
    while (hasMore && offset < 200) { // Limiter à 200 résultats max
      const data = await fetchApifyScrapers(token, limit, offset)
      allScrapers.push(...data.items)
      
      hasMore = data.items.length === limit
      offset += limit
      
      console.log(`  ✓ Récupéré ${allScrapers.length} scrapers...`)
    }
    
    console.log(`\n✅ ${allScrapers.length} scrapers récupérés au total\n`)
    
    // Grouper par catégorie
    const grouped = groupByCategory(allScrapers)
    
    console.log('📊 Répartition par secteur:')
    Object.entries(grouped).forEach(([sector, scrapers]) => {
      console.log(`  ${sector}: ${scrapers.length} scrapers`)
    })
    
    // Générer des suggestions de cas d'usage
    console.log('\n💡 Suggestions de cas d\'usage:\n')
    
    const suggestions = []
    Object.entries(grouped).forEach(([sector, scrapers]) => {
      // Prendre les 5 plus populaires par secteur
      const topScrapers = scrapers
        .sort((a, b) => (b.stats?.totalRuns || 0) - (a.stats?.totalRuns || 0))
        .slice(0, 5)
      
      topScrapers.forEach(scraper => {
        const suggestion = generateCaseStudySuggestion(scraper, sector)
        suggestions.push(suggestion)
      })
    })
    
    // Afficher les suggestions
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.title}`)
      console.log(`   Secteur: ${suggestion.sector}`)
      console.log(`   Slug: ${suggestion.slug}`)
      console.log(`   Apify: ${suggestion.apifyUsername}/${suggestion.apifyActorName}`)
      console.log(`   Runs: ${suggestion.apifyStats?.totalRuns || 0}`)
      console.log('')
    })
    
    // Générer un fichier JSON avec les suggestions
    const fs = require('fs')
    const path = require('path')
    const outputPath = path.join(__dirname, '../lib/case-studies-suggestions.json')
    
    fs.writeFileSync(
      outputPath,
      JSON.stringify(suggestions, null, 2),
      'utf-8'
    )
    
    console.log(`\n✅ Suggestions sauvegardées dans: ${outputPath}`)
    console.log(`\n📝 Pour ajouter ces cas d'usage, copiez-les dans lib/case-studies.js`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { fetchApifyScrapers, groupByCategory, generateCaseStudySuggestion }

