# ✅ Bonnes Pratiques - corentinrobert.fr

## 🎨 Design System

### Couleurs
- **Neutres** : `neutral-50` à `neutral-900`
- **Dark mode** : Utiliser `dark:` pour toutes les variations
- **Hover** : `hover:text-neutral-800 dark:hover:text-neutral-100`

### Typographie
- **Titres** : `font-semibold` avec `tracking-tighter`
- **Textes** : `tracking-tight` pour le body
- **Tailles** : `text-2xl` (h1), `text-xl` (h2), `text-lg` (h3)

### Espacement
- **Sections** : `mb-12` ou `mt-12`
- **Éléments** : `mb-8`, `mb-6`, `mb-4`
- **Gaps** : `gap-4` pour les grilles, `space-y-4` pour les listes

### Bordures & Cards
- **Bordures** : `border border-neutral-200 dark:border-neutral-800`
- **Hover** : `hover:border-neutral-300 dark:hover:border-neutral-700`
- **Background** : `bg-neutral-50 dark:bg-neutral-900/50` pour les encadrés

## 🔍 SEO

### Meta Descriptions
- **Longueur** : Entre 120 et 160 caractères
- **Contenu** : Unique, descriptive, avec mots-clés
- **Localisation** : Dans `lib/config.js` → `seo.pages.nomPage.description`

### Titres
- **Format** : `Titre Page | Corentin Robert`
- **Longueur** : Maximum 60 caractères
- **Mots-clés** : En début de titre si possible

### URLs
- **Canonical** : Toujours présent, généré automatiquement
- **Slugs** : En minuscules, avec tirets
- **Structure** : `/blog/[slug]`, `/outils`, `/a-propos`

### Structured Data
- **WebSite** : Sur toutes les pages (via `_app.js`)
- **BlogPosting** : Sur les articles de blog
- **BreadcrumbList** : Sur les pages avec navigation hiérarchique
- **Person** : Sur la page d'accueil et à propos

## 🚀 Performance

### Images
- **next/image** : Toujours utiliser `next/image` au lieu de `<img>`
- **Priority** : `priority={true}` pour les images above the fold
- **Alt text** : Toujours descriptif et contextuel

### Code
- **Imports** : Supprimer les imports inutilisés
- **Lazy loading** : Par défaut avec `next/image`
- **Code splitting** : Automatique avec Next.js

## ♿ Accessibilité

### Liens
- **Externes** : Toujours `rel="noopener noreferrer"`
- **Aria-label** : Pour les icônes sans texte
- **Focus** : Visible et clair

### Navigation
- **Breadcrumbs** : Avec `aria-label="Fil d'Ariane"`
- **Skip links** : Si nécessaire pour l'accessibilité

### Contraste
- **Textes** : Respecter les ratios de contraste WCAG
- **Dark mode** : Tester les deux modes

## 📝 Code

### Structure
- **Composants** : Dans `components/`
- **Utilitaires** : Dans `lib/`
- **Config** : Centralisée dans `lib/config.js`
- **SEO** : Fonctions dans `lib/seo.js`

### Naming
- **Fichiers** : kebab-case (`a-propos.js`)
- **Composants** : PascalCase (`SEOHead.js`)
- **Fonctions** : camelCase (`generatePageSEO`)

### Imports
- **Ordre** : React → Next.js → Composants → Utilitaires → Styles
- **Groupes** : Séparer par une ligne vide

## 🔒 Sécurité

### Liens Externes
- **Toujours** : `target="_blank" rel="noopener noreferrer"`
- **Vérifier** : URLs avant de les ajouter

### API Routes
- **Validation** : Toujours valider les inputs
- **Erreurs** : Ne pas exposer de détails sensibles

## 📊 Données

### Configuration
- **Centralisée** : Tout dans `lib/config.js`
- **Métriques** : Faciles à mettre à jour
- **Projets** : Structure claire avec statuts

### Notion
- **Sync** : Via cron job quotidien
- **Fallback** : Gérer les erreurs gracieusement

## 🎯 Objectifs

### Trust
- **Métriques visibles** : 167 projets, 20 scrapers, etc.
- **Témoignages** : À ajouter depuis Malt
- **Transparence** : Montrer les échecs aussi (comme levelsio)

### Storytelling
- **Section "Maintenant"** : Mise à jour régulière
- **Parcours** : Complet et authentique
- **Projets** : Avec contexte et résultats

## 🔄 Maintenance

### Mises à jour
- **Métriques** : Mettre à jour dans `lib/config.js`
- **Projets** : Ajouter/modifier dans `projects[]`
- **SEO** : Modifier dans `seo.pages.nomPage`

### Tests
- **Local** : `npm run dev`
- **Build** : `npm run build`
- **Lint** : `npm run lint`

## 📈 Évolutions Futures

### Court terme
- [ ] Intégrer API Apify pour métriques live
- [ ] Intégrer API Malt pour témoignages
- [ ] Ajouter page Facecam dans Outils
- [ ] Créer page Open complète

### Moyen terme
- [ ] Analytics avancés
- [ ] A/B testing meta descriptions
- [ ] Rich snippets pour articles
- [ ] Internationalisation si besoin

### Long terme
- [ ] AMP pages
- [ ] Core Web Vitals optimization
- [ ] Schema.org pour services
- [ ] Multi-langue si expansion

