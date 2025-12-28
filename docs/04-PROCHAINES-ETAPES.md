# 📋 Prochaines Étapes & Roadmap - corentinrobert.fr

**Plan d'action et améliorations à venir**

---

## 📋 Vue d'Ensemble

Ce document liste uniquement les fonctionnalités et améliorations **à venir**. Pour voir ce qui a déjà été réalisé, consultez les autres fichiers de documentation dans le dossier `docs/`.

---

## 🎯 Priorité 1 : Contenu & Expérience Utilisateur

### 1. Pages Facecam dans Outils ⏳
**Objectif** : Créer des pages détaillées pour chaque outil Apify avec article et vidéo facecam

**Actions** :
- [ ] Créer structure de page `/outils/[slug]` pour chaque outil
- [ ] Intégrer vidéos YouTube/Vimeo avec facecam
- [ ] Rédiger articles détaillés pour chaque outil
- [ ] Ajouter métriques d'utilisation (si disponibles via API Apify)
- [ ] Lien direct vers l'Actor Apify

**Impact** : 🟢 **Élevé** - Améliore le trust et la conversion

---

## 🔧 Priorité 2 : Intégrations & Automatisation

### 4. API Apify pour métriques live ⏳
**Objectif** : Afficher les métriques en temps réel depuis Apify

**Actions** :
- [ ] Créer route API `/api/apify/metrics`
- [ ] Récupérer stats depuis API Apify (utilisateurs, runs, succès)
- [ ] Mettre en cache avec revalidation (ISR)
- [ ] Afficher métriques mises à jour sur homepage
- [ ] Gérer erreurs et fallback vers valeurs statiques

**Impact** : 🟡 **Moyen** - Améliore la fraîcheur des données

**Documentation** : [Apify API Docs](https://docs.apify.com/api/v2)

---

### 5. API Malt pour témoignages ⏳
**Objectif** : Synchroniser automatiquement les témoignages depuis Malt

**Actions** :
- [ ] Vérifier disponibilité API Malt
- [ ] Créer route API `/api/malt/testimonials`
- [ ] Parser et formater les témoignages
- [ ] Ajouter cron job pour mise à jour quotidienne
- [ ] Afficher sur page "À propos"

**Impact** : 🟡 **Moyen** - Automatise la mise à jour du contenu

---

### 6. Section "Maintenant" dynamique ⏳
**Objectif** : Permettre la mise à jour facile de la section "Maintenant"

**Actions** :
- [ ] Créer champ dans Notion pour section "Maintenant"
- [ ] Créer route API pour récupérer depuis Notion
- [ ] Mettre à jour automatiquement via cron job
- [ ] Interface admin simple (optionnel)

**Impact** : 🟡 **Moyen** - Facilite la maintenance

---

## 📊 Priorité 3 : Analytics & Performance

### 7. Analytics avancés ⏳
**Objectif** : Suivre les métriques de performance et conversion

**Actions** :
- [ ] Configurer Google Analytics 4 (si pas déjà fait)
- [ ] Ajouter événements personnalisés (clics liens, téléchargements)
- [ ] Dashboard Vercel Analytics
- [ ] Suivre Core Web Vitals
- [ ] A/B testing meta descriptions (optionnel)

**Impact** : 🟡 **Moyen** - Données pour optimisations futures

---

### 8. Optimisation Core Web Vitals ⏳
**Objectif** : Améliorer les scores de performance

**Actions** :
- [ ] Audit Lighthouse complet
- [ ] Optimiser images (formats WebP, lazy loading)
- [ ] Réduire JavaScript bundle size
- [ ] Optimiser fonts (preload, subset)
- [ ] Améliorer LCP, FID, CLS

**Impact** : 🟡 **Moyen** - Améliore SEO et UX

---

## 🎨 Priorité 4 : Améliorations UX/UI

### 9. Enrichir page Open ⏳
**Objectif** : Enrichir la page Open avec tous les projets GitHub

**Actions** :
- [ ] Lister tous les projets open source GitHub
- [ ] Ajouter descriptions, stars, forks
- [ ] Intégrer API GitHub pour métriques live
- [ ] Filtrer par langage/technologie
- [ ] Ajouter liens vers démos live

**Impact** : 🟢 **Élevé** - Montre l'expertise technique

---

### 10. Amélioration page Outils ⏳
**Objectif** : Rendre la page Outils plus engageante

**Actions** :
- [ ] Afficher métriques d'utilisation par outil
- [ ] Ajouter screenshots/démo pour chaque outil
- [ ] Section "Outils à venir" (roadmap)
- [ ] Formulaire de suggestion d'outil

**Impact** : 🟡 **Moyen** - Améliore l'engagement

---

## 🔍 Priorité 5 : SEO & Contenu

### 11. Rich Snippets pour articles ⏳
**Objectif** : Améliorer l'affichage dans les résultats de recherche

**Actions** :
- [ ] Ajouter Schema.org Article avec rating
- [ ] Ajouter FAQPage Schema si applicable
- [ ] Ajouter HowTo Schema pour tutoriels
- [ ] Tester avec Google Rich Results Test

**Impact** : 🟡 **Moyen** - Améliore le CTR depuis Google

---

### 12. Blog : Articles optimisés ⏳
**Objectif** : Créer du contenu SEO-friendly régulièrement

**Actions** :
- [ ] Plan éditorial mensuel
- [ ] Articles sur scraping, automatisation, growth
- [ ] Case studies de projets clients
- [ ] Tutoriels techniques
- [ ] Optimiser chaque article pour mots-clés cibles

**Impact** : 🟢 **Élevé** - Génère du trafic organique

---

## 🛠️ Priorité 6 : Technique & Maintenance

### 13. Tests & Qualité ⏳
**Objectif** : Assurer la qualité du code

**Actions** :
- [ ] Ajouter tests unitaires (Jest)
- [ ] Tests E2E (Playwright/Cypress)
- [ ] Tests de régression SEO
- [ ] CI/CD avec GitHub Actions

**Impact** : 🟡 **Moyen** - Réduit les bugs

---

### 14. Monitoring & Alertes ⏳
**Objectif** : Détecter les problèmes rapidement

**Actions** :
- [ ] Monitoring uptime (UptimeRobot, Better Uptime)
- [ ] Alertes erreurs (Sentry)
- [ ] Monitoring performance (Vercel Analytics)
- [ ] Alertes SEO (Google Search Console)

**Impact** : 🟡 **Moyen** - Améliore la fiabilité

---

## 📈 Métriques de Succès à Suivre

### Court terme (1-3 mois)
- **Trafic organique** : +30% depuis Google
- **Temps sur site** : >2 minutes
- **Taux de rebond** : <60%
- **Contacts** : +20% depuis le site

### Moyen terme (3-6 mois)
- **Positionnement SEO** : Top 10 pour "scraping freelance"
- **Backlinks** : +10 liens de qualité
- **Engagement** : +50% clics sur liens Malt/Apify
- **Conversion** : 5% visiteurs → contact

### Long terme (6-12 mois)
- **Autorité domaine** : DA >40
- **Trafic mensuel** : >5000 visiteurs uniques
- **Leads qualifiés** : 10+ par mois depuis le site
- **Brand awareness** : Reconnaissance dans l'écosystème scraping

---

## 🎯 Recommandations Immédiates

### Cette semaine
1. ⏳ Créer première page Facecam pour un outil Apify
2. ⏳ Enrichir page Open avec projets GitHub

### Ce mois
1. ⏳ Créer toutes les pages Facecam pour les outils
2. ⏳ Intégrer API Apify pour métriques live
3. ⏳ Optimiser Core Web Vitals

### Ce trimestre
1. ⏳ Compléter toutes les pages Facecam
2. ⏳ Enrichir page Open avec projets GitHub
3. ⏳ Créer contenu blog régulier (1-2 articles/mois)

---

## 📝 Notes

- **Design System** : Toujours respecter le design system existant
- **SEO First** : Chaque nouvelle fonctionnalité doit être optimisée SEO
- **Performance** : Maintenir les scores Lighthouse >90
- **Accessibilité** : Respecter WCAG 2.1 niveau AA minimum

---

## 🔗 Ressources Utiles

- [Apify API Documentation](https://docs.apify.com/api/v2)
- [Malt API](https://developers.malt.com/) (à vérifier)
- [Google Search Console](https://search.google.com/search-console)
- [Schema.org Documentation](https://schema.org/)
- [Core Web Vitals](https://web.dev/vitals/)
