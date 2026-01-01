# Configuration Stripe pour les Paiements

Ce document explique comment configurer Stripe pour permettre les paiements sur les bases de données payantes.

## 📋 Prérequis

1. Un compte Stripe (créer sur [stripe.com](https://stripe.com))
2. Les clés API Stripe (disponibles dans le Dashboard Stripe)

## 🔑 Variables d'Environnement

Ajoutez les variables suivantes dans votre fichier `.env.local` (local) et dans Vercel (production) :

```bash
# Clé secrète Stripe (commence par sk_)
# Remplacez VOTRE_CLE_SECRETE par votre vraie clé depuis le Dashboard Stripe
STRIPE_SECRET_KEY=VOTRE_CLE_SECRETE

# Secret du webhook Stripe (commence par whsec_)
# Remplacez VOTRE_WEBHOOK_SECRET par votre vrai secret depuis le Dashboard Stripe
STRIPE_WEBHOOK_SECRET=VOTRE_WEBHOOK_SECRET
```

### Où trouver ces clés ?

1. **STRIPE_SECRET_KEY** :
   - Dashboard Stripe → **Developers** → **API keys**
   - Utilisez la **Secret key** (commence par `sk_test_` en mode test, `sk_live_` en production)

2. **STRIPE_WEBHOOK_SECRET** :
   - Dashboard Stripe → **Developers** → **Webhooks**
   - Créez un endpoint webhook pointant vers : `https://votredomaine.com/api/tools/stripe-webhook`
   - Copiez le **Signing secret** (commence par `whsec_`)

## 🚀 Configuration du Webhook Stripe

### 1. Créer l'endpoint webhook

1. Allez dans le Dashboard Stripe → **Developers** → **Webhooks**
2. Cliquez sur **Add endpoint**
3. URL de l'endpoint : `https://votredomaine.com/api/tools/stripe-webhook`
4. Sélectionnez les événements à écouter :
   - `checkout.session.completed` (obligatoire)

### 2. Tester le webhook en local

Pour tester en local, utilisez [Stripe CLI](https://stripe.com/docs/stripe-cli) :

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Forwarder les webhooks vers votre serveur local
stripe listen --forward-to localhost:3000/api/tools/stripe-webhook
```

Stripe CLI vous donnera un `whsec_...` à utiliser dans `.env.local` pour les tests.

## 💰 Configuration des Prix

Les prix sont définis dans `/pages/api/tools/create-checkout.js` :

```javascript
const toolPrices = {
  'dentistes-parisiens': {
    name: 'Base de données - Dentistes Parisiens',
    price: 49, // Prix en euros
    description: 'Base de données complète des dentistes à Paris (500+ entrées)'
  }
}
```

Pour ajouter un nouvel outil payant :
1. Ajoutez l'entrée dans `toolPrices`
2. Mettez à jour `lib/tools.js` avec `isPaid: true` et `price: X`
3. Mettez à jour la page de l'outil avec `unlockType: 'payment'`

## 🧪 Mode Test vs Production

### Mode Test (Développement)
- Utilisez les clés commençant par `sk_test_` et `whsec_` (test)
- Les cartes de test Stripe fonctionnent :
  - Carte valide : `4242 4242 4242 4242`
  - Date d'expiration : n'importe quelle date future
  - CVC : n'importe quel 3 chiffres

### Mode Production
- Utilisez les clés commençant par `sk_live_` et `whsec_` (production)
- Activez votre compte Stripe (vérification d'identité requise)
- Configurez les webhooks en production

## 📝 Flux de Paiement

1. **Utilisateur clique sur "Acheter"** → Redirection vers Stripe Checkout
2. **Paiement sur Stripe** → L'utilisateur paie via Stripe
3. **Redirection après paiement** → Retour sur `/outils/dentistes-parisiens?payment=success&session_id=...`
4. **Vérification du paiement** → L'API `/api/tools/verify-payment` vérifie le statut
5. **Déblocage du téléchargement** → L'utilisateur peut télécharger la base de données

## 🔍 Dépannage

### Le webhook ne fonctionne pas
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
- Vérifiez que l'URL du webhook dans Stripe est correcte
- Consultez les logs Stripe Dashboard → **Developers** → **Webhooks** → **Logs**

### Le paiement ne se vérifie pas
- Vérifiez que `STRIPE_SECRET_KEY` est correct
- Vérifiez les logs du serveur pour les erreurs
- Assurez-vous que la session ID est bien passée dans l'URL de retour

### Erreur "Webhook signature verification failed"
- Vérifiez que `STRIPE_WEBHOOK_SECRET` correspond au secret du webhook dans Stripe
- Assurez-vous que le body parser est désactivé (déjà fait dans le code)

## 📚 Ressources

- [Documentation Stripe Payments](https://docs.stripe.com/payments)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

