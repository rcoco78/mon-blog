# Organisation du Projet

## Structure des Pages

### Marketplace (`/marketplace`)
Page principale qui liste tous les outils et bases de données disponibles, avec filtres par catégorie, type et tarification.

### Outils (`/outils/`)
Dossier contenant les pages individuelles pour chaque **outil interactif** (gratuits ou payants).

**Règles :**
- Tous les outils sont sous `/outils/[slug]`
- Un outil est une application web interactive (générateur, extracteur, dashboard, etc.)
- Les outils peuvent être gratuits ou payants

**Exemples :**
- `/outils/email-generator` - Générateur de templates d'emails
- `/outils/linkedin-extractor` - Extracteur LinkedIn
- `/outils/real-estate-generator` - Générateur de descriptions immobilières
- `/outils/notion-dashboard` - Dashboard Notion

### Bases de Données (`/databases/`)
Dossier contenant les pages individuelles pour chaque **base de données** (gratuites ou payantes).

**Règles :**
- Toutes les bases de données sont sous `/databases/[slug]`
- Une base de données est un fichier de données structurées (CSV, Excel, JSON)
- Les bases de données peuvent être gratuites ou payantes

**Exemples :**
- `/databases/dentistes-parisiens` - Base de données des dentistes parisiens

## Distinction Outils vs Bases de Données

### Outil (`type: 'outil'`)
- Application web interactive
- Utilisé directement dans le navigateur
- Génère ou transforme des données en temps réel
- Exemples : générateurs, extracteurs, dashboards

### Base de Données (`type: 'database'`)
- Fichier de données structurées
- Téléchargement et utilisation locale
- Données statiques ou mises à jour périodiquement
- Formats : CSV, Excel, JSON
- Exemples : listes de contacts, annuaires, données de marché

## Configuration dans `lib/tools.js`

Chaque élément doit avoir :
```javascript
{
  name: 'Nom du produit',
  description: 'Description complète',
  category: 'Catégorie', // Outreach, Scraping, Immobilier, Productivité
  type: 'outil' | 'database', // IMPORTANT : détermine le dossier
  iconSvg: 'nom-icon',
  link: '/outils/[slug]' | '/databases/[slug]', // IMPORTANT : doit correspondre au type
  isPaid: true | false,
  price: 0, // Prix achat unique TTC
  annualPrice: 0, // Prix abonnement annuel TTC (si applicable)
  isNew: true | false,
  date: 'YYYY-MM-DD' // Date de création
}
```

## Sitemap

Le sitemap marketplace (`sitemap-marketplace.xml`) inclut automatiquement tous les outils et bases de données depuis `lib/tools.js`, en utilisant leur propriété `link`.

## Règles de Nommage

### Slugs
- Utiliser des tirets : `email-generator`, `dentistes-parisiens`
- Pas d'accents, pas d'espaces
- En minuscules uniquement

### Fichiers
- Les fichiers de pages doivent correspondre exactement au slug
- Exemple : `/outils/email-generator.js` pour le slug `email-generator`

## Ajout d'un Nouveau Produit

### 1. Déterminer le type
- **Outil** → `/outils/[slug]`
- **Base de données** → `/databases/[slug]`

### 2. Créer la page
- Copier un fichier similaire existant
- Adapter le contenu
- Mettre à jour toutes les références (SEO, structured data, liens)

### 3. Ajouter dans `lib/tools.js`
- Ajouter l'entrée avec le bon `type` et `link`
- Le sitemap sera mis à jour automatiquement

### 4. Vérifier
- La page est accessible à l'URL correcte
- Le sitemap inclut la nouvelle page
- Les liens internes fonctionnent
- Le SEO est correct

## Checklist Ajout Produit

- [ ] Type déterminé (outil ou database)
- [ ] Page créée dans le bon dossier (`/outils/` ou `/databases/`)
- [ ] Slug cohérent entre fichier et `lib/tools.js`
- [ ] Propriété `link` correcte dans `lib/tools.js`
- [ ] Propriété `type` correcte dans `lib/tools.js`
- [ ] SEO configuré (meta tags, structured data)
- [ ] Liens internes mis à jour
- [ ] Sitemap vérifié
- [ ] Test en local




