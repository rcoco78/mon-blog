# 🤖 Automatisation Google Sheets → Marketplace

Ce système permet de synchroniser automatiquement vos Google Sheets avec votre marketplace, en générant automatiquement :
- Les entrées dans `lib/tools.js`
- Les pages dédiées dans `pages/marketplace/[slug].js`

## 📋 Prérequis

1. **Google API Credentials** : Vous devez avoir un fichier `credentials.json` ou `service-account-key.json` dans la racine du projet
2. **Node.js** : Le script utilise les dépendances déjà installées (`googleapis`)

## 🚀 Configuration

### 1. Obtenir les credentials Google

#### Option A : Service Account (Recommandé pour production)

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez-en un existant
3. Activez les APIs :
   - Google Drive API
   - Google Sheets API
4. Créez un Service Account :
   - IAM & Admin → Service Accounts
   - Créez un nouveau service account
   - Téléchargez la clé JSON
5. Renommez le fichier en `service-account-key.json` et placez-le à la racine du projet
6. Partagez votre dossier Google Drive avec l'email du service account (permissions de lecture)

#### Option B : OAuth2 (Pour développement)

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez des credentials OAuth2
3. Téléchargez le fichier JSON et renommez-le en `credentials.json`
4. Placez-le à la racine du projet

### 2. Configurer le dossier à scanner

Éditez `scripts/marketplace-sheets-config.json` :

```json
{
  "folderId": "VOTRE_FOLDER_ID_ICI",
  "defaultCategory": "Finance",
  "defaultPrice": 99,
  "defaultIsPaid": true,
  "mappings": {
    "SHEET_ID_1": {
      "category": "Finance",
      "price": 99,
      "isPaid": true,
      "description": "Description personnalisée"
    }
  }
}
```

**Comment trouver le Folder ID ?**
- Ouvrez votre dossier dans Google Drive
- L'URL ressemble à : `https://drive.google.com/drive/folders/1ABC123xyz...`
- Le Folder ID est la partie après `/folders/`

## 🎯 Utilisation

### Mode test (dry-run)

Testez sans modifier les fichiers :

```bash
node scripts/sync-google-sheets-marketplace.js --dry-run
```

### Synchronisation complète

```bash
node scripts/sync-google-sheets-marketplace.js
```

### Spécifier un dossier différent

```bash
node scripts/sync-google-sheets-marketplace.js --folder-id=YOUR_FOLDER_ID
```

## 🔄 Automatisation avec Google Drive Webhooks

Pour automatiser la synchronisation quand un Sheet est ajouté dans un dossier :

### Option 1 : Webhook Google Drive (Recommandé)

1. Créez une API route dans `pages/api/marketplace/sync-sheet.js`
2. Configurez un webhook Google Drive qui appelle cette route
3. Le webhook se déclenche quand un fichier est ajouté/modifié dans le dossier

### Option 2 : Cron Job (Vercel)

Créez `pages/api/cron/sync-marketplace.js` :

```javascript
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  const { main } = require('../../scripts/sync-google-sheets-marketplace')
  await main()
  
  return res.json({ success: true })
}
```

Puis configurez un cron dans `vercel.json` :

```json
{
  "crons": [{
    "path": "/api/cron/sync-marketplace",
    "schedule": "0 */6 * * *"
  }]
}
```

## 📝 Personnalisation par Sheet

Dans `marketplace-sheets-config.json`, vous pouvez personnaliser chaque sheet :

```json
{
  "mappings": {
    "SHEET_ID_ABC123": {
      "category": "Artisanat",
      "price": 79,
      "isPaid": true,
      "description": "Base de données complète des artisans avec coordonnées..."
    }
  }
}
```

## 🎨 Template de page

Le template par défaut est dans `scripts/templates/marketplace-page-template.js`. Vous pouvez le personnaliser pour :
- Ajouter des sections spécifiques
- Modifier le design
- Ajouter des fonctionnalités

## 🔍 Dépannage

### Erreur d'authentification

- Vérifiez que `credentials.json` ou `service-account-key.json` existe
- Vérifiez que les APIs sont activées dans Google Cloud Console
- Pour Service Account, vérifiez que le dossier est partagé avec l'email du service account

### Aucun Sheet trouvé

- Vérifiez le `folderId` dans la config
- Vérifiez que les Sheets sont bien dans le dossier
- Vérifiez les permissions de lecture

### Erreur de génération

- Vérifiez que `lib/tools.js` existe et a le bon format
- Vérifiez que `pages/marketplace/` existe
- Vérifiez les logs pour plus de détails

## 📊 Structure générée

Pour chaque Google Sheet, le script génère :

1. **Entrée dans `lib/tools.js`** :
```javascript
{
  name: 'Base de données - Nom du Sheet',
  description: 'Description générée automatiquement',
  category: 'Finance',
  type: 'database',
  iconSvg: 'search',
  link: '/marketplace/slug-du-sheet',
  isPaid: true,
  price: 99,
  isNew: true,
  date: '2026-01-15'
}
```

2. **Page dans `pages/marketplace/[slug].js`** :
- Structure complète basée sur le template
- Intégration Stripe pour le paiement
- Preview des données
- FAQ automatique

## 🚀 Prochaines étapes

1. Testez avec `--dry-run` pour voir ce qui sera généré
2. Configurez vos mappings personnalisés
3. Lancez la synchronisation
4. Personnalisez les pages générées si nécessaire
5. Configurez l'automatisation (webhook ou cron)

## 💡 Astuces

- Utilisez `--dry-run` avant chaque synchronisation pour prévisualiser
- Personnalisez les descriptions dans les mappings pour un meilleur SEO
- Ajoutez des catégories personnalisées selon vos besoins
- Le script détecte automatiquement les Sheets déjà synchronisés et les met à jour

