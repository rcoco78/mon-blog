# Corentin Robert — Freelance scraping & automatisation

Site pro alimenté par Notion : journal public, marketplace et articles métier.

## 🏗️ Structure du Projet

```
mon-blog/
├── components/          # Composants React
│   ├── seo/            # Composants SEO (SEOHead, StructuredData)
│   ├── ui/             # Composants UI réutilisables
│   └── ...             # Autres composants métier
├── lib/                 # Bibliothèques et utilitaires
│   ├── config.js       # Configuration centralisée du site
│   ├── notion.js       # Client Notion API
│   └── analytics.js    # Analytics
├── pages/               # Pages Next.js
│   ├── api/            # API Routes
│   │   └── cron/       # Cron jobs Vercel
│   ├── blog/           # Pages blog
│   └── ...
├── public/              # Assets statiques
└── vercel.json         # Configuration Vercel (cron, redirects, headers)
```

## 🚀 Fonctionnalités

### SEO Optimisé
- Composants SEO dédiés (`SEOHead`, `StructuredData`)
- Métadonnées Open Graph complètes
- Schema.org markup (JSON-LD)
- Sitemap XML automatique
- Canonical URLs
- Meta tags optimisés

### Cron Jobs Vercel
- **Synchronisation Notion** : Tous les jours à 6h00
  - Route: `/api/cron/notion-sync`
- **Synchronisation Blog** : 3 fois par jour (8h, 14h, 20h)
  - Route: `/api/cron/blog-sync`
- **Synchronisation Détails Articles** : 3 fois par jour (9h, 15h, 21h)
  - Route: `/api/cron/blog-details-sync`

### Configuration
- Domaine principal : `corentinrobert.fr`
- Redirections automatiques HTTP → HTTPS
- Redirections www → domaine principal
- Cache optimisé pour les assets statiques

## 📝 Variables d'Environnement

Créer un fichier `.env.local` :

```bash
NOTION_TOKEN=your_notion_token
NOTION_DATABASE_ID=your_database_id
CRON_SECRET=your_cron_secret  # Pour sécuriser les cron jobs
NEXT_PUBLIC_GA_ID=your_ga_id  # Optionnel
```

## 🔧 Développement

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour production
npm run build

# Démarrer en production
npm start
```

## 📦 Structure des Composants SEO

### SEOHead
Composant centralisé pour gérer toutes les métadonnées SEO :
- Meta tags de base
- Open Graph
- Twitter Cards
- Tags d'articles

### StructuredData
Génère le JSON-LD Schema.org pour :
- WebSite
- Organization
- Person
- BlogPosting

## 🔄 Cron Jobs

Les cron jobs sont configurés dans `vercel.json` et nécessitent :
1. Une variable d'environnement `CRON_SECRET`
2. Un header `Authorization: Bearer ${CRON_SECRET}` dans les requêtes

## 📚 Pages Principales

- `/` - Page d'accueil
- `/blog` - Liste des articles
- `/blog/[slug]` - Article individuel
- `/outils` - Outils disponibles
- `/open` - Projets open source (à créer)
- `/a-propos` - À propos

## 🎯 Prochaines Étapes

- [ ] Créer la page `/open` pour les projets
- [ ] Ajouter la page Facecam dans `/outils`
- [ ] Implémenter le système de métadonnées statiques
- [ ] Optimiser les performances (lazy loading, images)
- [ ] Ajouter des tests








