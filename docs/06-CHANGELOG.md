# 📝 Changelog - corentinrobert.fr

**Historique des modifications et évolutions**

---

## [2025-01-XX] - Restructuration Complète

### ✨ Ajouté
- **Section "Maintenant"** sur la homepage
- **Métriques de confiance** (167 projets, 20 scrapers, etc.)
- **Projets avec statuts** (Actif/Arrêté)
- **Système SEO centralisé** (`lib/seo.js`)
- **Configuration SEO par page** dans `lib/config.js`
- **Composant SEOHead amélioré** avec tous les meta tags
- **StructuredData enrichi** (BreadcrumbList, Service, Person amélioré)
- **Page Open** pour projets open source
- **Robots.txt** configuré
- **Composants d'erreur** (`404.js`, `_error.js`)
- **Documentation complète** dans `docs/`

### 🔄 Modifié
- **Homepage** : Restructurée avec section "Maintenant", métriques, projets
- **Navigation** : Liens sociaux retirés, ajoutés dans footer
- **Footer** : Ajout GitHub et Fiverr
- **Breadcrumb** : Amélioré avec StructuredData et slug réel
- **Image de profil** : Remplacé `<img>` par `next/image`
- **Projets** : Rendu dynamique depuis config
- **Métriques** : Rendu dynamique depuis config

### 🗑️ Supprimé
- **Code mort** : `mockProjects`, imports inutilisés
- **Newsletter** : Retirée du footer et des articles
- **Séparateurs "·"** : Retirés de la navigation et du blog
- **Section contact/liens sociaux** : Retirée de la homepage

### 🐛 Corrigé
- **Dark/Light mode** : Switch fonctionne correctement à chaque clic
- **Meta description** : Duplication corrigée dans `[slug].js`
- **Balises fermantes** : Erreurs de structure corrigées
- **Imports** : Nettoyage des imports inutilisés

### 🔍 SEO
- **Meta descriptions** : Optimisées pour toutes les pages (120-160 caractères)
- **Titres SEO** : Format "Titre | Corentin Robert"
- **Keywords** : Spécifiques par page
- **Open Graph** : Complet avec toutes les propriétés
- **Twitter Cards** : Configurées
- **Structured Data** : WebSite, Organization, Person, BlogPosting, BreadcrumbList
- **Canonical URLs** : Générées automatiquement
- **Robots** : Directives appropriées

### 📚 Documentation
- **README.md** : Index principal de la documentation
- **01-ARCHITECTURE.md** : Architecture et structure du projet
- **02-SEO.md** : SEO et performance
- **03-BONNES-PRATIQUES.md** : Standards et conventions
- **04-PROCHAINES-ETAPES.md** : Roadmap et plan d'action
- **05-AUDIT-AMELIORATIONS.md** : Audit et améliorations
- **06-CHANGELOG.md** : Historique des modifications

## Prochaines Étapes

### À faire
- [ ] Page Facecam dans Outils avec article et vidéo
- [ ] Intégration API Apify pour métriques live
- [ ] Intégration API Malt pour témoignages
- [ ] Améliorer page À propos avec parcours complet
- [ ] Ajouter témoignages réels de Malt

### En cours
- ✅ SEO complet et scalable
- ✅ Structure centralisée
- ✅ Design system respecté

