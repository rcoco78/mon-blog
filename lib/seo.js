/**
 * Utilitaires SEO centralisés
 * Fonctions pour générer des meta descriptions, titres optimisés, etc.
 */

import { siteConfig } from './config'

/**
 * Génère une meta description optimisée (150-160 caractères)
 */
export function generateMetaDescription(text, maxLength = 160) {
  if (!text) return siteConfig.seo.defaultDescription
  
  // Nettoyer le texte (supprimer HTML, markdown, etc.)
  const cleanText = text
    .replace(/[#*_`]/g, '') // Supprimer markdown
    .replace(/<[^>]*>/g, '') // Supprimer HTML
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .trim()
  
  if (cleanText.length <= maxLength) return cleanText
  
  // Tronquer au dernier mot complet avant maxLength
  const truncated = cleanText.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...'
}

/**
 * Génère un titre SEO optimisé
 */
export function generateSEOTitle(pageTitle, includeSiteName = true) {
  if (!pageTitle) return siteConfig.title
  
  if (!includeSiteName) return pageTitle
  
  return `${pageTitle} | ${siteConfig.name}`
}

/**
 * Génère une URL canonique
 */
export function generateCanonicalUrl(path = '') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${siteConfig.url}${cleanPath}`
}

/**
 * Génère des keywords SEO à partir de tags et du contenu
 */
export function generateKeywords(tags = [], additionalKeywords = []) {
  const baseKeywords = siteConfig.seo.baseKeywords || []
  const allKeywords = [...baseKeywords, ...tags, ...additionalKeywords]
  
  // Dédupliquer et limiter à 10 keywords
  return [...new Set(allKeywords)].slice(0, 10).join(', ')
}

/**
 * Valide et optimise une meta description
 */
export function validateMetaDescription(description) {
  if (!description) return siteConfig.seo.defaultDescription
  
  const length = description.length
  
  // Ne pas afficher de warning en production pour éviter le bruit dans la console
  if (length < 120 && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(`Meta description trop courte (${length} caractères). Minimum recommandé: 120`)
  }
  
  if (length > 160) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn(`Meta description trop longue (${length} caractères). Maximum recommandé: 160`)
    }
    return generateMetaDescription(description)
  }
  
  return description
}

/**
 * Génère un objet de données SEO complet pour une page
 */
export function generatePageSEO({
  title,
  description,
  path = '',
  keywords = [],
  ogImage,
  article = false,
  publishedTime,
  modifiedTime,
  tags = []
}) {
  const seoTitle = generateSEOTitle(title)
  const metaDescription = validateMetaDescription(description || siteConfig.seo.defaultDescription)
  const canonical = generateCanonicalUrl(path)
  const seoKeywords = generateKeywords(tags, keywords)
  
  return {
    title: seoTitle,
    description: metaDescription,
    canonical,
    keywords: seoKeywords,
    ogImage: ogImage || siteConfig.ogImage,
    ogType: article ? 'article' : 'website',
    publishedTime,
    modifiedTime,
    tags,
    article
  }
}

