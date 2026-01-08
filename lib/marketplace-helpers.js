// Fonctions helper pour la conversion catégorie <-> slug marketplace

// Liste des catégories valides (doit correspondre au mapping ci-dessous)
const VALID_CATEGORIES = [
  'Immobilier',
  'Artisanat',
  'B2B',
  'Finance',
  'E-commerce',
  'Retail',
  'Services',
  'Santé',
  'Éducation',
  'Sport & Loisirs',
  'Beauté & Bien-être',
  'Automobile',
  'Hôtellerie',
  'Juridique',
  'Transport & Logistique',
  'Tourisme & Voyage',
  'Automatisation',
  'Autres',
  'Développement',
  'IA & Machine Learning',
  'Médias & Actualités',
  'Recrutement & RH',
  'Réseaux Sociaux & Lead Generation',
  'SEO & Analytics',
  'VC',
  'Venture Capital',
  'Capital Risque'
]

// Mapping des catégories vers leurs slugs SEO-friendly
const CATEGORY_TO_SLUG_MAP = {
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
  'VC': 'vc',
  'Venture Capital': 'vc',
  'Capital Risque': 'vc',
}

/**
 * Valide et normalise une catégorie
 * Retourne la catégorie valide ou "Autres" par défaut si la catégorie n'est pas valide
 * @param {string} category - La catégorie à valider
 * @returns {string} - La catégorie validée (ou "Autres" si invalide)
 */
export function validateCategory(category) {
  if (!category || typeof category !== 'string') {
    return 'Autres'
  }
  
  // Normaliser la catégorie (trim, etc.)
  const normalized = category.trim()
  
  // Si la catégorie est dans la liste des catégories valides, la retourner
  if (VALID_CATEGORIES.includes(normalized)) {
    return normalized
  }
  
  // Essayer de trouver une correspondance insensible à la casse
  const found = VALID_CATEGORIES.find(
    valid => valid.toLowerCase() === normalized.toLowerCase()
  )
  
  if (found) {
    return found
  }
  
  // Si aucune correspondance, retourner "Autres" par défaut
  // Cela évite les 404 en créant des URLs avec des catégories invalides
  return 'Autres'
}

// Fonction pour convertir un nom de catégorie en slug URL-friendly
export function categoryToSlug(category) {
  if (!category) return 'autres'
  
  // Valider d'abord la catégorie pour éviter les catégories invalides
  const validatedCategory = validateCategory(category)
  
  // Utiliser le mapping pour obtenir le slug
  return CATEGORY_TO_SLUG_MAP[validatedCategory] || 'autres'
}

// Fonction pour obtenir une catégorie depuis son slug
export function slugToCategory(slug) {
  const SLUG_TO_CATEGORY_MAP = {
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
    'vc': 'VC',
  }
  
  return SLUG_TO_CATEGORY_MAP[slug] || null
}

/**
 * Retourne la liste des catégories valides
 * @returns {string[]} - Liste des catégories valides
 */
export function getValidCategories() {
  return [...VALID_CATEGORIES]
}

