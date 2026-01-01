# 🔍 Audit Complet & Recommandations - corentinrobert.fr

**Date** : Janvier 2025  
**Dernière mise à jour** : Janvier 2025  
**Objectif** : Analyser le site du point de vue d'un CEO/Fondateur découvrant Corentin via Malt/LinkedIn et identifier les améliorations UX, conversion et SEO.

---

## 🎯 Contexte : Parcours d'un CEO/Fondateur

### Scénario
1. **Découverte** : CEO voit le profil sur Malt ou LinkedIn
2. **Intention** : En apprendre plus, vérifier la crédibilité, comprendre la personnalité
3. **Objectif** : Décider si c'est "cool de bosser avec moi"

### Questions clés qu'un CEO se pose
- ✅ Est-ce qu'il a l'expertise nécessaire ?
- ✅ Est-ce qu'il est fiable et professionnel ?
- ✅ Est-ce qu'on peut bien travailler ensemble ?
- ✅ Est-ce qu'il comprend mes besoins business ?
- ✅ Est-ce qu'il a une personnalité qui me correspond ?

---

## 📊 AUDIT PAR PAGE

### 🏠 **HOMEPAGE** (`pages/index.js`)

#### ✅ Points Forts
- **Métriques de confiance** : 424 projets, 4.9/5, progression visible
- **Témoignages en carousel** : Preuve sociale immédiate avec titres résumés
- **Projets actifs** : Montre l'activité et la diversité
- **CTA clair** : Métriques → Objectifs (données publiques)
- **Structured Data** : Service + AggregateRating + Review individuelles bien implémentés
- **Message d'accroche** : Orienté business et bénéfices clients ✅
- **CTA Calendly visible** : Bouton dans le header ✅
- **Carousel amélioré** : Scroll horizontal synchronisé avec indicateurs ✅

#### ⚠️ Points d'Amélioration

**1. Section "Pourquoi me choisir ?"** ⏳ (À FAIRE - PRIORITÉ HAUTE)
- **Objectif** : Répondre directement aux objections d'un CEO
- **Contenu suggéré** :
  - ✅ **7 jours de délai moyen** (vs 2-3 semaines ailleurs) — Réactivité
  - ✅ **5/5 sur Malt** (160 missions) — Fiabilité
  - ✅ **Expertise immobilier + santé** — Secteurs d'expertise
  - ✅ **20-30 projets/mois** — Disponibilité
  - ✅ **Systèmes pérennes** (pas juste du one-shot) — Valeur long terme
- **Placement** : Juste après les métriques, avant les témoignages
- **Format** : 4-5 cartes avec icônes, style sobre

**2. Section "Comment je travaille" (résumé)** ⏳ (À FAIRE - PRIORITÉ MOYENNE)
- **Objectif** : Rassurer sur le processus
- **Contenu** : Processus en 3-4 étapes simplifiées
- **Placement** : Après les témoignages, avant les projets
- **Lien** : Vers page "À propos" pour plus de détails

**3. Optimisation du message d'accroche** ⏳ (À DISCUTER)
- Actuellement : "J'aide les dirigeants de TPE-PME à automatiser leurs processus et gagner du temps"
- **Question** : Est-ce que "TPE-PME" limite la perception ? Devrait-on dire "dirigeants" ou "entreprises" ?
- **Suggestion** : Tester "J'aide les dirigeants à automatiser leurs processus et gagner du temps"

---

### 👤 **PAGE "À PROPOS"** (`pages/a-propos.js`)

#### ✅ Points Forts
- **Parcours clair** : Airbnb → Shine → Entrepreneur
- **Projets entrepreneuriaux** : Montre l'ambition et la diversité
- **Photos/Vidéo** : Humanise, montre la personnalité
- **Hobbies** : Échecs, running, Hyrox (équilibre vie pro/perso)
- **Carousel photos/vidéos** : Scroll horizontal amélioré ✅
- **Structure projets arrêtés** : Prête pour articles "Leçons apprises" ✅

#### ⚠️ Points d'Amélioration

**1. Section "Mes valeurs"** ⏳ (À FAIRE - PRIORITÉ HAUTE)
- **Objectif** : Montrer ce qui guide le travail
- **Contenu suggéré** :
  - **Transparence** : Données publiques, objectifs partagés
  - **Partage** : Outils gratuits, scrapers publics Apify
  - **Qualité** : 5/5 sur Malt, 424+ projets
  - **Réactivité** : 7 jours de délai moyen
- **Placement** : Après le parcours, avant les projets
- **Format** : 4 cartes avec icônes, style sobre

**2. Section "Ma méthode de travail"** ✅ (FAIT - dans FAQ objectifs)
- **Note** : Existe déjà dans la FAQ de la page objectifs
- **Suggestion** : Extraire et créer une section dédiée sur "À propos" avec lien vers FAQ pour détails

**3. Développer la personnalité** ⏳ (À FAIRE - PRIORITÉ MOYENNE)
- **Pourquoi les échecs ?** : Stratégie, patience, réflexion — comment ça influence le travail
- **Pourquoi le running/Hyrox ?** : Dépassement, discipline — comment ça influence le travail
- **Section "Pourquoi je fais ça"** : Vision, motivation, ce qui me fait kiffer
- **Placement** : Après les valeurs, avant les hobbies

**4. Section "Ce qui me différencie"** ⏳ (À DISCUTER)
- **Objectif** : Mettre en avant les différences avec autres freelances
- **Contenu suggéré** :
  - Systèmes pérennes vs one-shot
  - Transparence totale (données publiques)
  - Partage d'outils gratuits
  - Expertise sectorielle (immobilier, santé)

---

### 💬 **PAGE "TÉMOIGNAGES"** (`pages/temoignages.js`)

#### ✅ Points Forts
- **Diversité des sources** : Malt, Fiverr, LinkedIn
- **Témoignages authentiques** : Citations complètes
- **Métriques** : 424+ projets, 270+ avis positifs
- **Structured Data** : AggregateRating + Review individuelles ✅
- **Titres résumés** : Sur homepage pour faciliter la lecture ✅

#### ⚠️ Points d'Amélioration

**1. Témoignages avec ROI/Métriques** ⏳ (À FAIRE - PRIORITÉ MOYENNE)
- **Objectif** : Montrer l'impact concret
- **Format** : Badge ou encart avec métrique
- **Exemples** :
  - "Gain de temps : 10h/semaine"
  - "ROI : 300% en 3 mois"
  - "Livraison en 5 jours au lieu de 3 semaines"
- **Note** : À demander aux clients lors des prochains projets

**2. Témoignages par secteur** ⏳ (À FAIRE - PRIORITÉ MOYENNE)
- **Objectif** : Aider les CEOs à se projeter
- **Sections** :
  - "Immobilier" (si témoignages disponibles)
  - "Santé" (si témoignages disponibles)
  - "Autres secteurs"
- **Format** : Filtres ou sections séparées

**3. Témoignages vidéo** ⏳ (À FAIRE - PRIORITÉ BASSE)
- **Objectif** : Humaniser encore plus
- **Action** : Proposer aux clients satisfaits de faire une vidéo
- **Format** : Intégration YouTube ou Loom

**4. Section "Ils m'ont fait confiance"** ⏳ (À DISCUTER)
- **Objectif** : Montrer la diversité des clients
- **Format** : Logos ou noms d'entreprises (avec permission)
- **Note** : Sensible — demander permission avant

---

### 📊 **PAGE "OBJECTIFS"** (`pages/objectifs.js` - anciennement "Données publiques")

#### ✅ Points Forts
- **Transparence totale** : Objectifs, progression, métriques
- **Métriques business** : CA, délais, taux de réussite
- **Graphiques de progression** : Visuels, clairs
- **FAQ complète** : Répond aux questions ✅
- **Liens d'affiliation** : Avec flèches de redirection ✅
- **Corrections présentation** : Titres améliorés, catégories renommées ✅

#### ⚠️ Points d'Amélioration

**1. Section "TL;DR pour CEOs"** ⏳ (À FAIRE - PRIORITÉ HAUTE)
- **Objectif** : Résumer rapidement pour un CEO pressé
- **Contenu** :
  - 7 jours de délai moyen
  - 5/5 sur Malt (160 missions)
  - 20-30 projets/mois (disponibilité)
  - Expertise immobilier + santé
  - Systèmes pérennes
- **Placement** : En haut de page, après l'introduction
- **Format** : Encart visuel avec icônes

**2. Preuve de résultats clients** ⏳ (À FAIRE - PRIORITÉ MOYENNE)
- **Objectif** : Montrer l'impact concret
- **Format** : Cas d'usage avec ROI intégrés
- **Exemples** :
  - "Client X : Gain de 10h/semaine grâce à l'automatisation"
  - "Client Y : ROI de 300% en 3 mois"
- **Note** : À créer une page dédiée "Cas d'usage" ou intégrer ici

**3. Métriques de satisfaction clients** ⏳ (À DISCUTER)
- **Objectif** : Montrer la qualité du service
- **Format** : Graphique ou encart avec métriques
- **Exemples** :
  - Taux de satisfaction : 98%
  - Taux de réengagement : 60%
  - Temps moyen de réponse : 2h

---

### 🛠️ **PAGE "OUTILS"** (`pages/outils.js`)

#### ✅ Points Forts
- **Outils gratuits** : Montre la générosité et l'expertise
- **Diversité** : Générateurs, extracteurs, templates
- **FAQ** : Répond aux questions ✅
- **SearchBar** : Filtrage par tags amélioré ✅

#### ⚠️ Points d'Amélioration

**1. Métriques d'utilisation** ⏳ (À FAIRE - PRIORITÉ MOYENNE)
- **Objectif** : Preuve que les outils sont utilisés
- **Format** : Badge sur chaque outil
- **Exemples** :
  - "X utilisateurs/mois"
  - "Y templates générés"
  - "Z téléchargements"
- **Note** : À implémenter avec tracking

**2. Cas d'usage business** ⏳ (À FAIRE - PRIORITÉ MOYENNE)
- **Objectif** : Montrer l'impact concret
- **Format** : Section "Comment cet outil a aidé un client"
- **Exemples** :
  - "Client X a économisé 5h/semaine avec cet outil"
  - "ROI moyen pour les utilisateurs : 200%"
- **Note** : À demander aux utilisateurs

**3. Pages détaillées pour chaque outil** ⏳ (À FAIRE - PRIORITÉ BASSE)
- **Objectif** : SEO et conversion
- **Format** : Pages `/outils/[slug]` avec :
  - Vidéo facecam
  - Article détaillé
  - Lien direct vers Actor Apify
  - Cas d'usage
- **Note** : Long terme, beaucoup de travail

**4. Section "Outils les plus utilisés"** ⏳ (À DISCUTER)
- **Objectif** : Guider les visiteurs
- **Format** : Top 3-5 outils avec badges "Populaire"

---

### 📝 **PAGE "BLOG"** (`pages/blog.js`)

#### ✅ Points Forts
- **Contenu varié** : Entrepreneuriat, scraping, voyage
- **Articles les plus lus** : Preuve d'engagement
- **Tags** : Navigation claire avec SearchBar améliorée ✅
- **FAQ** : Répond aux questions ✅
- **Correction "lectures" → "vues"** : Avec accord singulier/pluriel ✅

#### ⚠️ Points d'Amélioration

**1. Articles "cas d'usage business"** ⏳ (À FAIRE - PRIORITÉ MOYENNE)
- **Objectif** : Montrer l'impact concret
- **Exemples de titres** :
  - "Comment j'ai automatisé X pour un client"
  - "ROI de l'automatisation : cas concret"
  - "Scraping immobilier : résultats concrets"
- **Format** : Tag "Cas d'usage" ou section dédiée

**2. CTAs dans les articles** ⏳ (À FAIRE - PRIORITÉ MOYENNE)
- **Objectif** : Convertir les lecteurs
- **Format** : Encart en fin d'article
- **Contenu** :
  - "Besoin d'aide sur ce sujet ? Réservez un appel"
  - Lien vers services pertinents
- **Note** : À implémenter dans le template d'article

**3. Section "Articles pour CEOs"** ⏳ (À DISCUTER)
- **Objectif** : Guider les CEOs vers le contenu pertinent
- **Format** : Filtre "Cas d'usage business" ou section dédiée
- **Placement** : En haut de page, avant la liste

**4. Articles optimisés SEO** ⏳ (À FAIRE - PRIORITÉ BASSE)
- **Objectif** : Attirer du trafic organique
- **Exemples de titres** :
  - "Guide scraping immobilier"
  - "Comment automatiser X"
  - "ROI de l'automatisation"
- **Note** : Long terme, création de contenu

---

## 🚀 AMÉLIORATIONS SEO

### ✅ Ce qui est déjà bien fait
- Structured Data complet (Service, Person, BlogPosting, FAQPage, Review, Dataset, etc.) ✅
- Meta descriptions optimisées ✅
- Open Graph et Twitter Cards ✅
- Robots.txt configuré ✅
- Canonical URLs ✅
- Sitemap index avec sitemaps séparés ✅
- Review Schema pour témoignages ✅
- BreadcrumbList sur toutes les pages ✅

### ⚠️ Améliorations SEO à faire

#### 1. **Landing pages par secteur** ⏳ (PRIORITÉ MOYENNE)
- `/services/scraping-immobilier`
- `/services/scraping-sante`
- Optimisées SEO avec contenu spécifique
- Structured Data Service pour chaque secteur

#### 2. **Images optimisées SEO** ⏳ (PRIORITÉ MOYENNE)
- **État actuel** :
  - ✅ Lazy loading déjà en place sur la plupart des images (`loading="lazy"`)
  - ⚠️ Alt text parfois génériques ("Photo", "Image") dans `pages/photos.js` et `components/Block.js`
  - ⚠️ Pas de Structured Data ImageObject pour les images importantes
- **Actions à faire** :
  - Améliorer les alt text pour être plus descriptifs et inclure des mots-clés pertinents
  - Ajouter Structured Data ImageObject pour les images importantes (photos, graphiques)
  - Vérifier que toutes les images ont un alt text descriptif (pas juste "Photo" ou "Image")
- **Exemples d'amélioration** :
  - ❌ `alt="Photo"` → ✅ `alt="Photo de Corentin Robert à Paris - Freelance scraping et automatisation"`
  - ❌ `alt="Image"` → ✅ `alt="Graphique montrant l'évolution des rendez-vous clients sur 12 mois"`
- **Fichiers à modifier** :
  - `pages/photos.js` : Améliorer les alt text avec localisation et contexte
  - `components/Block.js` : Utiliser la caption Notion ou générer un alt text descriptif
  - `components/ImageWithZoom.js` : Vérifier que les alt text sont bien passés

#### 3. **Blog posts optimisés SEO** ⏳ (PRIORITÉ BASSE)
- Articles optimisés pour recherches spécifiques
- "Guide scraping immobilier"
- "Comment automatiser X"
- "ROI de l'automatisation"

#### 4. **Backlinks internes optimisés** ⏳ (PRIORITÉ BASSE)
- **État actuel** :
  - ✅ Sections "Pour aller plus loin" sur toutes les pages principales (blog, outils, objectifs, à propos)
  - ✅ Liens dans la navigation
  - ✅ Composant RelatedPosts pour les articles
  - ⚠️ Pas de liens internes contextuels dans le contenu des articles (texte)
  - ⚠️ Pas de maillage sémantique stratégique entre articles
- **Actions à faire** :
  - Ajouter des liens internes contextuels dans le contenu des articles (à faire manuellement dans Notion)
  - Améliorer RelatedPosts avec ancres optimisées et suggestions plus pertinentes
  - Créer un système de "mots-clés internes" qui génère automatiquement des liens
  - Ajouter des liens vers les outils pertinents dans les articles techniques
  - Ajouter des liens vers les cas d'usage dans les articles business
- **Stratégie de maillage** :
  - Articles scraping → Lien vers page outils
  - Articles automatisation → Lien vers témoignages
  - Articles entrepreneuriat → Lien vers à propos
  - Articles techniques → Lien vers outils pertinents
  - Mentions de "scraping" → Lien vers `/outils` ou articles scraping
  - Mentions de "automatisation" → Lien vers articles automatisation
- **Fichiers à modifier** :
  - `components/Block.js` : Détecter les mots-clés et créer des liens automatiques (optionnel)
  - `components/RelatedPosts.js` : Améliorer l'algorithme de suggestion
  - Articles Notion : Ajouter des liens internes manuellement dans le contenu

#### 5. **Page "Cas d'usage"** ⏳ (PRIORITÉ MOYENNE)
- `/cas-usage` ou `/case-studies`
- Cas concrets par secteur
- ROI mentionné
- Témoignages clients intégrés
- Optimisée SEO

---

## 🎯 RECOMMANDATIONS PRIORITAIRES

### 🔴 PRIORITÉ 1 : Conversion (CEO qui veut bosser avec toi)

#### A. Homepage - Section "Pourquoi me choisir ?" ⏳
- **Impact** : Répond directement aux objections
- **Effort** : Moyen (création de section)
- **Contenu** :
  - ✅ 7 jours de délai moyen
  - ✅ 5/5 sur Malt
  - ✅ Expertise immobilier + santé
  - ✅ 20-30 projets/mois
  - ✅ Systèmes pérennes

#### B. À propos - Section "Mes valeurs" ⏳
- **Impact** : Montre ce qui guide le travail
- **Effort** : Moyen (création de section)
- **Contenu** :
  - Transparence (données publiques)
  - Partage (outils gratuits)
  - Qualité (5/5 sur Malt)
  - Réactivité (7 jours)

#### C. Objectifs - Section "TL;DR pour CEOs" ⏳
- **Impact** : Résume rapidement pour CEO pressé
- **Effort** : Faible (création d'encart)
- **Contenu** : Métriques clés résumées

#### D. Témoignages avec ROI ⏳
- **Impact** : Montre l'impact concret
- **Effort** : Moyen (demander aux clients)
- **Format** : Badge ou encart avec métrique

### 🟡 PRIORITÉ 2 : SEO Technique

#### A. Landing pages par secteur ⏳
- **Impact** : SEO long terme
- **Effort** : Élevé (création de pages)
- **Pages** : `/services/scraping-immobilier`, `/services/scraping-sante`

#### B. Page "Cas d'usage" ⏳
- **Impact** : Conversion + SEO
- **Effort** : Moyen (création de page)
- **Format** : Cas concrets avec ROI

#### C. Images optimisées ⏳
- **Impact** : SEO technique
- **Effort** : Faible (vérification alt text)
- **Action** : Audit de toutes les images

### 🟢 PRIORITÉ 3 : Contenu et Personnalité

#### A. Articles "cas d'usage business" ⏳
- **Impact** : Conversion + SEO
- **Effort** : Élevé (création de contenu)
- **Format** : Articles détaillés avec ROI

#### B. Développer la personnalité ⏳
- **Impact** : Créer un lien humain
- **Effort** : Moyen (rédaction)
- **Sections** :
  - "Pourquoi je fais ça"
  - Valeurs explicites
  - Hobbies développés (échecs = stratégie, running = discipline)

#### C. Métriques d'utilisation outils ⏳
- **Impact** : Preuve sociale
- **Effort** : Moyen (implémentation tracking)
- **Format** : Badges sur chaque outil

---

## 📈 MÉTRIQUES DE SUCCÈS

### Conversion
- Taux de clic sur Calendly (homepage)
- Taux de visite sur "À propos" depuis homepage
- Taux de visite sur "Témoignages" depuis homepage
- Taux de visite sur "Objectifs" depuis homepage
- Taux de conversion : Visite → Calendly

### SEO
- Position sur "freelance scraping France"
- Position sur "consultant scraping Paris"
- Position sur "scraping immobilier"
- Position sur "automatisation processus business"
- Trafic organique total

### Engagement
- Temps passé sur "À propos"
- Temps passé sur "Témoignages"
- Taux de rebond homepage
- Pages vues par session
- Taux de scroll sur homepage

---

## 🔍 CHECKLIST D'AMÉLIORATION

### Conversion
- [x] Message d'accroche amélioré (homepage)
- [ ] Section "Pourquoi me choisir ?" (homepage) 🔴
- [x] CTA Calendly visible en haut (homepage)
- [x] Section "Ma méthode de travail" (à propos - dans FAQ objectifs)
- [ ] Section "Mes valeurs" (à propos) 🔴
- [ ] Section "TL;DR pour CEOs" (objectifs) 🔴
- [ ] Témoignages avec ROI (témoignages) 🟡
- [ ] Témoignages par secteur (témoignages) 🟡
- [x] Valoriser projets arrêtés (à propos)
- [x] Carousels améliorés (homepage, à propos)

### SEO
- [x] Sitemap.xml créé
- [x] Meta descriptions optimisées (mots-clés long-tail)
- [x] Review Schema ajouté
- [x] FAQ Schema sur toutes les pages
- [x] Lazy loading sur images ✅
- [ ] Landing pages par secteur 🟡
- [ ] Page "Cas d'usage" 🟡
- [ ] Images optimisées (alt text descriptifs, ImageObject) 🟡
  - [ ] Améliorer alt text dans `pages/photos.js`
  - [ ] Améliorer alt text dans `components/Block.js`
  - [ ] Ajouter Structured Data ImageObject
- [ ] Backlinks internes optimisés 🟢
  - [x] Sections "Pour aller plus loin" sur toutes les pages ✅
  - [x] RelatedPosts pour articles ✅
  - [ ] Liens contextuels dans le contenu des articles
  - [ ] Maillage sémantique stratégique

### Contenu
- [ ] Articles "cas d'usage business" (blog) 🟢
- [ ] CTAs dans les articles (blog) 🟡
- [ ] Métriques d'utilisation outils (outils) 🟡
- [ ] Cas d'usage outils (outils) 🟡
- [ ] Pages détaillées pour outils (outils) 🟢

### Personnalité
- [ ] Section "Pourquoi je fais ça" (à propos) 🟢
- [ ] Valeurs explicites (à propos) 🔴
- [ ] Hobbies développés (à propos) 🟢
- [ ] Section "Ce qui me différencie" (à propos) 🟡

---

## 💡 IDÉES BONUS (À DISCUTER)

### 1. **Page "Cas d'usage" dédiée**
- Cas concrets par secteur
- ROI mentionné
- Témoignages clients intégrés
- Optimisée SEO

### 2. **Newsletter**
- Capture d'email
- Contenu exclusif
- Cas d'usage
- **Question** : Est-ce que ça correspond à ta vision ?

### 3. **Chatbot ou FAQ interactive**
- Répond aux questions fréquentes
- Redirige vers Calendly
- **Question** : Est-ce que ça correspond à ton ton sobre ?

### 4. **Section "Ils m'ont fait confiance"**
- Logos ou noms d'entreprises (avec permission)
- **Question** : Est-ce que tu veux afficher les noms de clients ?

### 5. **Blog posts optimisés SEO**
- "Guide scraping immobilier"
- "Comment automatiser X"
- "ROI de l'automatisation"
- **Question** : Est-ce que tu veux créer du contenu SEO ?

---

## 🤔 QUESTIONS À DISCUTER

### 1. **Message d'accroche** ✅ (FAIT)
- ~~Actuellement : "J'aide les dirigeants de TPE-PME..."~~
- **Modifié** : "J'aide les dirigeants..." (suppression de "TPE-PME" pour ne plus limiter)
- **Fichiers modifiés** : `pages/index.js`, `pages/a-propos.js`

### 2. **Section "Ce qui me différencie"**
- **Question** : Est-ce que tu veux une section explicite ou préfères-tu que ça reste implicite ?

### 3. **Témoignages avec ROI**
- **Question** : Est-ce que tu veux demander aux clients des métriques précises (gain de temps, ROI) ?

### 4. **Page "Cas d'usage"**
- **Question** : Est-ce que tu veux créer une page dédiée ou intégrer dans "Objectifs" ?

### 5. **Newsletter**
- **Question** : Est-ce que ça correspond à ta vision de ne pas faire de marketing agressif ?

### 6. **Articles SEO**
- **Question** : Est-ce que tu veux créer du contenu optimisé SEO ou rester sur du contenu authentique ?

---

## 📝 NOTES IMPORTANTES

### Ce qui a été fait récemment
- ✅ Carousels améliorés (scroll horizontal, synchronisation)
- ✅ Corrections présentation page objectifs
- ✅ Liens d'affiliation avec flèches
- ✅ SearchBar améliorée (blog, outils)
- ✅ Titres corrigés (Échanges grâce au blog, Utilisateurs total Apify, etc.)
- ✅ Page "données publiques" renommée en "objectifs"

### Ce qui reste à faire (par priorité)
1. **Section "Pourquoi me choisir ?"** (homepage) - 🔴
2. **Section "Mes valeurs"** (à propos) - 🔴
3. **Section "TL;DR pour CEOs"** (objectifs) - 🔴
4. **Témoignages avec ROI** - 🟡
5. **Page "Cas d'usage"** - 🟡
6. **Landing pages par secteur** - 🟡
7. **Développer la personnalité** - 🟢

---

**Dernière mise à jour** : Janvier 2025
