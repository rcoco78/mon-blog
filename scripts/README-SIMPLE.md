# 🎯 Version SIMPLE - Synchronisation Google Sheets

## ✅ C'est beaucoup plus simple maintenant !

### 1. Configurez Google API (une seule fois)

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un Service Account
3. Activez Google Drive API et Google Sheets API
4. Téléchargez la clé JSON → `service-account-key.json` à la racine du projet
5. Partagez votre Google Drive avec l'email du service account

### 2. Lancez le script

```bash
npm run sync-sheets
```

### 3. C'est tout !

Le script :
- ✅ Liste tous vos Google Sheets
- ✅ Vous choisissez lesquels ajouter (ex: "1,3,5" ou "tous")
- ✅ Les ajoute automatiquement dans `lib/tools.js`
- ✅ Vous dit juste de créer les pages (copiez `capeb.js` comme base)

## 📝 Exemple

```
🚀 Synchronisation simple Google Sheets → Marketplace

📊 Recherche de vos Google Sheets...

📋 5 Google Sheets trouvés :

1. Base Dentistes Paris
   ID: abc123...
   Lien: https://docs.google.com/...

2. Base Avocats France
   ID: def456...
   ...

❓ Quels sheets voulez-vous ajouter ? (ex: 1,3,5 ou "tous") : tous

📊 Analyse de 5 sheet(s)...

✅ Base Dentistes Paris ajouté à tools.js
⚠️  N'oubliez pas de créer la page: pages/marketplace/base-dentistes-paris.js
💡 Copiez pages/marketplace/capeb.js comme base

✅ Terminé !
```

## 🎨 Pour créer les pages

1. Copiez `pages/marketplace/capeb.js`
2. Renommez en `pages/marketplace/[slug].js`
3. Modifiez les données (nom, description, prix, etc.)
4. C'est tout !

## 💡 C'est beaucoup plus simple comme ça, non ?

Pas besoin de :
- ❌ Configuration complexe
- ❌ Templates compliqués
- ❌ Webhooks
- ❌ Automatisation avancée

Juste :
- ✅ Liste vos sheets
- ✅ Vous choisissez
- ✅ Ajoute dans tools.js
- ✅ Vous créez les pages manuellement (mais c'est rapide en copiant capeb.js)

---

**Besoin de la version avancée ?** → `scripts/README-marketplace-automation.md`

