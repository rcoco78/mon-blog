# Datareacher

Marque produit autonome (pas le blog).  
**YouTube → fiche `/s/…` → 20 lignes → Stripe.**  
Exécution **Render**. Pas d’Apify dans ce dossier.

## Pages

| URL | Rôle |
|---|---|
| `/` | Landing |
| `/scrapers` | Catalogue |
| `/s/[slug]` | Fiche YouTube (à coller dans Studio) |
| `/scrapers/[slug]` | Même fiche |
| `/pricing` | Packs crédits Stripe |
| `/signup` `/login` `/account` | Compte + solde |
| `/docs` `/blog` | Produit, pas journal perso |
| `/legal/cgu` `/legal/confidentialite` | Cadre |

## Local

```bash
cd datareacher
npm install
cp .env.example .env.local
npm run dev
```

Ouvre [http://localhost:3001](http://localhost:3001).  
Sans `STRIPE_SECRET_KEY`, le checkout redirige en mode démo vers `/account`.  
Sans `RENDER_WORKER_URL`, le run renvoie 20 lignes de démo.

## Déploiement

- Site : projet Vercel, **Root Directory = `datareacher`**.
- Worker : Render (`render/worker.placeholder.js`).
- Stripe : 3 produits crédits (20 / 50 / 150 €) + webhook (à brancher pour créditer le solde).

## YouTube Studio

Description, 1re ligne :

`Essaie ici (20 gratuits) : https://www.datareacher.com/s/airbnb-hosts`
