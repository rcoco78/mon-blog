# Script de Génération des Données Personnalisées

Ce script génère automatiquement les données personnalisées pour tous les cas d'usage en utilisant GPT-4o mini.

## 🚀 Installation

1. **Installer les dépendances** (si nécessaire) :
```bash
npm install
```

2. **Configurer la clé API OpenAI** :
Ajoutez dans votre fichier `.env.local` :
```bash
OPENAI_API_KEY=sk-votre-cle-api
```

Ou exportez-la directement :
```bash
export OPENAI_API_KEY=sk-votre-cle-api
```

## 📖 Usage

### Générer pour tous les cas d'usage
```bash
npm run generate-personalized
```

### Reprendre là où on s'est arrêté
```bash
npm run generate-personalized-resume
```

### Tester avec seulement 10 cas d'usage
```bash
npm run generate-personalized-test
```

### Options avancées
```bash
# Limiter à N cas d'usage
node scripts/generate-personalized-case-studies.js --limit=50

# Reprendre + limiter
node scripts/generate-personalized-case-studies.js --resume --limit=100
```

## ⚙️ Fonctionnement

1. **Charge** tous les cas d'usage depuis `lib/case-studies.js`
2. **Vérifie** quels cas sont déjà traités (dans `lib/case-studies-personalized.js`)
3. **Génère** les données personnalisées avec GPT-4o mini pour chaque cas
4. **Sauvegarde** progressivement dans `lib/case-studies-personalized.js`
5. **Enregistre** le progrès dans `.personalized-progress.json`

## 📊 Données générées

Pour chaque cas d'usage, le script génère :
- **whyUseCase** : Problèmes résolus, exemples concrets, impact business
- **benefits** : Introduction personnalisée pour la section bénéfices
- **dataExample** : Colonnes et 3 lignes d'exemple de données
- **hasContactData** : Booléen indiquant si les données contiennent des contacts

## ⏱️ Rate Limiting

Le script attend **1 seconde** entre chaque requête pour respecter les limites de l'API OpenAI.

Pour 6500 cas d'usage :
- Temps estimé : ~2 heures (avec 1s de délai)
- Coût estimé GPT-4o mini : ~$5-10 (selon la longueur des réponses)

## 🔄 Reprise après interruption

Le script peut être interrompu et repris :
- Utilisez `--resume` pour reprendre
- Les cas déjà traités sont automatiquement ignorés
- Le progrès est sauvegardé dans `.personalized-progress.json`

## 🛠️ Dépannage

### Erreur "OPENAI_API_KEY n'est pas définie"
Vérifiez que la variable d'environnement est bien définie :
```bash
echo $OPENAI_API_KEY
```

### Erreur de parsing JSON
Le script essaie d'extraire le JSON même s'il est dans un bloc markdown. Si ça échoue, vérifiez la réponse de l'API.

### Fichier case-studies.js non trouvé
Vérifiez que le fichier existe bien dans `lib/case-studies.js`

## 📝 Notes

- Le script écrase le fichier `case-studies-personalized.js` à la première écriture
- Ensuite, il ajoute les nouveaux cas à la fin
- Les 3 premiers cas d'usage (Walmart, Zillow, Leads) sont déjà personnalisés manuellement et seront ignorés si `--resume` est utilisé








