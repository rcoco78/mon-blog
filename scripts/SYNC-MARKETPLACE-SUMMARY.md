# 🎯 Résumé : Automatisation Google Sheets → Marketplace

## ✅ Ce qui a été créé

### 1. **Script principal de synchronisation**
📁 `scripts/sync-google-sheets-marketplace.js`

**Fonctionnalités :**
- ✅ Scan automatique d'un dossier Google Drive
- ✅ Analyse de chaque Google Sheet (colonnes, lignes, métadonnées)
- ✅ Génération automatique des entrées dans `lib/tools.js`
- ✅ Génération automatique des pages dans `pages/marketplace/[slug].js`
- ✅ Mode dry-run pour tester sans modifier les fichiers
- ✅ Support Service Account et OAuth2

### 2. **Fichier de configuration**
📁 `scripts/marketplace-sheets-config.json`

**Permet de :**
- Configurer le dossier Google Drive à scanner
- Définir les valeurs par défaut (catégorie, prix, etc.)
- Personnaliser chaque sheet individuellement

### 3. **API Route pour webhooks**
📁 `pages/api/marketplace/sync-sheet.js`

**Pour :**
- Déclencher la synchronisation via webhook Google Drive
- Synchroniser un sheet spécifique à la demande

### 4. **Documentation complète**
📁 `scripts/README-marketplace-automation.md`

**Contient :**
- Instructions de configuration
- Guide d'utilisation
- Dépannage
- Exemples

## 🚀 Comment utiliser

### Étape 1 : Configuration Google API

**Option A : Service Account (Recommandé)**
1. Créez un Service Account dans Google Cloud Console
2. Activez Google Drive API et Google Sheets API
3. Téléchargez la clé JSON → `service-account-key.json` à la racine
4. Partagez votre dossier Google Drive avec l'email du service account

**Option B : OAuth2 (Développement)**
1. Créez des credentials OAuth2
2. Téléchargez → `credentials.json` à la racine

### Étape 2 : Configuration du dossier

Éditez `scripts/marketplace-sheets-config.json` :
```json
{
  "folderId": "VOTRE_FOLDER_ID",
  "defaultCategory": "Finance",
  "defaultPrice": 99,
  "defaultIsPaid": true
}
```

**Trouver le Folder ID :**
- Ouvrez le dossier dans Google Drive
- URL : `https://drive.google.com/drive/folders/1ABC123...`
- Le Folder ID est après `/folders/`

### Étape 3 : Test (dry-run)

```bash
npm run sync-marketplace:dry-run
```

Cela affichera ce qui serait généré sans modifier les fichiers.

### Étape 4 : Synchronisation réelle

```bash
npm run sync-marketplace
```

Ou avec un dossier spécifique :
```bash
node scripts/sync-google-sheets-marketplace.js --folder-id=YOUR_FOLDER_ID
```

## 🔄 Automatisation

### Option 1 : Webhook Google Drive

Quand un Sheet est ajouté dans votre dossier :
1. Google Drive envoie un webhook à `/api/marketplace/sync-sheet`
2. Le sheet est analysé et synchronisé automatiquement

**À configurer :**
- Webhook Google Drive → URL de votre API route
- Secret dans les variables d'environnement

### Option 2 : Cron Job (Vercel)

Synchronisation périodique (ex: toutes les 6h) :

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/sync-marketplace",
    "schedule": "0 */6 * * *"
  }]
}
```

## 📊 Ce qui est généré

Pour chaque Google Sheet trouvé :

1. **Entrée dans `lib/tools.js`** :
```javascript
{
  name: 'Base de données - Nom du Sheet',
  description: 'Description auto-générée',
  category: 'Finance',
  type: 'database',
  link: '/marketplace/slug',
  isPaid: true,
  price: 99,
  date: '2026-01-15'
}
```

2. **Page dans `pages/marketplace/[slug].js`** :
- Structure complète (basée sur `capeb.js`)
- Intégration Stripe
- Preview des données
- FAQ automatique

## 🎨 Personnalisation

### Par Sheet individuel

Dans `marketplace-sheets-config.json` :
```json
{
  "mappings": {
    "SHEET_ID_ABC123": {
      "category": "Artisanat",
      "price": 79,
      "isPaid": true,
      "description": "Description personnalisée..."
    }
  }
}
```

### Template de page

Le template par défaut sera créé automatiquement. Pour le personnaliser :
1. Créez `scripts/templates/marketplace-page-template.js`
2. Utilisez les placeholders : `{{SLUG}}`, `{{NAME}}`, `{{DESCRIPTION}}`, etc.

## ⚠️ Notes importantes

1. **Première utilisation** : Le script demandera une autorisation OAuth2 (si pas de Service Account)
2. **Mode dry-run** : Toujours tester avec `--dry-run` avant la synchronisation réelle
3. **Backup** : Le script met à jour les fichiers existants, faites un backup si nécessaire
4. **Permissions** : Le Service Account doit avoir accès en lecture au dossier Google Drive

## 🐛 Dépannage

### Erreur d'authentification
- Vérifiez que `credentials.json` ou `service-account-key.json` existe
- Vérifiez que les APIs sont activées
- Pour Service Account, vérifiez que le dossier est partagé

### Aucun Sheet trouvé
- Vérifiez le `folderId` dans la config
- Vérifiez les permissions de lecture

### Erreur de génération
- Vérifiez que `lib/tools.js` existe
- Vérifiez que `pages/marketplace/` existe
- Consultez les logs pour plus de détails

## 🎯 Prochaines étapes

1. ✅ Configurez Google API (Service Account recommandé)
2. ✅ Configurez `marketplace-sheets-config.json`
3. ✅ Testez avec `--dry-run`
4. ✅ Lancez la synchronisation
5. ✅ Personnalisez les pages générées si besoin
6. ✅ Configurez l'automatisation (webhook ou cron)

## 💡 Astuce

**Workflow recommandé :**
1. Créez un dossier Google Drive dédié : "Marketplace - Bases de données"
2. Partagez-le avec votre Service Account
3. Déplacez vos Sheets dans ce dossier quand ils sont prêts
4. Lancez la synchronisation
5. Les pages sont générées automatiquement !

---

**Questions ?** Consultez `scripts/README-marketplace-automation.md` pour plus de détails.

