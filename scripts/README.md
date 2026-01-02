# Scripts Utiles

## 📝 Créer un Article Template

Script pour créer automatiquement un template d'article dans Notion.

### Prérequis

- Variables d'environnement dans `.env.local` :
  - `NOTION_TOKEN` : Token d'API Notion
  - `NOTION_DATABASE_ID` : ID de la base de données Blog

### Usage

```bash
# Via npm
npm run create-article "Titre de l'article" --type=mission
npm run create-article "Titre de l'article" --type=weekly
npm run create-article "Titre de l'article" --type=spontaneous

# Directement
node scripts/create-article-template.js "Titre" --type=mission
```

### Types disponibles

- **mission** : Article court après une mission
  - Tags : `scraping`, `cas-d-usage`, `technique`, `mission`
  - Template : Problème → Solution → Résultat → Apprentissage

- **weekly** : Réflexion hebdomadaire
  - Tags : `réflexion`, `entrepreneuriat`, `processus`, `apprentissage`
  - Template : Observation → Expérience → Impact → Question

- **spontaneous** : Article spontané
  - Tags : `introspection`, `réflexion`, `apprentissage`
  - Template : Inspiration → Point de vue → Importance → Ouverture

### Exemples

```bash
# Après une mission
npm run create-article "Scraping LinkedIn : Comment j'ai extrait 5000 profils en 2h" --type=mission

# Réflexion hebdomadaire
npm run create-article "Pourquoi j'ai arrêté de promettre des délais fixes" --type=weekly

# Article spontané
npm run create-article "Cette API Notion que j'utilise maintenant partout" --type=spontaneous
```

### Ce que fait le script

1. ✅ Crée une nouvelle page dans la base Notion Blog
2. ✅ Remplit les propriétés (Title, Date, Tags, Meta Description)
3. ✅ Ajoute le template de contenu structuré
4. ✅ Retourne le lien Notion pour éditer

**Ensuite** : Tu édites dans Notion et publies. Le site se met à jour automatiquement.

---

## 📚 Documentation

- **Guide complet** : `docs/CREATION-CONTENU.md`
- **Guide rapide** : `docs/GUIDE-RAPIDE-ARTICLES.md`
- **Template Notion** : `docs/TEMPLATE-ARTICLE-NOTION.md`

