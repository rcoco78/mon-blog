# 📚 Documentation - corentinrobert.fr

Documentation complète et organisée pour comprendre, maintenir et faire évoluer le site.

---

## 🗂️ Structure de la Documentation

### 🎯 [01 - Vision & Objectifs](./01-VISION.md)
**Vision stratégique et objectifs du site**
- Objectif principal et positionnement
- Objectifs stratégiques
- Cible et persona
- Principes directeurs

### 🏗️ [02 - Architecture](./02-ARCHITECTURE.md)
**Architecture technique et structure du code**
- Structure des fichiers et dossiers
- Flux de données
- Système de configuration
- Patterns et conventions de code
- Stack technique

### 🚀 [03 - SEO](./03-SEO.md)
**Optimisation SEO et bonnes pratiques**
- Système SEO centralisé
- Meta tags et Structured Data
- Configuration par page
- Optimisations performance
- Guide de validation SEO

### 🎨 [04 - Design System](./04-DESIGN-SYSTEM.md)
**Documentation complète du design system**
- Couleurs et palette
- Typographie et hiérarchie
- Espacements et layout
- Composants réutilisables
- États et interactions
- Dark mode et responsive

### 🔍 [05 - Audit & Recommandations](./05-AUDIT.md)
**Audit complet et recommandations d'amélioration**
- Audit par page (Homepage, À propos, Témoignages, etc.)
- Améliorations SEO
- Recommandations prioritaires
- Checklist d'amélioration
- Métriques de succès

### ⚙️ [06 - Configuration Technique](./06-CONFIGURATION.md)
**Configuration des services et intégrations**
- Configuration Spotify API
- Système de tracking des clics
- Configuration des redirections
- Variables d'environnement
- Intégrations externes

### 📝 [07 - Changelog](./07-CHANGELOG.md)
**Historique des modifications**
- Versions et changements
- Features ajoutées
- Bugs corrigés
- Évolutions majeures

---

## 🚀 Démarrage Rapide

### Pour un nouveau développeur
1. Lire [Vision & Objectifs](./01-VISION.md) pour comprendre la stratégie
2. Lire [Architecture](./02-ARCHITECTURE.md) pour comprendre la structure
3. Lire [Design System](./04-DESIGN-SYSTEM.md) pour comprendre le style
4. Consulter [Audit & Recommandations](./05-AUDIT.md) pour voir les améliorations prévues

### Pour modifier le SEO
1. Consulter [SEO](./03-SEO.md)
2. Modifier `lib/config.js` → `seo.pages.nomPage`
3. Utiliser `generatePageSEO()` dans la page

### Pour ajouter une fonctionnalité
1. Vérifier [Architecture](./02-ARCHITECTURE.md) pour la structure
2. Suivre [Design System](./04-DESIGN-SYSTEM.md) pour le style
3. Mettre à jour [Changelog](./07-CHANGELOG.md) après implémentation

### Pour configurer un service
1. Consulter [Configuration Technique](./06-CONFIGURATION.md)
2. Suivre les instructions spécifiques au service

---

## 📊 Vue d'Ensemble du Projet

### Stack Technique
- **Framework** : Next.js 14.2.26
- **Styling** : Tailwind CSS
- **CMS** : Notion API
- **Deployment** : Vercel
- **Theme** : next-themes (dark/light mode)

### Structure Principale
```
mon-blog/
├── components/     # Composants React réutilisables
├── lib/           # Utilitaires et configuration
├── pages/         # Pages Next.js (routes)
├── public/        # Assets statiques
├── styles/        # Styles globaux
└── docs/          # Documentation (ce dossier)
```

### Points Clés
- ✅ **SEO centralisé** : Toute la config SEO dans `lib/config.js`
- ✅ **Design System** : Cohérent et respecté partout
- ✅ **Performance** : Optimisations images, lazy loading
- ✅ **Accessibilité** : WCAG 2.1 niveau AA
- ✅ **Documentation** : Complète et à jour

---

## 🔗 Liens Rapides

- [Vision & Objectifs](./01-VISION.md)
- [Architecture du Code](./02-ARCHITECTURE.md)
- [Guide SEO Complet](./03-SEO.md)
- [Design System](./04-DESIGN-SYSTEM.md)
- [Audit & Recommandations](./05-AUDIT.md)
- [Configuration Technique](./06-CONFIGURATION.md)
- [Changelog](./07-CHANGELOG.md)

---

## 📝 Notes Importantes

- **Design System** : Ne jamais modifier sans validation
- **SEO** : Toujours vérifier avec les outils de validation
- **Performance** : Maintenir Lighthouse >90
- **Documentation** : Mettre à jour lors de chaque changement majeur

---

## 🤝 Contribution

Pour contribuer au projet :
1. Lire la documentation pertinente
2. Suivre les bonnes pratiques
3. Tester localement
4. Mettre à jour la documentation si nécessaire

---

**Dernière mise à jour** : Janvier 2025
