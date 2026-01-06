# 🚀 Quick Start - Marketplace Dynamique

## En 3 étapes

### 1. Installer OpenAI

```bash
npm install
```

Ajoutez dans `.env.local` :
```
OPENAI_API_KEY=sk-votre-cle-ici
```

### 2. Enrichir vos Google Sheets

```bash
npm run enrich-sheets:all
```

Le script va :
- ✅ Scanner votre Google Drive
- ✅ Analyser chaque Sheet
- ✅ Utiliser GPT-4o mini pour enrichir
- ✅ Sauvegarder dans `data/marketplace-databases.json`

### 3. Build et c'est tout !

```bash
npm run build
```

Les pages sont générées automatiquement ! 🎉

## Résultat

- ✅ Pages générées : `/marketplace/[slug]`
- ✅ SEO optimisé automatiquement
- ✅ Descriptions enrichies par GPT
- ✅ Cas d'usage, problèmes/solutions générés

## Workflow quotidien

**Quand vous ajoutez un nouveau Sheet :**

1. Créez le Sheet dans Google Drive
2. Lancez : `npm run enrich-sheets:all`
3. Build : `npm run build`
4. C'est tout ! La page est disponible

## Automatisation (optionnel)

Créez un cron job pour enrichir automatiquement toutes les 6h.

---

**C'est tout !** Votre marketplace est maintenant 100% dynamique 🚀

