# 🏗️ Architecture - corentinrobert.fr

## 📦 Structure des Fichiers

```
mon-blog/
├── docs/                          # Documentation
│   ├── README.md                  # Index
│   ├── AUDIT_STRUCTURE.md         # Audit structure
│   ├── AMELIORATIONS.md           # Améliorations
│   ├── SEO_IMPLEMENTATION.md     # SEO
│   ├── BONNES_PRATIQUES.md       # Bonnes pratiques
│   └── ARCHITECTURE.md            # Ce fichier
│
├── components/                     # Composants React
│   ├── seo/                       # Composants SEO
│   │   ├── SEOHead.js            # Meta tags, OG, Twitter
│   │   └── StructuredData.js    # Schema.org JSON-LD
│   ├── Layout.js                  # Layout principal (nav, footer)
│   ├── Breadcrumb.js             # Navigation hiérarchique
│   └── ...                        # Autres composants
│
├── lib/                            # Bibliothèques et utilitaires
│   ├── config.js                  # Configuration centralisée
│   │   ├── siteConfig             # Config générale
│   │   ├── metrics                # Métriques de confiance
│   │   ├── projects               # Projets avec statuts
│   │   └── seo                    # Config SEO par page
│   ├── seo.js                     # Utilitaires SEO
│   │   ├── generateMetaDescription()
│   │   ├── generateSEOTitle()
│   │   ├── generateCanonicalUrl()
│   │   ├── generateKeywords()
│   │   ├── validateMetaDescription()
│   │   └── generatePageSEO()
│   └── notion.js                  # Client Notion API
│
├── pages/                          # Pages Next.js
│   ├── _app.js                    # App wrapper (Theme, SEO global)
│   ├── _document.js               # Document HTML (lang, meta)
│   ├── _error.js                  # Gestionnaire d'erreurs global
│   ├── 404.js                     # Page 404 personnalisée
│   ├── index.js                   # Homepage
│   ├── blog.js                    # Liste des articles
│   ├── blog/[slug].js            # Article individuel
│   ├── outils.js                  # Page outils
│   ├── a-propos.js                # Page à propos
│   ├── open.js                    # Projets open source
│   ├── contact.js                 # Page contact
│   ├── sitemap.xml.js            # Sitemap XML
│   └── api/                       # API Routes
│       ├── cron/                  # Cron jobs Vercel
│       │   ├── notion-sync.js    # Sync Notion quotidien
│       │   └── sitemap.js        # Régénération sitemap
│       └── ...
│
├── public/                         # Assets statiques
│   ├── robots.txt                 # Configuration robots
│   └── images/                    # Images
│
├── styles/                         # Styles globaux
│   └── globals.css                # Tailwind + styles custom
│
└── vercel.json                     # Configuration Vercel
    ├── cron                        # Jobs planifiés
    ├── redirects                  # Redirections
    └── headers                    # Headers SEO
```

## 🔄 Flux de Données

### Homepage (`pages/index.js`)
```
getStaticProps()
  └─> getAllPosts() (Notion API)
      └─> useEffect() (client-side)
          └─> /api/views/all
              └─> Affiche top 3 articles
```

### Blog (`pages/blog.js`)
```
getStaticProps()
  └─> getAllPosts() (Notion API)
      └─> Filtrage client-side (tags, search)
```

### Article (`pages/blog/[slug].js`)
```
getStaticPaths()
  └─> getAllPosts() (Notion API)
      └─> Génère tous les slugs

getStaticProps()
  └─> getPostBySlug() (Notion API)
      └─> getPostBlocks() (Notion API)
          └─> Affiche article complet
```

## 🎯 Système SEO

### Génération SEO par Page
```javascript
// 1. Config dans lib/config.js
seo: {
  pages: {
    home: {
      title: "...",
      description: "...",
      keywords: [...]
    }
  }
}

// 2. Utilisation dans la page
const pageSEO = generatePageSEO({
  title: siteConfig.seo.pages.home.title,
  description: siteConfig.seo.pages.home.description,
  path: '/',
  keywords: siteConfig.seo.pages.home.keywords
})

// 3. Application
<SEOHead {...pageSEO} />
```

### Structured Data
```javascript
// Global (toutes les pages)
<StructuredData type="WebSite" />
<StructuredData type="Organization" />
<StructuredData type="Person" />

// Articles
<StructuredData type="BlogPosting" data={{...}} />

// Navigation
<StructuredData type="BreadcrumbList" data={{items: [...]}} />
```

## 🔧 Configuration Centralisée

### `lib/config.js` Structure
```javascript
{
  // Site général
  url, name, title, description, author,
  
  // Social
  social: { linkedin, malt },
  twitter: { handle, site },
  
  // Homepage
  homepage: { topPostsCount: 3 },
  
  // Métriques
  metrics: [{ value, label, source }],
  
  // Projets
  projects: [{ title, description, link, status }],
  
  // SEO
  seo: {
    defaultDescription: "...",
    baseKeywords: [...],
    pages: {
      home: { title, description, keywords },
      blog: { ... },
      // etc.
    }
  }
}
```

## 🚀 Déploiement

### Vercel Configuration
- **Cron Jobs** : Notion sync (6h), Sitemap (8h)
- **Redirects** : www → domaine principal
- **Headers** : Cache, SEO headers

### Build Process
1. `getStaticProps` : Récupère données Notion
2. Génère pages statiques
3. Optimise images
4. Génère sitemap
5. Déploie sur Vercel

## 📊 Performance

### Optimisations
- **Static Generation** : Toutes les pages sont statiques
- **ISR** : Revalidation toutes les 60 secondes
- **Image Optimization** : next/image automatique
- **Code Splitting** : Automatique avec Next.js

### Monitoring
- **Analytics** : Google Analytics (si configuré)
- **Vercel Analytics** : Intégré
- **Core Web Vitals** : À suivre dans Search Console

## 🔐 Sécurité

### Headers (vercel.json)
- **X-Frame-Options** : DENY
- **X-Content-Type-Options** : nosniff
- **Referrer-Policy** : strict-origin-when-cross-origin

### API Routes
- **Validation** : Toujours valider les inputs
- **Rate Limiting** : À implémenter si nécessaire
- **Cron Secret** : Protection des cron jobs

## 🎨 Design System

### Tailwind Config
- **Couleurs** : neutral-* (50-900)
- **Dark mode** : Via `next-themes`
- **Responsive** : sm:, md:, lg: breakpoints

### Composants Réutilisables
- **Layout** : Navigation + Footer
- **SEOHead** : Meta tags
- **StructuredData** : Schema.org
- **Breadcrumb** : Navigation hiérarchique

## 📝 Maintenance

### Mises à jour Fréquentes
1. **Métriques** : Dans `lib/config.js` → `metrics`
2. **Projets** : Dans `lib/config.js` → `projects`
3. **Section "Maintenant"** : Dans `pages/index.js`

### Mises à jour Occasionnelles
1. **SEO** : Dans `lib/config.js` → `seo.pages`
2. **Structure** : Ajouter pages dans `pages/`
3. **Composants** : Créer dans `components/`

## 🔄 Évolutions Futures

### Court terme
- API Apify pour métriques live
- API Malt pour témoignages
- Page Facecam dans Outils

### Moyen terme
- Analytics avancés
- A/B testing
- Rich snippets

### Long terme
- AMP pages
- i18n si besoin
- Core Web Vitals optimization

