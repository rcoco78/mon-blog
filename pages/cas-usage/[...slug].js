// Page catch-all pour rediriger les anciennes URLs vers la nouvelle structure hiérarchique
// Gère : /cas-usage/[slug] -> /cas-usage/[sector]/[slug]
// Utilise Blob Storage pour trouver les case studies (6500+), pas seulement le fichier local

import { getCaseStudyBySlug } from '../../lib/case-studies-blob'
import { sectorToSlug } from '../../lib/case-studies-helpers'

export default function CaseStudyRedirect() {
  return null
}

export async function getServerSideProps({ params }) {
  const slug = params.slug?.[0] // Prendre le premier élément du tableau slug
  
  // PROTECTION SEO : Rejeter les URLs avec patterns littéraux [sector] ou [slug]
  if (slug && (slug.includes('[sector]') || slug.includes('[slug]') || slug === '[sector]' || slug === '[slug]')) {
    return { notFound: true }
  }
  
  // Si c'est déjà une route avec secteur (2 éléments), ne pas traiter ici
  if (params.slug && params.slug.length > 1) {
    const hasInvalidPattern = params.slug.some(segment => 
      segment && (segment.includes('[sector]') || segment.includes('[slug]'))
    )
    if (hasInvalidPattern) return { notFound: true }
    return { notFound: true }
  }

  if (!slug) return { redirect: { destination: '/cas-usage', permanent: true } }

  const caseStudy = await getCaseStudyBySlug(slug)
  
  if (!caseStudy) {
    return { redirect: { destination: '/cas-usage', permanent: true } }
  }

  const sectorSlug = sectorToSlug(caseStudy.sector)
  return {
    redirect: {
      destination: `/cas-usage/${sectorSlug}/${caseStudy.slug}`,
      permanent: true
    }
  }
}



