# Guide : Ajouter un Nouveau Produit Payant

Ce guide explique comment ajouter un nouveau produit payant (outil ou base de données) au système.

## 📋 Étapes

### 1. Ajouter le produit dans `lib/tools.js`

Ajoutez une nouvelle entrée dans le tableau `tools` :

```javascript
{
  name: 'Nom du Produit',
  description: 'Description du produit...',
  category: 'Scraping', // ou 'Outreach', 'Immobilier', 'Productivité'
  type: 'database', // ou 'outil'
  iconSvg: 'search', // ou 'email', 'house', 'grid'
  link: '/outils/slug-du-produit',
  isPaid: true,        // ← Important : true pour un produit payant
  price: 99,           // ← Prix en euros
  isNew: true,
  date: '2024-01-25'
}
```

### 2. Ajouter le prix dans `pages/api/tools/create-checkout.js`

Ajoutez une entrée dans l'objet `toolPrices` :

```javascript
const toolPrices = {
  'dentistes-parisiens': {
    name: 'Base de données - Dentistes Parisiens',
    price: 49,
    description: 'Base de données complète des dentistes à Paris (500+ entrées)'
  },
  // Ajoutez votre nouveau produit ici :
  'slug-du-produit': {
    name: 'Nom du Produit',
    price: 99, // Prix en euros
    description: 'Description qui apparaîtra dans Stripe Checkout'
  }
}
```

**Important :** Le `toolId` (clé de l'objet) doit correspondre au slug dans `link` de `lib/tools.js` (sans le préfixe `/outils/`).

### 3. Créer la page du produit

Créez un fichier dans `pages/outils/[slug-du-produit].js` en vous basant sur `pages/outils/dentistes-parisiens.js`.

**Points clés à configurer :**

```javascript
const toolData = {
  name: 'Nom du Produit',
  description: 'Description...',
  category: 'Scraping',
  price: 99,              // ← Prix en euros
  priceLabel: '99 €',     // ← Format d'affichage
  isPaid: true,           // ← Important
  unlockType: 'payment',  // ← 'payment' pour payant, 'email' pour gratuit
  // ... autres propriétés
}
```

**Dans la fonction `handleUnlock`**, assurez-vous que le `toolId` correspond :

```javascript
body: JSON.stringify({
  toolId: 'slug-du-produit', // ← Doit correspondre à la clé dans toolPrices
  email: email || undefined
}),
```

**Dans `verifyPayment` et les liens de téléchargement**, utilisez le bon slug :

```javascript
href={`/api/tools/download-csv?email=${encodeURIComponent(email)}&tool=slug-du-produit`}
```

## ✅ Checklist

- [ ] Produit ajouté dans `lib/tools.js` avec `isPaid: true` et `price: X`
- [ ] Prix ajouté dans `pages/api/tools/create-checkout.js` dans `toolPrices`
- [ ] Page créée dans `pages/outils/[slug].js`
- [ ] `toolData.isPaid = true` et `toolData.unlockType = 'payment'`
- [ ] `toolId` cohérent entre tous les fichiers
- [ ] Test du flux de paiement en mode test Stripe

## 🎯 Exemple Complet

### Produit : Base de données - Avocats Parisiens (79€)

**1. `lib/tools.js` :**
```javascript
{
  name: 'Base de données - Avocats Parisiens',
  description: 'Base de données complète des avocats à Paris...',
  category: 'Scraping',
  type: 'database',
  iconSvg: 'search',
  link: '/outils/avocats-parisiens',
  isPaid: true,
  price: 79,
  isNew: true,
  date: '2024-01-25'
}
```

**2. `pages/api/tools/create-checkout.js` :**
```javascript
const toolPrices = {
  // ... autres produits
  'avocats-parisiens': {
    name: 'Base de données - Avocats Parisiens',
    price: 79,
    description: 'Base de données complète des avocats à Paris (300+ entrées)'
  }
}
```

**3. `pages/outils/avocats-parisiens.js` :**
```javascript
const toolData = {
  // ...
  price: 79,
  priceLabel: '79 €',
  isPaid: true,
  unlockType: 'payment',
  // ...
}

// Dans handleUnlock :
body: JSON.stringify({
  toolId: 'avocats-parisiens',
  email: email || undefined
}),
```

## 🔄 Conversion d'un Produit Gratuit en Payant

Pour convertir un produit existant de gratuit à payant :

1. Dans `lib/tools.js` : `isPaid: false` → `isPaid: true`, `price: 0` → `price: X`
2. Dans `pages/api/tools/create-checkout.js` : Ajouter l'entrée dans `toolPrices`
3. Dans la page du produit : `unlockType: 'email'` → `unlockType: 'payment'`, mettre à jour `price` et `priceLabel`

## 📝 Notes

- Le `toolId` doit être unique et correspondre au slug de l'URL
- Les prix sont en euros dans le code, Stripe les convertit automatiquement en centimes
- Le webhook Stripe fonctionne pour tous les produits automatiquement
- Les téléchargements après paiement doivent être gérés dans `/api/tools/download-csv` si nécessaire

