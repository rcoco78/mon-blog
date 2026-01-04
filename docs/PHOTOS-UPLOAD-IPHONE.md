# 📸 Guide - Upload Photos depuis iPhone

**Comment partager des photos depuis ton iPhone directement vers ton site**

---

## 🎯 Fonctionnement

Un endpoint API sécurisé permet d'uploader des photos depuis ton iPhone. Les photos sont stockées dans Vercel Blob Storage et apparaissent automatiquement sur la page `/photos`.

**✨ Nouvelle méthode simplifiée** : Upload direct via FormData (plus besoin de base64, compression, etc.)

---

## 🔐 Configuration Requise

### 1. Variable d'Environnement

Ajouter dans `.env.local` (et dans les variables d'environnement Vercel) :

```bash
PHOTOS_UPLOAD_SECRET=ton_secret_token_ici
```

**Important** : Utilise un token fort et unique (ex: généré avec `openssl rand -hex 32`)

---

## 📱 Configuration iPhone avec Shortcuts (Méthode Simplifiée)

### Étape 1 : Créer le Shortcut

1. Ouvrir l'app **Shortcuts** sur iPhone
2. Cliquer sur **"+"** pour créer un nouveau raccourci
3. Nommer le raccourci : **"Partager Photo sur Site"**

### Étape 2 : Ajouter les Actions

#### Action 1 : Obtenir les Photos
- Ajouter l'action **"Obtenir les photos"**
- Sélectionner : **"Sélectionner des photos"** ou **"Dernière photo"**

#### Action 2 : Obtenir la Date (Optionnel)
- Ajouter l'action **"Obtenir la date actuelle"**
- Format : **Personnalisé**
- Format personnalisé : `YYYY-MM-DD` (ex: 2025-01-20)

#### Action 3 : Faire une Requête HTTP
- Ajouter l'action **"Faire une requête HTTP"**
- **Méthode** : POST
- **URL** : `https://www.corentinrobert.fr/api/photos/upload`
- **En-têtes** :
  - Cliquer sur **"+"** pour ajouter un en-tête
  - Colonne **"Clé"** : `Authorization`
  - Colonne **"Texte"** : `Bearer TON_SECRET_TOKEN` (remplacer par ton token)
  - **Note** : Le Content-Type `multipart/form-data` est automatiquement ajouté par Shortcuts quand tu sélectionnes "Fichier" comme type de corps. Tu n'as pas besoin de l'ajouter manuellement.
- **Corps** :
  - Sélectionner le type : **Fichier** (pas JSON, pas Texte)
  - Connecter la photo (résultat de l'action "Obtenir les photos")
  - **Important** : Le nom du champ doit être `image` (pas "photo", "file", etc.)
  
  **Comment configurer le corps FormData :**
  - Dans la section "Corps", sélectionner **"Fichier"** (pas JSON)
  - Cliquer dans le champ de nom (par défaut peut être "Fichier" ou vide)
  - Taper : `image` (c'est le nom que l'API attend)
  - Cliquer dans le champ de valeur
  - Sélectionner la variable **"Photos"** (résultat de "Obtenir les photos")
  
  **Si tu vois une erreur "Invalid JSON body" :**
  - Vérifie que le type de corps est bien **"Fichier"** (pas JSON)
  - Vérifie que le nom du champ est bien `image`
  - Si nécessaire, ajoute manuellement l'en-tête `Content-Type: multipart/form-data`

#### Action 4 : Afficher le Résultat
- Ajouter l'action **"Afficher la notification"**
- Titre : "Photo partagée !"
- Message : Résultat de la requête HTTP

---

## 📋 Structure Simplifiée du Shortcut

```
1. Obtenir les photos
   └─> Sélectionner des photos
   
2. Obtenir la date actuelle (Optionnel)
   └─> Format personnalisé : YYYY-MM-DD
   
3. Faire une requête HTTP
   └─> POST https://www.corentinrobert.fr/api/photos/upload
   └─> Headers : Authorization: Bearer TON_SECRET
   └─> Body : Type Fichier → Photos (nom du champ: "image")
   
4. Afficher la notification
   └─> "Photo partagée avec succès !"
```

**C'est tout !** Plus besoin de :
- ❌ Base64
- ❌ Compression
- ❌ Redimensionnement
- ❌ Dictionnaire complexe

---

## 🔧 Détails Techniques

### Format de la Requête

**URL** : `POST /api/photos/upload`

**Headers** :
```
Authorization: Bearer TON_SECRET_TOKEN
Content-Type: multipart/form-data (automatique)
```

**Body (FormData)** :
- `image` : Fichier image (JPEG, PNG, etc.)
- `date` : (Optionnel) Date au format YYYY-MM-DD
- `location` : (Optionnel) Localisation
- `alt` : (Optionnel) Description de la photo

### Réponse Succès

```json
{
  "success": true,
  "photo": {
    "date": "2025-01-20",
    "src": "https://xxx.public.blob.vercel-storage.com/photos/xxx.jpg",
    "alt": "Photo personnelle",
    "location": null
  },
  "message": "Photo uploadée avec succès"
}
```

### Réponse Erreur

```json
{
  "error": "Message d'erreur"
}
```

---

## 🎨 Options Avancées

### Ajouter la Localisation Automatiquement

1. Dans Shortcuts, ajouter l'action **"Obtenir la localisation actuelle"**
2. Formater la localisation (ex: "Ville, Pays")
3. Dans la requête HTTP, ajouter un champ FormData :
   - Nom : `location`
   - Valeur : Localisation obtenue

### Ajouter une Description

1. Ajouter l'action **"Demander une entrée"**
2. Type : Texte
3. Question : "Description de la photo ?"
4. Dans la requête HTTP, ajouter un champ FormData :
   - Nom : `alt`
   - Valeur : Description saisie

### Partager depuis l'App Photos

1. Dans l'app Photos, sélectionner une photo
2. Cliquer sur **Partager**
3. Sélectionner le shortcut **"Partager Photo sur Site"**
4. La photo est uploadée automatiquement

---

## 🚀 Utilisation Rapide

### Méthode 1 : Depuis l'App Photos
1. Ouvrir une photo
2. Cliquer sur **Partager**
3. Sélectionner le shortcut
4. La photo est uploadée automatiquement

### Méthode 2 : Depuis le Widget Shortcuts
1. Ajouter le widget Shortcuts à l'écran d'accueil
2. Cliquer sur le shortcut
3. Sélectionner la photo
4. La photo est uploadée automatiquement

### Méthode 3 : Depuis l'App Shortcuts
1. Ouvrir l'app Shortcuts
2. Lancer le shortcut
3. Sélectionner la photo
4. La photo est uploadée automatiquement

---

## 🔒 Sécurité

### Protection de l'Endpoint

L'endpoint est protégé par un token secret :
- ✅ Seules les requêtes avec le bon token sont acceptées
- ✅ Le token doit être dans le header `Authorization: Bearer TOKEN`
- ✅ Sans token valide, retourne 401 Unauthorized

### Bonnes Pratiques

- ✅ Ne jamais partager le token publiquement
- ✅ Utiliser un token fort et unique
- ✅ Régénérer le token si compromis
- ✅ Stocker le token dans les variables d'environnement Vercel

---

## 🐛 Dépannage

### Erreur 401 Unauthorized
- Vérifier que le token dans Shortcuts correspond à `PHOTOS_UPLOAD_SECRET`
- Vérifier le format : `Bearer TOKEN` (avec espace)

### Erreur 400 Bad Request - "Image is required"
- Vérifier que le champ FormData s'appelle bien `image` (pas "photo", "file", etc.)
- Vérifier que le type du corps est bien **"Fichier"** (pas JSON)

### Erreur 413 Request Entity Too Large
- **Cause** : L'image est trop grande (limite: 10 MB)
- **Solution** : 
  - L'endpoint accepte maintenant jusqu'à 10 MB
  - Si l'erreur persiste, réduire la résolution de la photo dans l'app Photos avant l'upload

### Erreur 500 Internal Server Error
- Vérifier les logs Vercel pour plus de détails
- Vérifier que Vercel Blob Storage est configuré

### Photo n'apparaît pas sur le site
- Attendre quelques secondes (cache)
- Vider le cache du navigateur
- Vérifier que la photo est bien dans Blob Storage

---

## 📝 Notes

- Les photos sont stockées dans Vercel Blob Storage sous `/photos/`
- Les métadonnées sont stockées dans `photos.json` dans Blob Storage
- Les photos sont triées par date décroissante (plus récent en premier)
- Les photos sont accessibles publiquement (URLs publiques)
- **Limite de taille** : Maximum 10 MB par image
- **Format supporté** : JPEG, PNG, et autres formats d'image courants
- **Avantage FormData** : Pas besoin de compression/redimensionnement côté client, l'iPhone envoie la photo directement

---

## 🔄 Migration depuis l'Ancienne Méthode (Base64)

Si tu utilisais l'ancienne méthode avec base64, tu peux maintenant simplifier ton Shortcut :

**Ancienne méthode** (complexe) :
- ❌ Obtenir photos → Redimensionner → Convertir → Encoder Base64 → Créer préfixe → Combiner → Dictionnaire → Requête HTTP

**Nouvelle méthode** (simple) :
- ✅ Obtenir photos → Requête HTTP (type Fichier)

L'endpoint accepte toujours l'ancien format JSON/base64 pour compatibilité, mais la nouvelle méthode FormData est recommandée.

---

**Dernière mise à jour** : Janvier 2025
