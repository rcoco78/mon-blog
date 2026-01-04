// Page catch-all pour rediriger les anciennes URLs vers la nouvelle structure hiérarchique
// Gère : /cas-usage/[slug] -> /cas-usage/[sector]/[slug]

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { getCaseStudyBySlug } from '../../lib/case-studies'
import { sectorToSlug } from '../../lib/case-studies-helpers'

export default function CaseStudyRedirect({ caseStudy, sectorSlug, notFound }) {
  const router = useRouter()

  useEffect(() => {
    if (notFound) {
      router.replace('/cas-usage')
      return
    }

    if (caseStudy && sectorSlug) {
      // Rediriger vers la nouvelle URL avec le secteur
      router.replace(`/cas-usage/${sectorSlug}/${caseStudy.slug}`)
    } else {
      // Si le case study n'existe pas, rediriger vers la page principale
      router.replace('/cas-usage')
    }
  }, [caseStudy, sectorSlug, notFound, router])

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
      <p className="text-neutral-600 dark:text-neutral-400">Redirection...</p>
    </div>
  )
}

export async function getServerSideProps({ params }) {
  const slug = params.slug?.[0] // Prendre le premier élément du tableau slug
  
  // Si c'est déjà une route avec secteur (2 éléments), ne pas traiter ici
  if (params.slug && params.slug.length > 1) {
    return {
      notFound: true
    }
  }

  if (!slug) {
    return {
      props: {
        notFound: true
      }
    }
  }

  const caseStudy = getCaseStudyBySlug(slug)
  
  if (!caseStudy) {
    return {
      props: {
        notFound: true
      }
    }
  }

  const sectorSlug = sectorToSlug(caseStudy.sector)

  return {
    props: {
      caseStudy: {
        slug: caseStudy.slug
      },
      sectorSlug,
      notFound: false
    }
  }
}



