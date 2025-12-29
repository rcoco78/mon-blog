# 🎨 Design System - corentinrobert.fr

Documentation complète du design system utilisé sur le site.

## 📋 Table des matières

1. [Philosophie](#philosophie)
2. [Couleurs](#couleurs)
3. [Typographie](#typographie)
4. [Espacements](#espacements)
5. [Bordures et Rayons](#bordures-et-rayons)
6. [Composants](#composants)
7. [États et Interactions](#états-et-interactions)
8. [Dark Mode](#dark-mode)
9. [Responsive Design](#responsive-design)

---

## 🎯 Philosophie

Le design system privilégie :
- **Simplicité** : Interface épurée, sans fioritures
- **Lisibilité** : Contraste élevé, typographie claire
- **Cohérence** : Patterns réutilisables sur tout le site
- **Accessibilité** : Respect des standards WCAG
- **Performance** : CSS minimal, transitions fluides

**Inspiration** : Sites minimalistes comme [ben.page](https://ben.page/), [levelsio](https://levels.io/)

---

## 🎨 Couleurs

### Palette Neutre

Le site utilise exclusivement une palette de gris neutres pour un design épuré et professionnel.

```css
neutral-100: #f5f5f5  /* Fond très clair */
neutral-200: #e5e5e5  /* Bordures claires */
neutral-300: #d4d4d4  /* Bordures hover */
neutral-400: #a3a3a3  /* Texte secondaire */
neutral-500: #737373  /* Texte tertiaire */
neutral-600: #525252  /* Texte secondaire dark */
neutral-700: #404040  /* Fond dark */
neutral-800: #262626  /* Fond dark plus foncé */
neutral-900: #171717  /* Texte principal dark */
```

### Usage des Couleurs

#### Texte Principal
```jsx
className="text-neutral-900 dark:text-neutral-100"
```
- **Light mode** : `neutral-900` (#171717) - Texte principal
- **Dark mode** : `neutral-100` (#f5f5f5) - Texte principal

#### Texte Secondaire
```jsx
className="text-neutral-600 dark:text-neutral-400"
```
- **Light mode** : `neutral-600` (#525252) - Descriptions, métadonnées
- **Dark mode** : `neutral-400` (#a3a3a3) - Descriptions, métadonnées

#### Texte Tertiaire
```jsx
className="text-neutral-500 dark:text-neutral-500"
```
- Utilisé pour les sources, dates, informations moins importantes

#### Bordures
```jsx
className="border-neutral-200 dark:border-neutral-800"
```
- **Light mode** : `neutral-200` (#e5e5e5) - Bordures subtiles
- **Dark mode** : `neutral-800` (#262626) - Bordures subtiles

#### Bordures Hover
```jsx
className="hover:border-neutral-300 dark:hover:border-neutral-700"
```
- Utilisé pour les états hover sur les cartes et liens

#### Fonds
```jsx
className="bg-neutral-50 dark:bg-neutral-900/50"
```
- **Light mode** : `neutral-50` - Fonds de cartes, sections
- **Dark mode** : `neutral-900/50` - Fonds de cartes avec opacité

#### Fonds Hover
```jsx
className="hover:bg-neutral-100 dark:hover:bg-neutral-800"
```
- Utilisé pour les boutons et éléments interactifs

### Couleurs Accent (Tags)

#### LinkedIn (Bleu)
```jsx
className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
```

#### Malt (Orange)
```jsx
className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
```

#### Status (Vert)
```jsx
className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
```

---

## ✍️ Typographie

### Police

**Font Family** : `Inter` (fallback: `system-ui`, `sans-serif`)

```css
font-family: 'Inter', system-ui, sans-serif;
```

### Hiérarchie Typographique

#### Titre Principal (H1)
```jsx
className="font-semibold text-2xl mb-8 tracking-tighter"
```
- **Taille** : `text-2xl` (1.5rem / 24px)
- **Poids** : `font-semibold` (600)
- **Tracking** : `tracking-tighter` (-0.025em)
- **Usage** : Titres de page principale

#### Titre Section (H2)
```jsx
className="font-semibold text-xl mb-6 tracking-tighter"
```
- **Taille** : `text-xl` (1.25rem / 20px)
- **Poids** : `font-semibold` (600)
- **Tracking** : `tracking-tighter`
- **Usage** : Sections principales

#### Titre Sous-section (H3)
```jsx
className="font-semibold text-lg mb-4 tracking-tighter"
```
- **Taille** : `text-lg` (1.125rem / 18px)
- **Poids** : `font-semibold` (600)
- **Usage** : Sous-sections

#### Titre Élément (H3)
```jsx
className="font-medium"
```
- **Poids** : `font-medium` (500)
- **Usage** : Titres de cartes, projets

#### Corps de Texte Principal
```jsx
className="text-neutral-900 dark:text-neutral-100 tracking-tight"
```
- **Taille** : Par défaut (1rem / 16px)
- **Tracking** : `tracking-tight` (-0.025em)
- **Usage** : Paragraphes principaux

#### Corps de Texte Secondaire
```jsx
className="text-neutral-600 dark:text-neutral-400 tracking-tight"
```
- **Taille** : Par défaut (1rem / 16px)
- **Usage** : Descriptions, métadonnées

#### Texte Petit
```jsx
className="text-sm text-neutral-600 dark:text-neutral-400"
```
- **Taille** : `text-sm` (0.875rem / 14px)
- **Usage** : Sources, dates, informations secondaires

#### Texte Très Petit
```jsx
className="text-xs text-neutral-500 dark:text-neutral-500"
```
- **Taille** : `text-xs` (0.75rem / 12px)
- **Usage** : Labels, tags, métadonnées

#### Texte Tabulaire (Nombres)
```jsx
className="tabular-nums"
```
- **Usage** : Compteurs, dates, nombres pour alignement

---

## 📏 Espacements

### Système d'Espacement

Le site utilise un système d'espacement cohérent basé sur Tailwind (multiples de 4px).

### Espacements Verticaux

#### Entre Sections Principales
```jsx
className="mb-16"  // 4rem / 64px
```
- Utilisé entre les grandes sections de contenu

#### Entre Sections Secondaires
```jsx
className="mb-12"  // 3rem / 48px
```
- Utilisé entre sections de niveau moyen

#### Entre Éléments de Section
```jsx
className="mb-8"   // 2rem / 32px
```
- Utilisé entre paragraphes, éléments de liste

#### Entre Éléments Proches
```jsx
className="mb-6"   // 1.5rem / 24px
className="mb-4"   // 1rem / 16px
className="mb-3"   // 0.75rem / 12px
className="mb-2"   // 0.5rem / 8px
className="mb-1"   // 0.25rem / 4px
```

#### Espacement Top
```jsx
className="mt-12"  // 3rem / 48px - Entre sections
className="mt-8"   // 2rem / 32px - Footer, espacements moyens
className="mt-6"   // 1.5rem / 24px - Main content
```

### Espacements Horizontaux

#### Padding Conteneur Principal
```jsx
className="px-4 sm:px-6 lg:px-8"
```
- **Mobile** : `px-4` (1rem / 16px)
- **Tablet** : `sm:px-6` (1.5rem / 24px)
- **Desktop** : `lg:px-8` (2rem / 32px)

#### Padding Contenu
```jsx
className="px-2 md:px-0"
```
- **Mobile** : `px-2` (0.5rem / 8px)
- **Desktop** : `md:px-0` (pas de padding)

#### Padding Cartes
```jsx
className="p-6"    // 1.5rem / 24px - Cartes témoignages
className="p-4"    // 1rem / 16px - Cartes projets, métriques
```

#### Espacement Entre Éléments
```jsx
className="space-x-1 sm:space-x-2"  // Navigation
className="space-y-4"                // Liste verticale
className="space-y-2"                 // Liste compacte
className="gap-4"                    // Grid, flex
```

### Largeur Maximale

```jsx
className="mx-auto max-w-2xl"
```
- **Largeur max** : `max-w-2xl` (42rem / 672px)
- **Centrage** : `mx-auto`

---

## 🔲 Bordures et Rayons

### Rayons de Bordure

#### Rayon Standard
```jsx
className="rounded-lg"  // 0.5rem / 8px
```
- **Usage** : Cartes, boutons, images, conteneurs

#### Rayon Petit
```jsx
className="rounded-md"  // 0.375rem / 6px
```
- **Usage** : Boutons navigation, éléments interactifs

#### Rayon Complet (Cercle)
```jsx
className="rounded-full"  // 9999px
```
- **Usage** : Avatars, badges, tags

### Bordures

#### Bordure Standard
```jsx
className="border border-neutral-200 dark:border-neutral-800"
```
- **Épaisseur** : `border` (1px)
- **Usage** : Cartes, conteneurs

#### Bordure Épaisse
```jsx
className="border-2 border-neutral-200 dark:border-neutral-800"
```
- **Épaisseur** : `border-2` (2px)
- **Usage** : Images de profil, éléments importants

---

## 🧩 Composants

### Navigation

#### Lien Navigation
```jsx
className="transition-all hover:text-neutral-800 dark:hover:text-neutral-200 
           flex align-middle relative py-1 px-2 sm:px-3 rounded-md"
```

#### Lien Actif
```jsx
className="text-neutral-900 dark:text-neutral-100 font-medium"
```

#### Lien Inactif
```jsx
className="text-neutral-600 dark:text-neutral-400"
```

### Cartes

#### Carte Standard
```jsx
className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800"
```

#### Carte avec Fond
```jsx
className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 
           bg-neutral-50 dark:bg-neutral-900/50"
```

#### Carte Interactive
```jsx
className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 
           hover:border-neutral-300 dark:hover:border-neutral-700 
           transition-colors group"
```

### Boutons

#### Bouton Principal
```jsx
className="px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 
           rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
```

#### Bouton Secondaire
```jsx
className="px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-800 
           rounded-lg hover:border-neutral-300 dark:hover:border-neutral-700 
           transition-colors"
```

### Tags / Badges

#### Tag Standard
```jsx
className="px-2 py-0.5 rounded-full text-xs 
           bg-neutral-100 dark:bg-neutral-800 
           text-neutral-600 dark:text-neutral-400"
```

#### Tag Source (LinkedIn)
```jsx
className="text-xs px-2 py-0.5 rounded-full 
           bg-blue-100 dark:bg-blue-900/30 
           text-blue-700 dark:text-blue-400 whitespace-nowrap"
```

#### Tag Source (Malt)
```jsx
className="text-xs px-2 py-0.5 rounded-full 
           bg-orange-100 dark:bg-orange-900/30 
           text-orange-700 dark:text-orange-400 whitespace-nowrap"
```

#### Tag Status Actif
```jsx
className="text-xs px-2 py-0.5 rounded-full 
           bg-green-100 dark:bg-green-900/30 
           text-green-700 dark:text-green-400"
```

### Liens

#### Lien Externe avec Icône
```jsx
<svg width="12" height="12" viewBox="0 0 12 12" fill="none" 
     className="transform transition-transform 
                group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
  <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" 
        fill="currentColor" />
</svg>
```

### Articles de Blog

#### Lien Article
```jsx
className="post-link"  // Défini dans globals.css
```

#### Date Article
```jsx
className="post-date"  // text-neutral-600 dark:text-neutral-400 tabular-nums
```

#### Titre Article
```jsx
className="post-title"  // text-neutral-900 dark:text-neutral-100 tracking-tight
```

### Grid Layout

#### Grid Métriques
```jsx
className="grid grid-cols-2 md:grid-cols-4 gap-4"
```
- **Mobile** : 2 colonnes
- **Desktop** : 4 colonnes
- **Gap** : 1rem / 16px

#### Grid Projets
```jsx
className="flex flex-col space-y-4"
```
- Layout vertical avec espacement entre éléments

---

## 🎭 États et Interactions

### Transitions

#### Transition Standard
```jsx
className="transition-all"
```
- **Durée** : 150ms (par défaut Tailwind)
- **Usage** : Tous les éléments interactifs

#### Transition Couleurs
```jsx
className="transition-colors"
```
- **Usage** : Bordures, fonds, textes

#### Transition Transform
```jsx
className="transform transition-transform 
           group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
```
- **Usage** : Icônes de liens externes

### États Hover

#### Texte Hover
```jsx
className="hover:text-neutral-800 dark:hover:text-neutral-200"
```

#### Bordure Hover
```jsx
className="hover:border-neutral-300 dark:hover:border-neutral-700"
```

#### Fond Hover
```jsx
className="hover:bg-neutral-100 dark:hover:bg-neutral-800"
```

### Group Hover

Utilisé pour les éléments interactifs avec enfants :

```jsx
className="group"
// Sur l'enfant :
className="group-hover:text-neutral-800 dark:group-hover:text-neutral-200"
```

---

## 🌙 Dark Mode

### Configuration

Le dark mode utilise la classe `dark:` de Tailwind avec `darkMode: 'class'`.

### Patterns Dark Mode

Tous les éléments doivent avoir des variantes dark :

```jsx
// Texte
className="text-neutral-900 dark:text-neutral-100"

// Bordures
className="border-neutral-200 dark:border-neutral-800"

// Fonds
className="bg-neutral-50 dark:bg-neutral-900/50"
```

### Toggle Dark Mode

```jsx
// Bouton dans Layout.js
className="flex items-center justify-center transition-all 
           py-1 px-2 sm:px-3 rounded-md 
           hover:bg-neutral-100 dark:hover:bg-neutral-800 
           text-neutral-600 dark:text-neutral-400 
           hover:text-neutral-900 dark:hover:text-neutral-100"
```

---

## 📱 Responsive Design

### Breakpoints Tailwind

- **sm** : 640px (tablettes)
- **md** : 768px (petits écrans)
- **lg** : 1024px (desktop)

### Patterns Responsive

#### Padding Responsive
```jsx
className="px-4 sm:px-6 lg:px-8"
```

#### Espacement Responsive
```jsx
className="space-x-1 sm:space-x-2"
className="mt-4 sm:mt-8"
```

#### Grid Responsive
```jsx
className="grid grid-cols-2 md:grid-cols-4 gap-4"
```

#### Flex Responsive
```jsx
className="flex flex-col md:flex-row"
```

#### Affichage Conditionnel
```jsx
className="hidden md:block"  // Caché mobile, visible desktop
className="md:hidden"        // Visible mobile, caché desktop
```

---

## 📐 Layout

### Conteneur Principal

```jsx
<div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
  <div className="flex flex-col min-h-screen mt-8 sm:mt-8">
    {/* Contenu */}
  </div>
</div>
```

### Structure Page

```jsx
<main className="flex-auto min-w-0 mt-6 flex flex-col px-2 md:px-0">
  <section className="mb-16">
    {/* Section content */}
  </section>
</main>
```

---

## 🎯 Règles d'Usage

### ✅ À Faire

- Utiliser les classes Tailwind définies dans ce design system
- Toujours prévoir les variantes dark mode
- Respecter les espacements standards
- Utiliser `tracking-tighter` pour les titres
- Utiliser `tracking-tight` pour le corps de texte
- Ajouter `transition-all` ou `transition-colors` sur les éléments interactifs

### ❌ À Éviter

- Créer de nouvelles couleurs en dehors de la palette neutre (sauf pour tags)
- Utiliser des espacements arbitraires (préférer les multiples de 4)
- Oublier les variantes dark mode
- Utiliser des rayons de bordure non standards
- Mélanger différentes tailles de police sans cohérence

---

## 📚 Classes Utilitaires Personnalisées

Définies dans `styles/globals.css` :

```css
.nav-link      /* Lien navigation */
.post-link     /* Lien article blog */
.post-date     /* Date article */
.post-title    /* Titre article */
.footer-link   /* Lien footer */
```

---

## 🔗 Références

- **Tailwind CSS** : [tailwindcss.com](https://tailwindcss.com)
- **Inter Font** : [rsms.me/inter](https://rsms.me/inter/)
- **Inspiration** : [ben.page](https://ben.page/)

---

**Dernière mise à jour** : Décembre 2025



