/**
 * Script d'enrichissement des Google Sheets avec GPT-4o mini
 * 
 * Ce script :
 * 1. Scanne les Google Sheets dans le Drive
 * 2. Analyse le contenu de chaque Sheet
 * 3. Utilise GPT-4o mini pour enrichir avec des recherches web
 * 4. Génère des descriptions, cas d'usage, problèmes/solutions
 * 5. Sauvegarde les métadonnées enrichies
 * 
 * Usage:
 *   node scripts/enrich-marketplace-sheets.js
 *   node scripts/enrich-marketplace-sheets.js --sheet-id=ABC123
 *   node scripts/enrich-marketplace-sheets.js --all
 */

// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const { google } = require('googleapis')
const fs = require('fs').promises
const path = require('path')
const OpenAI = require('openai')

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'service-account-key.json')
const DATABASES_FILE = path.join(__dirname, '..', 'data', 'marketplace-databases.json')

// Couleurs
const green = (text) => `\x1b[32m${text}\x1b[0m`
const yellow = (text) => `\x1b[33m${text}\x1b[0m`
const blue = (text) => `\x1b[36m${text}\x1b[0m`
const red = (text) => `\x1b[31m${text}\x1b[0m`
const cyan = (text) => `\x1b[36m${text}\x1b[0m`

// Parse arguments
const args = process.argv.slice(2)
const sheetIdArg = args.find(arg => arg.startsWith('--sheet-id='))
const sheetId = sheetIdArg ? sheetIdArg.split('=')[1] : null
const allSheets = args.includes('--all')
const limitArg = args.find(arg => arg.startsWith('--limit='))
const limit = limitArg ? (() => {
  const value = parseInt(limitArg.split('=')[1], 10)
  return isNaN(value) ? null : value
})() : null

// Initialiser OpenAI
let openai = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
} else {
  console.log(yellow('⚠️  OPENAI_API_KEY non définie. L\'enrichissement GPT sera désactivé.'))
}

// Authentification Google
async function getAuth() {
  let serviceAccount = null
  
  // Option 1: Lire depuis variable d'environnement (pour Vercel)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
      console.log(cyan('  ✓ Service Account chargé depuis variable d\'environnement'))
    } catch (error) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY invalide (doit être un JSON valide)')
    }
  }
  // Option 2: Lire depuis fichier (pour développement local)
  else if (await fileExists(SERVICE_ACCOUNT_PATH)) {
    serviceAccount = JSON.parse(await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf8'))
    console.log(cyan('  ✓ Service Account chargé depuis fichier'))
  } else {
    throw new Error('Service Account non trouvé. Configurez GOOGLE_SERVICE_ACCOUNT_KEY (Vercel) ou service-account-key.json (local)')
  }
  
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly'
    ]
  })
  return await auth.getClient()
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

// Analyser un Google Sheet
async function analyzeSheet(sheets, sheetId) {
  try {
    // Obtenir les métadonnées
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      includeGridData: false
    })
    
    const spreadsheet = metadata.data
    const sheetName = spreadsheet.properties?.title || 'Sans nom'
    
    // Obtenir les en-têtes
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: '1:1'
    })
    const headers = headersResponse.data.values?.[0] || []
    
    // Obtenir un échantillon de données (premières 10 lignes)
    const sampleResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `2:11` // Lignes 2 à 11 (skip header)
    })
    const sampleRows = sampleResponse.data.values || []
    
    // Obtenir plus de données pour l'analyse statistique (jusqu'à 1000 lignes)
    const maxRowsForAnalysis = Math.min(1000, 1000)
    const analysisResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `2:${maxRowsForAnalysis + 1}`
    })
    const analysisRows = analysisResponse.data.values || []
    
    // Compter les lignes
    const countResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:A'
    })
    const rowCount = (countResponse.data.values?.length || 1) - 1
    
    return {
      sheetId,
      name: sheetName,
      headers,
      rowCount,
      sampleRows,
      analysisRows, // Pour les statistiques
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`
    }
  } catch (error) {
    console.error(red(`Erreur analyse sheet ${sheetId}:`), error.message)
    return null
  }
}

// Enrichir avec GPT-4o mini
async function enrichWithGPT(sheetData) {
  if (!openai) {
    console.log(yellow('⚠️  GPT désactivé, utilisation de données par défaut'))
    return getDefaultEnrichment(sheetData)
  }
  
  console.log(cyan(`\n🤖 Enrichissement avec GPT-4o mini...`))
  
  try {
    // Traduire les headers en français avec GPT
    console.log(cyan('  📝 Traduction des colonnes en français...'))
    const headersFR = await translateHeadersWithGPT(sheetData.headers, openai)
    
    // Analyser les colonnes pour comprendre le type de données
    const columnAnalysis = analyzeColumns(sheetData.headers, sheetData.sampleRows)
    
    // Préparer le contexte enrichi
    const context = `
Tu es un expert en analyse de données B2B et SEO. Analyse cette base de données Google Sheet pour créer une page marketplace optimisée.

## Informations de base
Nom du Sheet: ${sheetData.name}
Nombre de lignes: ${sheetData.rowCount.toLocaleString()}
Colonnes (${sheetData.headers.length}): ${sheetData.headers.join(', ')}

## Analyse des colonnes
${columnAnalysis}

## Échantillon de données RÉELLES (premières 10 lignes)
Ces données sont les VRAIES données de la base. Utilise-les pour générer sampleData.
Headers originaux: ${JSON.stringify(sheetData.headers)}
Headers traduits: ${JSON.stringify(headersFR)}
Données brutes (lignes 2 à 11, skip header):
${JSON.stringify(sheetData.sampleRows.slice(0, 10), null, 2)}

## Instructions pour sampleData
- Prends les 3 PREMIÈRES lignes de l'échantillon ci-dessus
- Crée un objet JSON pour chaque ligne
- Utilise les headers traduits (headersFR) comme clés
- Mappe chaque valeur de la ligne avec le header correspondant (même index)
- Si une valeur manque, utilise ""
- Format final : [{"header1": "valeur ligne 1", ...}, {"header1": "valeur ligne 2", ...}, {"header1": "valeur ligne 3", ...}]

## Données pour analyse statistique (jusqu'à 1000 lignes)
${JSON.stringify(sheetData.analysisRows?.slice(0, 100) || [], null, 2)}

## Instructions spéciales pour la FAQ
- Analyse les colonnes réelles pour poser des questions sur leur contenu
- Si tu vois des colonnes spécifiques (ex: "isRGE", "speciality", "price"), pose des questions dessus
- Si tu vois des patterns dans les données (ex: beaucoup de produits e-commerce), pose des questions sur ces patterns
- Pose des questions qui montrent que tu as compris le secteur et le type de données
- Évite les questions génériques type "Comment utiliser ?" - sois plus spécifique
- Exemples de bonnes questions :
  * Pour CAPEB : "Quelles typologies d'artisans sont incluses ?", "Comment identifier les artisans certifiés RGE ?"
  * Pour e-commerce : "Les prix incluent-ils la TVA ?", "Comment filtrer par catégorie de produits ?"
  * Pour B2B : "Les emails sont-ils vérifiés ?", "Puis-je filtrer par région géographique ?"

## Tâches détaillées

### 1. Recherche et compréhension de l'entreprise (CRITIQUE)
- Si le nom contient un nom d'entreprise/domaine (ex: "Ichard.fr", "Amazon", "Leroy Merlin", etc.), utilise tes connaissances pour identifier cette entreprise
- Exemple : "Ichard.fr" = site e-commerce français spécialisé en bricolage, jardinage, outillage, quincaillerie
- **EXEMPLES SPÉCIFIQUES SECTEUR IMMOBILIER :**
  * "Safti" = réseau d'agences immobilières en France → catégorie "Immobilier"
  * "IAD" = réseau d'agences immobilières en France (IAD France) → catégorie "Immobilier"
  * Si le nom contient "immobilier", "agence immobilière", "notaire", "bien immobilier" → catégorie "Immobilier"
  * Si les colonnes contiennent "prix", "surface", "chambres", "ville", "code postal", "type bien" → probablement "Immobilier"
- Comprends le secteur d'activité, le type de business, la taille, le positionnement marché
- Identifie le type de données selon l'entreprise : 
  * Si e-commerce → données produits (prix, catégories, disponibilité, etc.)
  * Si immobilier → biens immobiliers, agences, notaires, transactions immobilières → catégorie "Immobilier"
  * Si B2B → contacts, entreprises, coordonnées (mais PAS si c'est immobilier)
  * Si services → données de prestations, tarifs, etc.
- IMPORTANT : Adapte toute ton analyse selon l'entreprise identifiée. Si c'est immobilier, utilise TOUJOURS la catégorie "Immobilier" et non "B2B"

### 2. Analyse approfondie des données
- Analyse les colonnes pour comprendre EXACTEMENT ce que contient la base
- Identifie les champs clés et leur utilité
- Comprends le type de données : produits, contacts, transactions, etc.
- Détermine la valeur business de ces données

### 3. Description SEO optimisée (200-250 mots)
- Décris PRÉCISÉMENT ce que contient la base de données
- Explique la valeur business concrète
- Mentionne les cas d'usage réels
- Inclut des mots-clés SEO naturels
- Sois spécifique : ne dis pas juste "base de données", dis "base de données produits e-commerce Ichard.fr avec prix, disponibilité, catégories..."

### 3b. Description courte (80-120 mots, 2-3 phrases) - CRITIQUE
Génère une description courte mais ÉTOFFÉE avec contexte et utilité concrète.

Structure obligatoire :
1. **1ère phrase (30-40 mots)** : Présentation complète
   - Nombre d'entrées + type de données + source/entreprise
   - Mentionne les champs clés (3-4 colonnes principales)
   - Exemple : "Base de données complète de 1 805 produits e-commerce Ichard.fr spécialisés dans les accessoires automobiles Renault 4CV, incluant prix, disponibilité en stock, descriptions détaillées et métadonnées SEO."

2. **2ème phrase (30-40 mots)** : Contexte et utilité
   - À quoi ça sert concrètement
   - Pour qui (professionnels, entreprises, etc.)
   - Exemple : "Idéale pour les professionnels souhaitant analyser les tendances de marché, surveiller la concurrence ou optimiser leur stratégie de pricing dans le secteur automobile."

3. **3ème phrase (20-30 mots, optionnelle)** : Cas d'usage ou valeur ajoutée
   - Un cas d'usage spécifique
   - Ou une valeur ajoutée unique
   - Exemple : "Les données sont structurées et prêtes à l'emploi pour vos outils d'analyse ou de prospection."

IMPORTANT :
- Ne sois PAS trop court ou générique
- Ajoute du contexte sur l'entreprise/secteur si disponible
- Mentionne l'utilité concrète, pas juste "base de données"
- Sois informatif et actionnable

### 4. Problèmes résolus (3-5 points)
- Identifie les VRAIS problèmes que cette base résout
- Sois spécifique au type de données
- Exemples : "Difficulté à monitorer les prix des produits concurrents" (si données produits), "Manque de données structurées pour analyse de marché" (si données business)

### 5. Solutions apportées (3-5 points)
- Décris les VRAIES solutions apportées par cette base
- Sois concret : "1 805 produits avec 21 champs par produit incluant prix, disponibilité, catégories, images..."
- Mentionne les formats disponibles, la fraîcheur des données, etc.

### 6. Cas d'usage concrets (4-6 points)
- Génère des cas d'usage RÉELS et SPÉCIFIQUES
- Adapte aux données : si produits e-commerce → "Analyse de prix concurrents", "Monitoring de disponibilité produits", etc.
- Si contacts B2B → "Prospection ciblée", "Enrichissement CRM", etc.
- Sois précis et actionnable

### 7. Mots-clés SEO (10-15 mots-clés)
- Génère des mots-clés pertinents et spécifiques
- Inclut des long-tail keywords
- Adapte au secteur et au type de données

### 8. Catégorie
- Choisis parmi : Finance, Artisanat, E-commerce, Retail, B2B, Services, Immobilier, etc.
- **RÈGLES STRICTES pour la catégorie :**
  * Si le nom contient "Safti", "IAD", "immobilier", "agence immobilière", "notaire" → catégorie "Immobilier"
  * Si les colonnes contiennent "prix", "surface", "chambres", "ville", "code postal", "type bien", "bien immobilier" → catégorie "Immobilier"
  * Si c'est un réseau d'agences immobilières → catégorie "Immobilier" (PAS "B2B")
  * Si c'est des contacts d'entreprises mais dans le secteur immobilier → catégorie "Immobilier"
  * "B2B" est pour les contacts d'entreprises génériques, PAS pour l'immobilier
- Sois précis selon le secteur réel. Ne confonds PAS "Immobilier" avec "B2B"

### 8b. Slug SEO-optimisé (CRITIQUE)
Génère un slug URL-friendly et optimisé SEO avec des mots-clés pertinents.

RÈGLES STRICTES :
1. Format : minuscules, tirets comme séparateurs, max 60 caractères
2. Structure : [nom-principal]-[mots-cles-categorie]-base-donnees
3. Inclure des mots-clés recherchés selon la catégorie :
   - Artisanat → "artisans", "rge", "batiment", "france"
   - E-commerce → "produits", "ecommerce", "catalogue"
   - Finance → "cgp", "conseil-gestion-patrimoine", "france"
   - Immobilier → "agences-immobilieres", "biens-immobiliers", "france", "notaires"
   - B2B → "contacts", "entreprises", "prospection"
4. Inclure "base-donnees" sauf si déjà dans le nom
5. Exemples :
   - "Capeb 2026" → "base-donnees-artisans-capeb-france" (pas "capeb-2026")
   - "CGP France" → "base-donnees-cgp-conseil-gestion-patrimoine-france"
   - "Ichard.fr" → "base-donnees-produits-ichard-fr-ecommerce"
6. Éviter les dates (2026, 2025) sauf si vraiment pertinent
7. Prioriser les mots-clés recherchés par les utilisateurs

### 9. Prix
- Suggère un prix raisonnable selon :
  - Le nombre de lignes
  - Le type de données (données produits e-commerce vs contacts B2B)
  - La valeur business
  - Le marché

### 10. Statistiques et métriques (NOUVEAU)
Analyse les données pour générer des statistiques pertinentes :
- Si données géographiques (ville, code postal, latitude/longitude) → statistiques géographiques (top villes, répartition régionale)
- Si données catégories → top catégories, répartition
- Si données prix → fourchette de prix, prix moyen
- Si données dates → période couverte, fraîcheur
- Taux de complétude des données (colonnes remplies vs vides)

### 11. Exemples de données (CRITIQUE - NOUVEAU)
Génère EXACTEMENT les 3 premières lignes réelles de la base de données, basées sur l'échantillon fourni.

RÈGLES STRICTES :
1. Utilise les données RÉELLES de l'échantillon (sampleRows) fourni
2. Génère EXACTEMENT 3 lignes (les 3 premières lignes de données)
3. Chaque ligne doit être un objet JSON avec les colonnes comme clés
4. Utilise les headers traduits en français (headersFR) comme clés des objets
5. Les valeurs doivent être EXACTEMENT celles des données réelles (pas d'invention)
6. Si une valeur est manquante dans les données réelles, utilise une chaîne vide ""
7. Format : [{"header1": "valeur réelle 1", "header2": "valeur réelle 2", ...}, ...]

IMPORTANT : Ne génère PAS de données fictives. Utilise UNIQUEMENT les données réelles de l'échantillon fourni.

### 12. Témoignages générés (NOUVEAU)
Génère 2-3 témoignages clients fictifs mais réalistes avec :
- Nom et rôle
- Commentaire spécifique au type de données
- Date récente
- Tags pertinents

### 13. FAQ enrichie (CRITIQUE - NOUVEAU)
Génère 7-10 questions/réponses TRÈS SPÉCIFIQUES au type de données, au secteur et au contenu réel.

RÈGLES STRICTES :
1. Analyse les colonnes réelles pour poser des questions dessus
2. Si tu vois des colonnes spécifiques (ex: "isRGE", "speciality", "price", "category"), pose des questions dessus
3. Si tu vois des patterns dans les données (ex: beaucoup de produits e-commerce), pose des questions sur ces patterns
4. Pose des questions qui montrent que tu as compris le secteur et le type de données
5. Évite les questions génériques type "Comment utiliser ?" - sois plus spécifique

EXEMPLES DE BONNES QUESTIONS selon le type :
- Pour CAPEB/Artisanat : 
  * "Quelles typologies d'artisans sont incluses dans la base ?"
  * "Comment identifier les artisans certifiés RGE ?"
  * "Les coordonnées géographiques (latitude/longitude) sont-elles incluses ?"
  * "Puis-je filtrer par région ou département ?"
  
- Pour e-commerce/Produits :
  * "Les prix incluent-ils la TVA ?"
  * "Comment filtrer par catégorie de produits ?"
  * "Les images produits sont-elles incluses ?"
  * "Les métadonnées SEO (metaTitle, metaDescription) sont-elles présentes ?"
  
- Pour Immobilier/Agences immobilières :
  * "Quelles agences immobilières sont incluses dans la base ?"
  * "Les coordonnées complètes (adresse, téléphone, email) sont-elles présentes ?"
  * "Puis-je filtrer par région ou département ?"
  * "Les données incluent-elles les informations sur les biens immobiliers ?"
  * "Les agences sont-elles certifiées ou membres d'un réseau spécifique ?"
  
- Pour B2B/Contacts (génériques, PAS immobilier) :
  * "Les emails sont-ils vérifiés et valides ?"
  * "Puis-je filtrer par secteur d'activité ?"
  * "Les numéros SIRET sont-ils inclus ?"
  * "Les coordonnées sont-elles complètes (téléphone, email, adresse) ?"

- Questions techniques :
  * "Quel format de fichier puis-je exporter ?"
  * "Puis-je importer directement dans [CRM populaire] ?"
  * "Les données sont-elles compatibles avec Excel ?"
  
- Questions sur la valeur :
  * "Pourquoi cette base vaut-elle [prix]€ ?"
  * "Combien de temps faudrait-il pour collecter ces données manuellement ?"
  
- Questions sur la fraîcheur :
  * "À quelle fréquence les données sont-elles mises à jour ?"
  * "Les données sont-elles actuelles pour [année] ?"

IMPORTANT : Chaque question doit être UNIQUE et montrer une compréhension approfondie du contenu réel de la base. Les réponses doivent être détaillées, précises et actionnables.

Réponds UNIQUEMENT en JSON avec cette structure exacte:
{
  "description": "Description SEO optimisée de 200-250 mots, très précise sur le contenu réel (pour meta description)",
  "shortDescription": "Description courte de 80-120 mots (2-3 phrases) avec contexte et utilité. 1ère phrase : présentation (nombre, type, source). 2ème phrase : contexte et utilité (à quoi ça sert, pour qui). 3ème phrase (optionnelle) : cas d'usage ou valeur ajoutée.",
  "category": "E-commerce|Finance|Artisanat|...",
  "slug": "slug-seo-optimise-avec-mots-cles-pertinents",
  "price": 99,
  "isPaid": true,
  "companyInfo": "Informations détaillées sur l'entreprise/secteur si le nom contient un nom d'entreprise. Sinon, description du type de données.",
  "problem": ["Problème spécifique 1", "Problème spécifique 2", "Problème spécifique 3"],
  "solution": ["Solution concrète 1", "Solution concrète 2", "Solution concrète 3"],
  "useCases": ["Cas d'usage spécifique 1", "Cas d'usage spécifique 2", "Cas d'usage spécifique 3", "Cas d'usage spécifique 4"],
  "keywords": ["mot-clé spécifique 1", "mot-clé spécifique 2", "long-tail keyword 1", ...],
  "statistics": {
    "geographic": {"topCities": ["Ville 1", "Ville 2"], "regions": "Régions couvertes"},
    "categories": {"topCategories": ["Cat 1", "Cat 2"], "distribution": "Répartition"},
    "pricing": {"min": 0, "max": 0, "average": 0},
    "completeness": "Taux de complétude estimé"
  },
  "sampleData": [
    {"header1": "valeur réelle ligne 1", "header2": "valeur réelle ligne 1", ...},
    {"header1": "valeur réelle ligne 2", "header2": "valeur réelle ligne 2", ...},
    {"header1": "valeur réelle ligne 3", "header2": "valeur réelle ligne 3", ...}
  ]
  "testimonials": [
    {"name": "Prénom N.", "role": "Rôle", "comment": "Commentaire réaliste", "date": "01-01-2026", "tags": "Tag1 • Tag2"},
    {"name": "Prénom N.", "role": "Rôle", "comment": "Commentaire réaliste", "date": "01-01-2026", "tags": "Tag1 • Tag2"}
  ],
  "faq": [
    {"question": "Question TRÈS spécifique sur le contenu réel (ex: colonnes spécifiques, types de données)", "answer": "Réponse détaillée qui cite des exemples concrets de la base"},
    {"question": "Question sur l'utilisation concrète avec les colonnes réelles", "answer": "Réponse actionnable qui explique comment utiliser les colonnes spécifiques"},
    {"question": "Question technique sur une colonne ou format particulier", "answer": "Réponse technique précise avec détails"},
    {"question": "Question sur la valeur et le prix justifié par le contenu", "answer": "Réponse qui justifie la valeur en citant le nombre d'entrées, colonnes, qualité"},
    {"question": "Question sur la fraîcheur et mise à jour", "answer": "Réponse sur la maintenance et la date de dernière mise à jour"},
    {"question": "Question sur un cas d'usage spécifique au secteur", "answer": "Réponse avec exemples concrets adaptés au secteur"},
    {"question": "Question sur l'intégration dans des outils (CRM, Excel, etc.)", "answer": "Réponse sur les formats et compatibilités avec exemples"},
    {"question": "Question sur un filtre ou tri spécifique possible", "answer": "Réponse qui explique comment filtrer/trier avec les colonnes disponibles"},
    {"question": "Question sur la complétude des données", "answer": "Réponse sur le taux de remplissage et qualité"},
    {"question": "Question sur un aspect unique de cette base de données", "answer": "Réponse qui met en avant ce qui rend cette base unique"}
  ]
}
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en analyse de données B2B, SEO et recherche web. 

Ta mission :
1. ANALYSER en profondeur les colonnes et données pour comprendre EXACTEMENT ce que contient la base
2. RECHERCHER des informations sur les entreprises mentionnées dans le nom (ex: "Ichard.fr" = site e-commerce bricolage/jardinage français)
3. COMPRENDRE le secteur d'activité et le type de business
4. GÉNÉRER des descriptions PRÉCISES et SPÉCIFIQUES, pas génériques
5. IDENTIFIER les vrais cas d'usage selon le type de données (produits e-commerce ≠ contacts B2B ≠ données financières)

IMPORTANT :
- Ne génère PAS de descriptions génériques type "base de données pour prospection"
- Sois SPÉCIFIQUE : "Base de données produits e-commerce Ichard.fr avec 1 805 produits incluant prix, disponibilité, catégories, images, métadonnées SEO..."
- Adapte les cas d'usage au type réel de données
- Si c'est des produits e-commerce → cas d'usage = analyse prix, monitoring concurrents, etc.
- Si c'est des contacts B2B → cas d'usage = prospection, CRM, etc.`
        },
        {
          role: 'user',
          content: context
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
    
    const response = JSON.parse(completion.choices[0].message.content)
    
    console.log(green('✅ Enrichissement GPT terminé'))
    
    // Déterminer le prix selon une logique claire
    const suggestedPrice = response.price || 99
    const finalPrice = calculatePrice(sheetData.rowCount, response.category, suggestedPrice)
    
    // Générer le slug : utiliser celui de GPT si fourni, sinon générer automatiquement
    let optimizedSlug = response.slug
    if (!optimizedSlug || optimizedSlug.trim() === '') {
      // Fallback : générer automatiquement avec la catégorie
      optimizedSlug = generateSlug(sheetData.name, response.category || 'Finance')
    } else {
      // Nettoyer le slug GPT pour s'assurer qu'il est valide
      optimizedSlug = optimizedSlug
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-')
        .substring(0, 60)
    }
    
    return {
      description: response.description || getDefaultEnrichment(sheetData).description,
      shortDescription: response.shortDescription || getDefaultEnrichment(sheetData).shortDescription,
      category: response.category || 'Finance',
      slug: optimizedSlug, // Slug SEO-optimisé
      price: finalPrice,
      isPaid: response.isPaid !== undefined ? response.isPaid : true,
      headersFR: headersFR, // Headers traduits en français
      enrichedData: {
        companyInfo: response.companyInfo || '',
        problem: response.problem || [],
        solution: response.solution || [],
        useCases: response.useCases || [],
        keywords: response.keywords || [],
      statistics: response.statistics || null,
      sampleData: response.sampleData && response.sampleData.length > 0 
        ? response.sampleData 
        : generateSampleDataFromRows(sheetData.sampleRows, headersFR), // Fallback : générer depuis les vraies données
      testimonials: response.testimonials || [],
      faq: response.faq || []
      }
    }
  } catch (error) {
    console.error(red(`Erreur GPT: ${error.message}`))
    return getDefaultEnrichment(sheetData)
  }
}

// Données par défaut si GPT n'est pas disponible
function getDefaultEnrichment(sheetData) {
  return {
    description: `Base de données complète avec ${sheetData.rowCount.toLocaleString()} entrées. ${sheetData.headers.length} champs par entrée : ${sheetData.headers.slice(0, 5).join(', ')}${sheetData.headers.length > 5 ? '...' : ''}. Idéal pour la prospection et l'analyse de marché.`,
    shortDescription: `Base de données complète de ${sheetData.rowCount.toLocaleString()} entrées avec ${sheetData.headers.length} champs par entrée (${sheetData.headers.slice(0, 3).join(', ')}${sheetData.headers.length > 3 ? '...' : ''}). Idéale pour la prospection, l'analyse de marché et l'enrichissement de bases de données CRM. Les données sont structurées et prêtes à l'emploi pour vos outils d'analyse ou de prospection.`,
    category: 'Finance',
    price: 99,
    isPaid: true,
    headersFR: sheetData.headers.map(h => h.charAt(0).toUpperCase() + h.slice(1)), // Fallback simple
    enrichedData: {
      companyInfo: '',
      problem: [
        'Difficulté à trouver des données structurées',
        'Temps perdu à collecter manuellement les informations',
        'Données dispersées sur différentes sources'
      ],
      solution: [
        `Base de données complète avec ${sheetData.rowCount.toLocaleString()} entrées`,
        `${sheetData.headers.length} champs par entrée pour une analyse approfondie`,
        'Données prêtes à l\'emploi pour votre CRM ou outil de prospection'
      ],
      useCases: [
        'Prospection B2B',
        'Analyse de marché',
        'Enrichissement de base de données CRM'
      ],
      keywords: ['base de données', 'prospection', 'leads', 'données structurées'],
      statistics: null,
      sampleData: generateSampleDataFromRows(sheetData.sampleRows, sheetData.headers.map(h => h.charAt(0).toUpperCase() + h.slice(1))),
      testimonials: [],
      faq: []
    }
  }
}

// Générer sampleData depuis les vraies données (fallback si GPT ne le fait pas)
function generateSampleDataFromRows(sampleRows, headersFR) {
  if (!sampleRows || sampleRows.length === 0 || !headersFR || headersFR.length === 0) {
    return []
  }
  
  // Prendre les 3 premières lignes
  const rowsToUse = sampleRows.slice(0, 3)
  
  return rowsToUse.map(row => {
    const obj = {}
    headersFR.forEach((header, idx) => {
      obj[header] = row[idx] || ''
    })
    return obj
  })
}

// Traduire les headers en français avec GPT
async function translateHeadersWithGPT(headers, openaiClient) {
  if (!openaiClient) {
    // Fallback si GPT n'est pas disponible
    return headers.map(h => h.charAt(0).toUpperCase() + h.slice(1))
  }
  
  try {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en traduction technique. Traduis les noms de colonnes en français de manière naturelle et professionnelle.'
        },
        {
          role: 'user',
          content: `Traduis ces noms de colonnes en français. Réponds UNIQUEMENT avec un tableau JSON de traductions dans le même ordre.

Colonnes à traduire: ${JSON.stringify(headers)}

Format de réponse (JSON uniquement):
{
  "translations": ["Traduction 1", "Traduction 2", "Traduction 3", ...]
}`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
    
    const response = JSON.parse(completion.choices[0].message.content)
    return response.translations || headers
  } catch (error) {
    console.error('Erreur traduction headers:', error.message)
    return headers.map(h => h.charAt(0).toUpperCase() + h.slice(1))
  }
}

// Analyser les colonnes pour comprendre le type de données
function analyzeColumns(headers, sampleRows) {
  const analysis = []
  
  // Détecter le type de données avec plus de précision
  const productIndicators = ['price', 'product', 'category', 'brand', 'image', 'quantity', 'availability', 'reference', 'model', 'tax']
  const contactIndicators = ['email', 'phone', 'name', 'address', 'city', 'zip', 'contact', 'siret']
  const financialIndicators = ['amount', 'revenue', 'profit', 'transaction', 'invoice', 'tax']
  const ecommerceIndicators = ['url', 'meta', 'title', 'description', 'imageurl', 'productcategory']
  const realEstateIndicators = ['surface', 'chambres', 'pieces', 'bien', 'immobilier', 'agence', 'notaire', 'prix', 'ville', 'code postal', 'type bien', 'appartement', 'maison', 'local commercial']
  
  const hasProducts = productIndicators.some(ind => headers.some(h => h.toLowerCase().includes(ind)))
  const hasContacts = contactIndicators.some(ind => headers.some(h => h.toLowerCase().includes(ind)))
  const hasFinancial = financialIndicators.some(ind => headers.some(h => h.toLowerCase().includes(ind)))
  const hasEcommerce = ecommerceIndicators.some(ind => headers.some(h => h.toLowerCase().includes(ind)))
  const hasRealEstate = realEstateIndicators.some(ind => headers.some(h => h.toLowerCase().includes(ind)))
  
  // Détection plus précise - IMMOBILIER EN PRIORITÉ
  if (hasRealEstate) {
    analysis.push("🔍 TYPE DE DONNÉES: IMMOBILIER / AGENCES IMMOBILIÈRES")
    analysis.push("")
    analysis.push("Colonnes immobilières détectées:")
    headers.filter(h => {
      const lower = h.toLowerCase()
      return realEstateIndicators.some(ind => lower.includes(ind)) || contactIndicators.some(ind => lower.includes(ind))
    }).forEach(h => {
      analysis.push(`  ✓ ${h}`)
    })
    analysis.push("")
    analysis.push("VALEUR BUSINESS:")
    analysis.push("- Base de données complète d'agences immobilières, notaires ou biens immobiliers")
    analysis.push("- Coordonnées complètes (adresse, téléphone, email) pour prospection")
    analysis.push("- Données géographiques (ville, code postal, région) pour ciblage")
    analysis.push("- Informations sur les biens immobiliers si présentes (surface, prix, type)")
    analysis.push("")
    analysis.push("CAS D'USAGE TYPIQUES:")
    analysis.push("- Prospection d'agences immobilières pour partenariats")
    analysis.push("- Enrichissement CRM pour professionnels de l'immobilier")
    analysis.push("- Analyse de marché immobilier par région")
    analysis.push("- Campagnes marketing ciblées secteur immobilier")
    analysis.push("⚠️ IMPORTANT: Catégorie = 'Immobilier' (PAS 'B2B')")
  } else if (hasProducts && hasEcommerce) {
    analysis.push("🔍 TYPE DE DONNÉES: PRODUITS E-COMMERCE")
    analysis.push("")
    analysis.push("Colonnes produits e-commerce détectées:")
    headers.filter(h => {
      const lower = h.toLowerCase()
      return productIndicators.some(ind => lower.includes(ind)) || ecommerceIndicators.some(ind => lower.includes(ind))
    }).forEach(h => {
      analysis.push(`  ✓ ${h}`)
    })
    analysis.push("")
    analysis.push("VALEUR BUSINESS:")
    analysis.push("- Catalogue complet de produits avec prix, disponibilité, catégories")
    analysis.push("- Métadonnées SEO (metaTitle, metaDescription) pour chaque produit")
    analysis.push("- Images et URLs pour chaque produit")
    analysis.push("- Données structurées prêtes pour analyse de marché, monitoring de prix, comparaison concurrentielle")
    analysis.push("")
    analysis.push("CAS D'USAGE TYPIQUES:")
    analysis.push("- Analyse de prix concurrents et monitoring de marché")
    analysis.push("- Comparaison de catalogues produits entre sites e-commerce")
    analysis.push("- Analyse SEO des produits (métadonnées, descriptions)")
    analysis.push("- Enrichissement de base de données produits pour outils de comparaison")
    analysis.push("- Business intelligence e-commerce (tendances, catégories, marques)")
  } else if (hasContacts) {
    analysis.push("🔍 TYPE DE DONNÉES: CONTACTS B2B")
    analysis.push("- Colonnes contacts détectées: emails, téléphones, adresses, noms, etc.")
    analysis.push("- Utilité: Prospection, enrichissement CRM, campagnes marketing")
  } else if (hasFinancial) {
    analysis.push("🔍 TYPE DE DONNÉES: DONNÉES FINANCIÈRES")
    analysis.push("- Colonnes financières détectées: montants, revenus, transactions, etc.")
    analysis.push("- Utilité: Analyse financière, reporting, business intelligence")
  } else {
    analysis.push("🔍 TYPE DE DONNÉES: À DÉTERMINER")
    analysis.push("- Analyse des colonnes nécessite une investigation plus approfondie")
  }
  
  // Analyser les colonnes spécifiques pour donner plus de contexte
  analysis.push("")
  analysis.push("📊 COLONNES CLÉS IDENTIFIÉES:")
  const keyColumns = {
    'price': 'Prix des produits',
    'priceTaxExcl': 'Prix HT',
    'priceWithoutReduction': 'Prix sans réduction',
    'availability': 'Disponibilité en stock',
    'quantity': 'Quantité disponible',
    'category': 'Catégorie produit',
    'productCategory': 'Catégorie produit détaillée',
    'brand': 'Marque du produit',
    'title': 'Titre du produit',
    'description': 'Description produit',
    'metaTitle': 'Titre SEO (meta)',
    'metaDescription': 'Description SEO (meta)',
    'imageUrl': 'URL de l\'image produit',
    'url': 'URL de la page produit',
    'reference': 'Référence produit',
    'models': 'Modèles disponibles',
    'taxName': 'Nom de la taxe',
    'taxRate': 'Taux de taxe',
    'lastModified': 'Dernière modification'
  }
  
  headers.forEach(header => {
    const lower = header.toLowerCase()
    const match = Object.keys(keyColumns).find(key => lower.includes(key.toLowerCase()))
    if (match) {
      analysis.push(`  • ${header}: ${keyColumns[match]}`)
    }
  })
  
  // Analyser un échantillon pour donner plus de contexte
  if (sampleRows && sampleRows.length > 0) {
    analysis.push("")
    analysis.push("📋 EXEMPLE DE DONNÉES (première ligne):")
    const firstRow = sampleRows[0]
    headers.slice(0, 5).forEach((header, idx) => {
      if (firstRow[idx]) {
        analysis.push(`  ${header}: ${String(firstRow[idx]).substring(0, 50)}${String(firstRow[idx]).length > 50 ? '...' : ''}`)
      }
    })
  }
  
  return analysis.join('\n')
}

// Calculer le prix selon une logique claire
function calculatePrice(rowCount, category, suggestedPrice) {
  // Logique de prix basée sur :
  // 1. Nombre de lignes
  // 2. Catégorie
  // 3. Suggestion GPT
  
  let basePrice = 99 // Prix de base
  
  // Ajustement selon le nombre de lignes
  if (rowCount < 500) {
    basePrice = 49
  } else if (rowCount < 1000) {
    basePrice = 79
  } else if (rowCount < 5000) {
    basePrice = 99
  } else if (rowCount < 10000) {
    basePrice = 149
  } else {
    basePrice = 199
  }
  
  // Ajustement selon la catégorie (certaines catégories valent plus)
  const categoryMultiplier = {
    'Finance': 1.2,
    'E-commerce': 1.0,
    'B2B': 1.1,
    'Services': 1.0,
    'Artisanat': 1.0,
    'Immobilier': 1.3
  }
  
  const multiplier = categoryMultiplier[category] || 1.0
  basePrice = Math.round(basePrice * multiplier)
  
  // Prendre en compte la suggestion GPT (moyenne entre notre calcul et GPT)
  const finalPrice = Math.round((basePrice + suggestedPrice) / 2)
  
  // Arrondir à des prix "ronds" (49, 79, 99, 149, 199, 249, etc.)
  const roundedPrices = [49, 79, 99, 149, 199, 249, 299, 399, 499]
  const closestPrice = roundedPrices.reduce((prev, curr) => 
    Math.abs(curr - finalPrice) < Math.abs(prev - finalPrice) ? curr : prev
  )
  
  return closestPrice
}

// Générer un slug SEO-optimisé
function generateSlug(name, category = null) {
  // Nettoyer le nom d'abord
  let cleanName = name
    .replace(/\s*-\s*Base\s+de\s+données/gi, '')
    .replace(/Base\s+de\s+données\s*-\s*/gi, '')
    .replace(/Base\s+de\s+données/gi, '')
    .trim()
  
  // Construire un slug SEO-friendly avec mots-clés
  let slugParts = []
  
  // Ajouter le nom principal (nettoyé)
  slugParts.push(cleanName)
  
  // Ajouter des mots-clés selon la catégorie pour améliorer le SEO
  if (category) {
    const categoryKeywords = {
      'E-commerce': 'produits-ecommerce',
      'Artisanat': 'artisans',
      'Finance': 'conseil-gestion-patrimoine',
      'B2B': 'contacts-entreprises',
      'Retail': 'magasins',
      'Services': 'prestations'
    }
    const keyword = categoryKeywords[category]
    if (keyword && !cleanName.toLowerCase().includes(keyword.split('-')[0])) {
      slugParts.push(keyword)
    }
  }
  
  // Ajouter "base-donnees" si pas déjà présent et si le nom ne le contient pas
  const nameLower = cleanName.toLowerCase()
  if (!nameLower.includes('base') && !nameLower.includes('donnee') && !nameLower.includes('database')) {
    slugParts.push('base-donnees')
  }
  
  // Construire le slug final
  const slug = slugParts
    .join('-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplacer caractères spéciaux par tirets
    .replace(/^-+|-+$/g, '') // Supprimer tirets en début/fin
    .replace(/-{2,}/g, '-') // Remplacer tirets multiples par un seul
    .substring(0, 60) // Limiter à 60 caractères (bon pour SEO)
  
  return slug
}

// Charger les bases de données existantes
async function loadDatabases() {
  // Sur Vercel, charger depuis Blob Storage en priorité
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = require('@vercel/blob')
      const BLOB_FILENAME = 'marketplace-databases.json'
      
      const blobs = await list({ prefix: BLOB_FILENAME })
      const existingBlob = blobs.blobs.find((blob) => blob.pathname === BLOB_FILENAME)

      if (existingBlob) {
        const response = await fetch(existingBlob.url, {
          method: 'GET',
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.databases && Array.isArray(data.databases)) {
            return data.databases
          }
          // Format ancien (tableau direct)
          if (Array.isArray(data)) {
            return data
          }
        }
      }
    } catch (error) {
      console.warn(yellow('⚠️  Erreur chargement Blob Storage, fallback local:'), error.message)
    }
  }
  
  // Fallback: charger depuis fichier local (pour développement)
  try {
    if (await fileExists(DATABASES_FILE)) {
      const data = await fs.readFile(DATABASES_FILE, 'utf8')
      const parsed = JSON.parse(data)
      // Si c'est un objet avec databases, retourner databases
      if (parsed.databases && Array.isArray(parsed.databases)) {
        return parsed.databases
      }
      // Si c'est un tableau directement
      if (Array.isArray(parsed)) {
        return parsed
      }
      return []
    }
    return []
  } catch (error) {
    console.error(red('Erreur chargement databases:'), error.message)
    return []
  }
}

// Sauvegarder les bases de données
async function saveDatabases(databases) {
  // Sur Vercel, sauvegarder directement dans Blob Storage
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = require('@vercel/blob')
      const BLOB_FILENAME = 'marketplace-databases.json'
      const dataToSave = {
        databases,
        lastUpdated: new Date().toISOString(),
        count: databases.length
      }
      
      await put(BLOB_FILENAME, JSON.stringify(dataToSave, null, 2), {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true
      })
      
      return true
    } catch (error) {
      console.error(red('Erreur sauvegarde Blob Storage:'), error.message)
      // Continuer pour essayer le fallback local si possible
    }
  }
  
  // Fallback: sauvegarde locale (pour développement)
  try {
    const dir = path.dirname(DATABASES_FILE)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(DATABASES_FILE, JSON.stringify(databases, null, 2), 'utf8')
    return true
  } catch (error) {
    // Sur Vercel, le système de fichiers est en lecture seule, c'est normal
    if (process.env.VERCEL) {
      console.log(yellow('⚠️  Sauvegarde locale ignorée sur Vercel (système de fichiers en lecture seule)'))
      return true // On considère que c'est OK car Blob Storage a été utilisé
    }
    console.error(red('Erreur sauvegarde databases:'), error.message)
    return false
  }
}

// Main
async function main() {
  console.log(blue('\n🚀 Enrichissement Google Sheets → Marketplace\n'))
  
  try {
    // Auth Google
    const auth = await getAuth()
    const drive = google.drive({ version: 'v3', auth })
    const sheets = google.sheets({ version: 'v4', auth })
    
    let sheetsToProcess = []
    
    if (sheetId) {
      // Traiter un sheet spécifique
      console.log(blue(`\n📄 Traitement du sheet: ${sheetId}`))
      const file = await drive.files.get({ 
        fileId: sheetId,
        fields: 'id, name, modifiedTime'
      })
      sheetsToProcess = [{ 
        id: sheetId, 
        name: file.data.name,
        modifiedTime: file.data.modifiedTime
      }]
    } else {
      // Lister tous les sheets avec modifiedTime
      console.log(blue('\n📊 Recherche des Google Sheets...\n'))
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
        fields: 'files(id, name, modifiedTime)',
        orderBy: 'modifiedTime desc',
        pageSize: 50
      })
      
      sheetsToProcess = response.data.files || []
      
      if (sheetsToProcess.length === 0) {
        console.log(yellow('❌ Aucun Google Sheet trouvé'))
        return
      }
      
      console.log(blue(`✓ ${sheetsToProcess.length} Google Sheets trouvés\n`))
    }
    
    // Charger les bases existantes
    const databases = await loadDatabases()
    
    // Filtrer les sheets à traiter (nouveaux ou modifiés)
    const sheetsToEnrich = []
    
    for (const sheet of sheetsToProcess) {
      const existingDb = databases.find(db => db.sheetId === sheet.id)
      
      if (!existingDb) {
        // Nouveau sheet → à traiter
        sheetsToEnrich.push(sheet)
        console.log(cyan(`  ✨ Nouveau: ${sheet.name}`))
      } else {
        // Sheet existant → vérifier si modifié
        const sheetModifiedTime = new Date(sheet.modifiedTime || 0).getTime()
        const lastEnrichedTime = new Date(existingDb.lastEnriched || 0).getTime()
        
        if (sheetModifiedTime > lastEnrichedTime) {
          // Sheet modifié depuis le dernier enrichissement → à traiter
          sheetsToEnrich.push(sheet)
          const daysSinceEnrich = Math.floor((Date.now() - lastEnrichedTime) / (1000 * 60 * 60 * 24))
          console.log(cyan(`  🔄 Modifié: ${sheet.name} (dernier enrichissement il y a ${daysSinceEnrich} jour(s))`))
        } else {
          // Sheet non modifié → skip
          console.log(yellow(`  ⏭️  Déjà à jour: ${sheet.name}`))
        }
      }
    }
    
    if (sheetsToEnrich.length === 0) {
      console.log(green('\n✅ Tous les sheets sont déjà à jour. Rien à enrichir.\n'))
      return
    }
    
    // Limiter le nombre de sheets à traiter (pour éviter timeout sur Vercel)
    // IMPORTANT: Maximum 2 sheets par exécution, s'arrêter définitivement après
    // Par défaut, limite à 2 sheets même si --limit n'est pas spécifié (sauf si --all est utilisé)
    const maxSheets = allSheets 
      ? (limit !== null && limit !== undefined ? limit : sheetsToEnrich.length) 
      : (limit !== null && limit !== undefined ? limit : 2)
    const sheetsToProcessLimited = sheetsToEnrich.slice(0, maxSheets)
    
    console.log(blue(`\n📝 ${sheetsToProcessLimited.length} sheet(s) à enrichir sur ${sheetsToEnrich.length} trouvé(s) (limite: ${maxSheets})\n`))
    
    // Traiter chaque sheet à enrichir (limité) - S'ARRÊTER APRÈS maxSheets
    let processedCount = 0
    for (const sheet of sheetsToProcessLimited) {
      // S'arrêter définitivement après avoir traité maxSheets
      if (processedCount >= maxSheets) {
        console.log(yellow(`\n⏸️  Limite de ${maxSheets} sheet(s) atteinte. Arrêt du traitement.\n`))
        break
      }
      
      console.log(cyan(`\n📄 ${sheet.name}...`))
      
      // Analyser
      const analysis = await analyzeSheet(sheets, sheet.id)
      if (!analysis) {
        console.log(red(`  ❌ Erreur lors de l'analyse`))
        // Ne pas incrémenter le compteur si l'analyse échoue
        continue
      }
      
      console.log(`  ${analysis.rowCount.toLocaleString()} lignes, ${analysis.headers.length} colonnes`)
      
      // Enrichir avec GPT
      let enrichment
      try {
        enrichment = await enrichWithGPT(analysis)
        if (!enrichment) {
          console.log(red(`  ❌ Erreur lors de l'enrichissement GPT`))
          continue
        }
      } catch (error) {
        console.error(red(`  ❌ Erreur lors de l'enrichissement GPT: ${error.message}`))
        continue
      }
      
    // Ajouter systématiquement le préfixe "Base de données -" avant le nom
    // Le préfixe est utile pour identifier clairement le type de contenu
    let cleanName = analysis.name.trim()
    
    // Si le nom est vide, utiliser un nom par défaut
    if (!cleanName || cleanName.length === 0) {
      cleanName = 'Base de données'
    }
    
    // Ajouter le préfixe "Base de données -" s'il n'est pas déjà présent
    if (!cleanName.toLowerCase().startsWith('base de données')) {
      cleanName = `Base de données - ${cleanName}`
    }
    
    // Utiliser le slug SEO-optimisé généré par GPT (ou fallback automatique)
    const slug = enrichment.slug || generateSlug(cleanName, enrichment.category)
    
    // Vérifier si existe déjà
    const existingIndex = databases.findIndex(db => db.sheetId === sheet.id)
    
    const database = {
      sheetId: sheet.id,
      name: cleanName,
      slug,
      description: enrichment.description, // Description longue pour SEO
      shortDescription: enrichment.shortDescription || enrichment.description, // Description courte pour affichage
      category: enrichment.category,
      price: enrichment.price,
      isPaid: enrichment.isPaid,
      rowCount: analysis.rowCount,
      headers: enrichment.headersFR || analysis.headers, // Headers traduits en français (ou originaux si pas de GPT)
      headersOriginal: analysis.headers, // Garder les originaux aussi
      sheetUrl: analysis.sheetUrl,
      enrichedData: enrichment.enrichedData,
      date: existingIndex >= 0 ? databases[existingIndex].date : new Date().toISOString().split('T')[0],
      lastEnriched: new Date().toISOString()
    }
      
      if (existingIndex >= 0) {
        databases[existingIndex] = database
        console.log(green(`  ✅ Mis à jour`))
      } else {
        databases.push(database)
        console.log(green(`  ✅ Ajouté`))
      }
      
      // Sauvegarder après chaque traitement pour éviter de perdre le travail en cas de timeout
      await saveDatabases(databases)
      console.log(cyan(`  💾 Sauvegardé (${databases.length} base(s) au total)`))
      
      // Incrémenter le compteur seulement après un traitement réussi
      processedCount++
      
      // S'arrêter définitivement après avoir traité maxSheets
      if (processedCount >= maxSheets) {
        console.log(yellow(`\n⏸️  Limite de ${maxSheets} sheet(s) atteinte. Arrêt du traitement.\n`))
        break
      }
    }
    
    // Sauvegarder final (au cas où)
    await saveDatabases(databases)
    
    const remaining = sheetsToEnrich.length - processedCount
    if (remaining > 0) {
      console.log(yellow(`\n⚠️  ${remaining} sheet(s) restant(s) à traiter lors du prochain cron (${processedCount}/${sheetsToEnrich.length} traités)\n`))
    } else {
      console.log(green(`\n✅ ${databases.length} base(s) de données sauvegardée(s) (${processedCount} sheet(s) traité(s))\n`))
    }
    
  } catch (error) {
    console.error(red(`\n❌ Erreur: ${error.message}\n`))
    if (error.stack) console.error(error.stack)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main, analyzeSheet, enrichWithGPT }

