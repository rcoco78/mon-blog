# 🔍 Améliorations Identifiées (sans toucher au design system)

## 🧹 Code mort / Imports inutilisés

1. **`ViewCounter` dans `pages/index.js`** (ligne 3)
   - Importé mais jamais utilisé
   - À supprimer

2. **`Image` dans `components/Layout.js`** (ligne 4)
   - Importé de `next/image` mais jamais utilisé
   - À supprimer

## ⚡ Performance

3. **Image de profil non optimisée** (`pages/index.js` ligne 44)
   - Utilise `<img>` au lieu de `next/image`
   - Pas de lazy loading
   - À remplacer par `next/image` avec `priority={true}` (above the fold)

4. **Gestion d'erreur manquante** (`pages/index.js` ligne 15)
   - Si `posts` est vide ou undefined, le `.map()` peut crasher
   - Ajouter une vérification : `if (!posts || posts.length === 0)`

## ♿ Accessibilité

5. **Alt text de l'image** (`pages/index.js` ligne 46)
   - "Corentin Robert" est correct mais pourrait être plus descriptif
   - Suggestion : "Photo de profil de Corentin Robert"

6. **Liens externes** (footer dans `Layout.js`)
   - Les liens ont déjà `rel="noopener noreferrer"` ✅
   - Pourraient avoir des `aria-label` plus descriptifs pour les lecteurs d'écran

## 🎯 SEO / Contenu

7. **Métriques en dur** (`pages/index.js` lignes 86-104)
   - Les chiffres sont hardcodés
   - Pourraient être dans `lib/config.js` pour faciliter les mises à jour
   - Ou mieux : récupérés depuis une API (Malt, Apify)

8. **Projets en dur** (`pages/index.js` lignes 144-228)
   - Les projets sont hardcodés dans le composant
   - Pourraient être dans `lib/config.js` ou un fichier séparé
   - Faciliterait les mises à jour futures

## 🛡️ Robustesse

9. **Gestion des erreurs API** (`pages/index.js` ligne 15)
   - Si `/api/views/all` échoue, on affiche juste "Chargement..."
   - Pourrait afficher les articles sans les vues en fallback

10. **Vérification des données** (`pages/index.js` ligne 38)
    - `useEffect` s'exécute même si `posts` est vide
    - Ajouter : `if (!posts || posts.length === 0) return`

## 📱 UX

11. **État de chargement** (`pages/index.js` ligne 111)
    - "Chargement des articles populaires..." est correct
    - Mais si l'API échoue, on reste bloqué sur ce message
    - Ajouter un timeout ou un fallback

12. **Liens projets** (`pages/index.js`)
    - Les projets arrêtés n'ont pas de lien (normal)
    - Mais pourraient avoir un lien vers un article/blog post expliquant pourquoi

## 🔧 Structure

13. **Séparation des données**
    - Créer `lib/projects.js` pour les projets
    - Créer `lib/metrics.js` pour les métriques
    - Faciliterait la maintenance

14. **Constantes magiques**
    - `200` (mots par minute) dans `[slug].js` ligne 39
    - `3` (nombre d'articles à afficher) dans `index.js` ligne 27
    - Devraient être des constantes nommées

## ✅ Priorités

### Haute priorité (impact immédiat)
- ✅ Supprimer imports inutilisés
- ✅ Remplacer `<img>` par `next/image`
- ✅ Ajouter vérification `posts` avant `.map()`

### Moyenne priorité (amélioration UX)
- ✅ Gestion d'erreur API avec fallback
- ✅ Déplacer métriques/projets dans config
- ✅ Améliorer alt text image

### Basse priorité (nice to have)
- ⏳ Constantes nommées
- ⏳ Séparation des données
- ⏳ aria-label plus descriptifs

