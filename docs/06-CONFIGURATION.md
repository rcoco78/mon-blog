# ⚙️ Configuration Technique - corentinrobert.fr

**Guide de configuration des services et intégrations**

---

## 🎵 Configuration Spotify API

### Vue d'ensemble

La page `/spotify` affiche en temps réel :
- La musique actuellement en cours d'écoute
- Le top 5 des musiques (4 dernières semaines)

### Configuration requise

#### 1. Créer une application Spotify

1. Allez sur [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Créez une nouvelle application
3. Notez votre **Client ID** et **Client Secret**

#### 2. Configurer les Redirect URIs

Dans les paramètres de votre application Spotify :
- Ajoutez `http://localhost:3000/api/spotify/callback` (pour le développement)
- Ajoutez `https://www.corentinrobert.fr/api/spotify/callback` (pour la production)

#### 3. Obtenir un Refresh Token

Pour obtenir un refresh token, vous devez autoriser l'application à accéder à vos données Spotify :

##### Option A : Script d'autorisation (recommandé)

Créez un fichier `scripts/get-spotify-token.js` :

```javascript
const querystring = require('querystring');
const https = require('https');

const CLIENT_ID = 'votre_client_id';
const CLIENT_SECRET = 'votre_client_secret';
const REDIRECT_URI = 'http://localhost:3000/api/spotify/callback';

// Étape 1 : Obtenir l'URL d'autorisation
const scopes = 'user-read-currently-playing user-top-read';
const authUrl = `https://accounts.spotify.com/authorize?` +
  querystring.stringify({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: scopes
  });

console.log('1. Ouvrez cette URL dans votre navigateur :');
console.log(authUrl);
console.log('\n2. Autorisez l\'application');
console.log('3. Copiez le code depuis l\'URL de redirection (paramètre "code")');
```

##### Option B : Via navigateur

1. Visitez l'URL d'autorisation générée
2. Autorisez l'application
3. Copiez le code depuis l'URL de redirection
4. Échangez le code contre un access token et refresh token

#### 4. Configurer les variables d'environnement

Créez ou modifiez le fichier `.env.local` :

```bash
SPOTIFY_CLIENT_ID=votre_client_id
SPOTIFY_CLIENT_SECRET=votre_client_secret
SPOTIFY_REFRESH_TOKEN=votre_refresh_token
```

#### 5. Redémarrer le serveur

Après avoir ajouté les variables d'environnement, redémarrez le serveur de développement :

```bash
npm run dev
```

---

## 📊 Système de Tracking des Clics

### Configuration Locale

Pour tester le système de tracking des clics en local, vous devez configurer la variable d'environnement `BLOB_READ_WRITE_TOKEN`.

#### 1. Récupérer le Token Vercel Blob

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Storage** → **Blob**
4. Copiez le **Read/Write Token**

#### 2. Configurer en Local

Créez ou modifiez le fichier `.env.local` à la racine du projet :

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 3. Redémarrer le Serveur

Après avoir ajouté la variable d'environnement, redémarrez le serveur de développement :

```bash
npm run dev
```

### Utilisation du Script de Test

Un script de test est disponible pour vérifier le fonctionnement du système :

```bash
node scripts/test-clicks.js
```

Ce script :
- Teste l'enregistrement d'un clic
- Teste la récupération des statistiques
- Affiche les résultats dans la console

---

## 🔄 Configuration des Redirections

### Problème de Boucle de Redirection

#### Symptôme
- `ERR_TOO_MANY_REDIRECTS` sur `www.corentinrobert.fr`
- Boucle : `corentinrobert.fr` → `www.corentinrobert.fr` → `corentinrobert.fr`

#### Cause
Vercel redirige automatiquement `corentinrobert.fr` vers `www.corentinrobert.fr` (probablement via configuration DNS ou Vercel), alors que notre `vercel.json` redirige `www` → `non-www`.

### ✅ Solution

#### Option 1 : Configuration Vercel (Recommandé)

Dans le dashboard Vercel :
1. **Settings** → **Domains**
2. Vérifier que `corentinrobert.fr` est le domaine **principal**
3. Si `www.corentinrobert.fr` est ajouté :
   - Soit le **supprimer** complètement
   - Soit le configurer pour rediriger vers `corentinrobert.fr` (pas l'inverse)

#### Option 2 : Configuration DNS (OVH)

Si vous gardez les deux domaines :
1. **Domaine racine** (`corentinrobert.fr`) : A record vers IP Vercel
2. **www** (`www.corentinrobert.fr`) : CNAME vers `corentinrobert.fr`
3. Laisser Vercel gérer la redirection via le dashboard

#### Option 3 : Vercel.json uniquement

Si vous voulez gérer tout via `vercel.json`, assurez-vous que :
- Le domaine principal dans Vercel est `corentinrobert.fr`
- Le `vercel.json` redirige `www` → `non-www`
- Pas de redirection DNS qui interfère

### Configuration actuelle

Le fichier `vercel.json` contient :

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "www.corentinrobert.fr"
        }
      ],
      "destination": "https://corentinrobert.fr/:path*",
      "permanent": true
    }
  ]
}
```

Cette configuration redirige toutes les requêtes depuis `www.corentinrobert.fr` vers `corentinrobert.fr`.

---

## 🔐 Variables d'Environnement

### Variables Requises

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```bash
# Spotify API
SPOTIFY_CLIENT_ID=votre_client_id
SPOTIFY_CLIENT_SECRET=votre_client_secret
SPOTIFY_REFRESH_TOKEN=votre_refresh_token

# Vercel Blob (pour tracking des clics)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Notion API (si utilisé)
NOTION_API_KEY=votre_notion_api_key
NOTION_DATABASE_ID=votre_database_id

# Google Analytics (si utilisé)
GOOGLE_ANALYTICS_ID=votre_ga_id
```

### Variables en Production

Sur Vercel, configurez ces variables dans :
1. **Settings** → **Environment Variables**
2. Ajoutez chaque variable pour les environnements appropriés (Production, Preview, Development)

---

## 🔗 Intégrations Externes

### Notion API

Le site utilise Notion comme CMS pour les articles de blog.

#### Configuration

1. Créez une intégration Notion sur [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Partagez votre base de données Notion avec l'intégration
3. Copiez l'API Key dans `.env.local` :

```bash
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Google Analytics

Le site utilise Umami Analytics (privacy-friendly).

#### Configuration

Le script Umami est déjà intégré dans `pages/_document.js` :

```javascript
<script
  defer
  src="https://cloud.umami.is/script.js"
  data-website-id="34057468-2b5a-4874-82ba-3e8b93514c2e"
></script>
```

### Calendly

Le site intègre Calendly pour la prise de rendez-vous.

#### Configuration

Le widget Calendly est chargé dynamiquement via JavaScript. L'URL du calendrier est :

```
https://calendly.com/corentinrobert/20min
```

Pour modifier l'URL, cherchez `calendly.com/corentinrobert/20min` dans le code.

---

## 🛠️ Dépannage

### Spotify ne fonctionne pas

1. Vérifiez que les variables d'environnement sont correctement configurées
2. Vérifiez que le refresh token est valide
3. Vérifiez les logs de l'API route `/api/spotify/now-playing`

### Tracking des clics ne fonctionne pas

1. Vérifiez que `BLOB_READ_WRITE_TOKEN` est configuré
2. Vérifiez que Vercel Blob est activé pour votre projet
3. Vérifiez les logs de l'API route `/api/projects/clicks`

### Redirections en boucle

1. Vérifiez la configuration DNS
2. Vérifiez la configuration Vercel
3. Vérifiez le fichier `vercel.json`

---

**Dernière mise à jour** : Janvier 2025

