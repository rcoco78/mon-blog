# Test du Système de Tracking des Clics

## Configuration Locale

Pour tester le système de tracking des clics en local, vous devez configurer la variable d'environnement `BLOB_READ_WRITE_TOKEN`.

### 1. Récupérer le Token Vercel Blob

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Storage** → **Blob**
4. Copiez le **Read/Write Token**

### 2. Configurer en Local

Créez ou modifiez le fichier `.env.local` à la racine du projet :

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Redémarrer le Serveur

Après avoir ajouté la variable d'environnement, redémarrez le serveur de développement :

```bash
npm run dev
```

## Utilisation du Script de Test

Le script `scripts/test-project-clicks.js` permet de simuler des clics pour tester le système.

### Commandes de Base

```bash
# Tester un seul clic sur un projet
node scripts/test-project-clicks.js logement-atypique

# Tester plusieurs clics (ex: 5 clics)
node scripts/test-project-clicks.js logement-atypique 5

# Tester tous les projets (3 clics chacun)
node scripts/test-project-clicks.js all 3

# Tester en production (avec l'URL de base)
node scripts/test-project-clicks.js logement-atypique 10 --url https://www.corentinrobert.fr
```

### Projets Disponibles

- `logement-atypique`
- `contributeurs-apify`
- `outreacher`
- `rare-item-club`
- `instaninja`
- `all` (pour tester tous les projets)

### Exemple de Sortie

```
🧪 Test de tracking des clics
📍 URL de base: http://localhost:3000
🎯 Projet(s): tous
🔢 Nombre de clics: 3

📊 Compteurs initiaux:
──────────────────────────────────────────────────
  logement-atypique        5 clics
  contributeurs-apify      3 clics
  outreacher               2 clics
──────────────────────────────────────────────────

🖱️  Simulation de 3 clics...
  [1/3] Clic sur logement-atypique...
  [1/3] Clic sur contributeurs-apify...
  ...

✅ 15 clics simulés avec succès
⏱️  Durée: 1647ms

📊 Compteurs finaux:
──────────────────────────────────────────────────
  logement-atypique        8 clics
  contributeurs-apify      6 clics
  outreacher               5 clics
──────────────────────────────────────────────────

📈 Différences:
──────────────────────────────────────────────────
  logement-atypique        +3 clics ✓
  contributeurs-apify      +3 clics ✓
  outreacher               +3 clics ✓
──────────────────────────────────────────────────
  Total: +9 clics

✅ Test réussi! Tous les clics ont été enregistrés.
```

## Dépannage

### Erreur "Blob not configured"

Si vous voyez cette erreur, cela signifie que `BLOB_READ_WRITE_TOKEN` n'est pas configuré :

1. Vérifiez que le fichier `.env.local` existe
2. Vérifiez que la variable `BLOB_READ_WRITE_TOKEN` est bien définie
3. Redémarrez le serveur de développement

### Aucun clic enregistré

Si les clics sont simulés mais pas enregistrés :

1. Vérifiez les logs du serveur pour voir les erreurs
2. Vérifiez que le token Vercel Blob est valide
3. Vérifiez que vous avez les permissions nécessaires sur Vercel

### Tester en Production

Pour tester directement en production, utilisez l'option `--url` :

```bash
node scripts/test-project-clicks.js logement-atypique 5 --url https://www.corentinrobert.fr
```

Note : Les clics en production seront réels et affecteront les compteurs de production.

## Architecture

Le système de tracking utilise :

1. **Vercel Blob** : Stockage des événements de clics
2. **Système d'événements** : Chaque clic est stocké comme un événement unique
3. **Compteurs agrégés** : Les compteurs sont calculés à partir des événements
4. **Limite de 1000 événements** : Seuls les 1000 derniers événements sont conservés

Cette approche évite les race conditions et permet un tracking fiable même avec des clics simultanés.




