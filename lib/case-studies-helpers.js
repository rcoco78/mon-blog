// Fonctions helper pour la conversion secteur <-> slug
import { caseStudies } from './case-studies'

// Fonction pour convertir un nom de secteur en slug URL-friendly
export function sectorToSlug(sector) {
  if (!sector) return ''
  
  // Mapping des secteurs vers leurs slugs SEO-friendly
  const sectorMap = {
    'Immobilier': 'immobilier',
    'Artisanat': 'artisanat',
    'Santé': 'sante',
    'Finance': 'finance',
    'E-commerce': 'e-commerce',
    'Restauration': 'restauration',
    'Éducation': 'education',
    'Sport & Loisirs': 'sport-loisirs',
    'Beauté & Bien-être': 'beaute-bien-etre',
    'Automobile': 'automobile',
    'Hôtellerie': 'hotellerie',
    'Juridique': 'juridique',
    'Immobilier Professionnel': 'immobilier-professionnel',
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
  
  // Si le secteur est dans le mapping, utiliser le slug
  if (sectorMap[sector]) {
    return sectorMap[sector]
  }
  
  // Sinon, convertir en slug générique (minuscules, remplacer espaces et caractères spéciaux)
  return sector
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplacer caractères spéciaux par des tirets
    .replace(/^-+|-+$/g, '') // Supprimer les tirets en début/fin
}

// Fonction pour obtenir un secteur depuis son slug
export function slugToSector(slug) {
  const sectorMap = {
    'immobilier': 'Immobilier',
    'artisanat': 'Artisanat',
    'sante': 'Santé',
    'finance': 'Finance',
    'e-commerce': 'E-commerce',
    'restauration': 'Restauration',
    'education': 'Éducation',
    'sport-loisirs': 'Sport & Loisirs',
    'beaute-bien-etre': 'Beauté & Bien-être',
    'automobile': 'Automobile',
    'hotellerie': 'Hôtellerie',
    'juridique': 'Juridique',
    'immobilier-professionnel': 'Immobilier Professionnel',
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
  
  // Fallback pour secteurs créés dynamiquement par le cron (ex: Éducation, VC)
  if (sectorMap[slug]) return sectorMap[slug]
  if (!slug || typeof slug !== 'string') return null
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}



