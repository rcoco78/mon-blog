# Configuration Spotify API

## Vue d'ensemble

La page `/spotify` affiche en temps réel :
- La musique actuellement en cours d'écoute
- Le top 5 des musiques (4 dernières semaines)

## Configuration requise

### 1. Créer une application Spotify

1. Allez sur [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Créez une nouvelle application
3. Notez votre **Client ID** et **Client Secret**

### 2. Configurer les Redirect URIs

Dans les paramètres de votre application Spotify :
- Ajoutez `http://localhost:3000/api/spotify/callback` (pour le développement)
- Ajoutez `https://www.corentinrobert.fr/api/spotify/callback` (pour la production)

### 3. Obtenir un Refresh Token

Pour obtenir un refresh token, vous devez autoriser l'application à accéder à vos données Spotify :

#### Option A : Script d'autorisation (recommandé)

Créez un fichier `scripts/get-spotify-token.js` :

```javascript
const readline = require('readline');
const https = require('https');
const querystring = require('querystring');

const CLIENT_ID = 'VOTRE_CLIENT_ID';
const CLIENT_SECRET = 'VOTRE_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/api/spotify/callback';

// Étape 1 : Générer l'URL d'autorisation
const scopes = [
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-top-read'
].join(' ');

const authUrl = `https://accounts.spotify.com/authorize?` +
  `client_id=${CLIENT_ID}&` +
  `response_type=code&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `scope=${encodeURIComponent(scopes)}`;

console.log('1. Ouvrez cette URL dans votre navigateur :');
console.log(authUrl);
console.log('\n2. Autorisez l\'application');
console.log('3. Copiez le code depuis l\'URL de redirection (paramètre "code")');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\nCollez le code ici : ', async (code) => {
  // Étape 2 : Échanger le code contre un access token et refresh token
  const tokenData = querystring.stringify({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });

  const options = {
    hostname: 'accounts.spotify.com',
    path: '/api/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': tokenData.length
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const tokens = JSON.parse(data);
      console.log('\n✅ Refresh Token obtenu :');
      console.log(tokens.refresh_token);
      console.log('\nAjoutez-le à vos variables d\'environnement :');
      console.log(`SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}`);
    });
  });

  req.on('error', (error) => {
    console.error('Erreur:', error);
  });

  req.write(tokenData);
  req.end();
  
  rl.close();
});
```

Exécutez : `node scripts/get-spotify-token.js`

#### Option B : Via l'interface web

Créez une route `/api/spotify/callback` pour gérer la redirection OAuth.

### 4. Variables d'environnement

Ajoutez dans `.env.local` et dans Vercel :

```bash
SPOTIFY_CLIENT_ID=votre_client_id
SPOTIFY_CLIENT_SECRET=votre_client_secret
SPOTIFY_REFRESH_TOKEN=votre_refresh_token
```

## Scopes nécessaires

L'application nécessite les scopes suivants :
- `user-read-currently-playing` : Pour la musique en cours
- `user-top-read` : Pour le top 5

## Fonctionnement

1. L'API route `/api/spotify/data` utilise le refresh token pour obtenir un access token
2. L'access token est utilisé pour appeler les endpoints Spotify :
   - `/v1/me/player/currently-playing` : Musique en cours
   - `/v1/me/top/tracks` : Top musiques
3. Les données sont mises en cache côté client et rafraîchies toutes les 30 secondes

## Dépannage

### Le refresh token expire

Si le refresh token expire, vous devrez en obtenir un nouveau en suivant l'étape 3.

### Erreur 401 Unauthorized

Vérifiez que :
- Les variables d'environnement sont correctement configurées
- Le refresh token est valide
- Les scopes sont correctement configurés dans l'application Spotify

### Pas de musique en cours

Si vous n'écoutez pas de musique, la section "En ce moment" ne s'affichera pas. C'est normal.



