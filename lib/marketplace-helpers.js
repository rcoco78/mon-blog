// Fonctions helper pour la conversion catégorie <-> slug marketplace

// Fonction pour convertir un nom de catégorie en slug URL-friendly
export function categoryToSlug(category) {
  if (!category) return ''
  
  // Mapping des catégories vers leurs slugs SEO-friendly
  const categoryMap = {
    'Immobilier': 'immobilier',
    'Artisanat': 'artisanat',
    'B2B': 'b2b',
    'Finance': 'finance',
    'E-commerce': 'e-commerce',
    'Retail': 'retail',
    'Services': 'services',
    'Santé': 'sante',
    'Éducation': 'education',
    'Sport & Loisirs': 'sport-loisirs',
    'Beauté & Bien-être': 'beaute-bien-etre',
    'Automobile': 'automobile',
    'Hôtellerie': 'hotellerie',
    'Juridique': 'juridique',
    'Transport & Logistique': 'transport-logistique',
    'Tourisme & Voyage': 'tourisme-voyage',
    'Automatisation': 'automatisation',
    'Autres': 'autres',
    'Développement': 'developpement',
    'IA & Machine Learning': 'ia-machine-learning',
    'Médias & Actualités': 'medias-actualites',
    'Recrutement & RH': 'recrutement-rh',
    'Réseaux Sociaux & Lead Generation': 'reseaux-sociaux-lead-generation',
    'SEO & Analytics': 'seo-analytics',
  }
  
  // Si la catégorie est dans le mapping, utiliser le slug
  if (categoryMap[category]) {
    return categoryMap[category]
  }
  
  // Sinon, convertir en slug générique (minuscules, remplacer espaces et caractères spéciaux)
  return category
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplacer caractères spéciaux par des tirets
    .replace(/^-+|-+$/g, '') // Supprimer les tirets en début/fin
}

// Fonction pour obtenir une catégorie depuis son slug
export function slugToCategory(slug) {
  const categoryMap = {
    'immobilier': 'Immobilier',
    'artisanat': 'Artisanat',
    'b2b': 'B2B',
    'finance': 'Finance',
    'e-commerce': 'E-commerce',
    'retail': 'Retail',
    'services': 'Services',
    'sante': 'Santé',
    'education': 'Éducation',
    'sport-loisirs': 'Sport & Loisirs',
    'beaute-bien-etre': 'Beauté & Bien-être',
    'automobile': 'Automobile',
    'hotellerie': 'Hôtellerie',
    'juridique': 'Juridique',
    'transport-logistique': 'Transport & Logistique',
    'tourisme-voyage': 'Tourisme & Voyage',
    'automatisation': 'Automatisation',
    'autres': 'Autres',
    'developpement': 'Développement',
    'ia-machine-learning': 'IA & Machine Learning',
    'medias-actualites': 'Médias & Actualités',
    'recrutement-rh': 'Recrutement & RH',
    'reseaux-sociaux-lead-generation': 'Réseaux Sociaux & Lead Generation',
    'seo-analytics': 'SEO & Analytics',
  }
  
  return categoryMap[slug] || null
}

