# 🚀 Marketplace Dynamique - Documentation Complète

## Vision

Système **100% dynamique** qui :
1. ✅ Scanne automatiquement vos Google Sheets dans le Drive
2. ✅ Analyse le contenu de chaque Sheet
3. ✅ Enrichit avec GPT-4o mini (recherche web, descriptions SEO, etc.)
4. ✅ Génère des pages automatiquement (comme les cas d'usage)
5. ✅ Plus besoin de créer les pages manuellement !

## Architecture

```
Google Drive (Sheets)
    ↓
Script d'enrichissement (GPT-4o mini)
    ↓
data/marketplace-databases.json (métadonnées enrichies)
    ↓
pages/marketplace/[slug].js (page dynamique)
    ↓
Pages générées automatiquement !
```

## Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer OpenAI

Ajoutez votre clé API OpenAI dans `.env.local` :

```bash
OPENAI_API_KEY=sk-...
```

### 3. Service Account Google (déjà fait ✅)

Le fichier `service-account-key.json` est déjà configuré.

## Utilisation

### Étape 1 : Enrichir les Google Sheets

**Enrichir tous les Sheets :**
```bash
npm run enrich-sheets:all
```

**Enrichir un Sheet spécifique :**
```bash
npm run enrich-sheets -- --sheet-id=ABC123
```

**Via API :**
```bash
POST /api/marketplace/enrich
Body: { "all": true }
# ou
Body: { "sheetId": "ABC123" }
```

### Étape 2 : Les pages sont générées automatiquement !

Les pages sont accessibles via :
- `/marketplace/[slug]` (généré automatiquement)

Exemple : Si votre Sheet s'appelle "Ichard.fr - Data Scraping"
→ La page sera à `/marketplace/ichard-fr-data-scraping`

### Étape 3 : Build Next.js

```bash
npm run build
```

Next.js générera toutes les pages statiquement avec `getStaticPaths` et `getStaticProps`.

## Fichiers créés

### 1. `lib/marketplace-databases.js`
Gestion des bases de données enrichies (CRUD, recherche, etc.)

### 2. `scripts/enrich-marketplace-sheets.js`
Script principal d'enrichissement avec GPT-4o mini

### 3. `pages/marketplace/[slug].js`
Page dynamique qui génère les pages automatiquement

### 4. `data/marketplace-databases.json`
Stockage des métadonnées enrichies (généré automatiquement)

### 5. `pages/api/marketplace/enrich.js`
API route pour déclencher l'enrichissement

## Workflow complet

### Scénario 1 : Nouveau Google Sheet

1. **Vous créez un nouveau Sheet dans Google Drive**
2. **Vous lancez l'enrichissement :**
   ```bash
   npm run enrich-sheets:all
   ```
3. **Le script :**
   - Scanne le Drive
   - Trouve le nouveau Sheet
   - Analyse le contenu
   - Utilise GPT-4o mini pour enrichir
   - Sauvegarde dans `data/marketplace-databases.json`
4. **Next.js génère la page automatiquement** au prochain build
5. **C'est tout !** La page est accessible sur `/marketplace/[slug]`

### Scénario 2 : Automatisation

**Option A : Cron Job (Vercel)**

Créez `pages/api/cron/enrich-marketplace.js` :

```javascript
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/marketplace/enrich`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true })
  })
  
  return res.json({ success: true })
}
```

Puis dans `vercel.json` :

```json
{
  "crons": [{
    "path": "/api/cron/enrich-marketplace",
    "schedule": "0 */6 * * *"
  }]
}
```

**Option B : Webhook Google Drive**

Quand un Sheet est ajouté/modifié dans un dossier spécifique, déclencher l'enrichissement.

## Structure des données enrichies

```json
{
  "sheetId": "ABC123...",
  "name": "Ichard.fr - Data Scraping",
  "slug": "ichard-fr-data-scraping",
  "description": "Description SEO optimisée générée par GPT",
  "category": "E-commerce",
  "price": 99,
  "isPaid": true,
  "rowCount": 1805,
  "headers": ["availability", "brand", "price", ...],
  "sheetUrl": "https://docs.google.com/spreadsheets/d/...",
  "enrichedData": {
    "companyInfo": "Informations sur l'entreprise",
    "problem": ["Problème 1", "Problème 2"],
    "solution": ["Solution 1", "Solution 2"],
    "useCases": ["Cas d'usage 1", "Cas d'usage 2"],
    "keywords": ["mot-clé 1", "mot-clé 2"]
  },
  "date": "2026-01-06",
  "lastEnriched": "2026-01-06T10:30:00.000Z"
}
```

## Personnalisation

### Modifier les prompts GPT

Éditez `scripts/enrich-marketplace-sheets.js` → fonction `enrichWithGPT()`

### Modifier le design des pages

Éditez `pages/marketplace/[slug].js`

### Ajouter des champs personnalisés

1. Modifiez la structure dans `lib/marketplace-databases.js`
2. Mettez à jour `scripts/enrich-marketplace-sheets.js` pour générer ces champs
3. Utilisez-les dans `pages/marketplace/[slug].js`

## Avantages

✅ **Zéro maintenance manuelle** : Ajoutez un Sheet → Page générée automatiquement
✅ **SEO optimisé** : GPT génère des descriptions et mots-clés optimisés
✅ **Toujours à jour** : Re-enrichissez pour mettre à jour les descriptions
✅ **Scalable** : Gère des centaines de Sheets sans problème
✅ **Performance** : Pages statiques générées à build time

## Coûts

- **GPT-4o mini** : ~$0.15 par 1M tokens
- **Enrichissement moyen** : ~500-1000 tokens par Sheet
- **Coût par Sheet** : ~$0.0001 (quasi gratuit)

## Dépannage

### Erreur OpenAI

Vérifiez que `OPENAI_API_KEY` est définie dans `.env.local`

### Pages non générées

1. Vérifiez que `data/marketplace-databases.json` existe
2. Lancez `npm run build` pour générer les pages
3. Vérifiez les logs de build

### GPT ne génère pas de bonnes descriptions

Modifiez les prompts dans `scripts/enrich-marketplace-sheets.js`

## Prochaines étapes

1. ✅ Enrichir vos Sheets existants
2. ✅ Tester les pages générées
3. ✅ Configurer l'automatisation (cron ou webhook)
4. ✅ Personnaliser les prompts GPT si besoin

---

**C'est tout !** Votre marketplace est maintenant 100% dynamique 🎉

