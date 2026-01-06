// Page catch-all pour rediriger les anciennes URLs vers la nouvelle structure hiérarchique
// Gère : /marketplace/[slug] -> /marketplace/[category]/[slug]

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { getDatabaseBySlug } from '../../lib/marketplace-databases'
import { categoryToSlug } from '../../lib/marketplace-helpers'

export default function MarketplaceRedirect({ database, categorySlug, notFound }) {
  const router = useRouter()

  useEffect(() => {
    if (notFound) {
      router.replace('/marketplace')
      return
    }

    if (database && categorySlug) {
      // Rediriger vers la nouvelle URL avec la catégorie
      router.replace(`/marketplace/${categorySlug}/${database.slug}`)
    } else {
      // Si la base de données n'existe pas, rediriger vers la page principale
      router.replace('/marketplace')
    }
  }, [database, categorySlug, notFound, router])

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
      <p className="text-neutral-600 dark:text-neutral-400">
        Redirection en cours...
      </p>
    </div>
  )
}

export async function getServerSideProps({ params }) {
  const slug = params.slug?.[0] // Prendre le premier élément du tableau slug
  
  // Si c'est déjà une route avec catégorie (2 éléments), ne pas traiter ici
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

  const database = await getDatabaseBySlug(slug)
  
  if (!database) {
    return {
      props: {
        notFound: true
      }
    }
  }

  const categorySlug = categoryToSlug(database.category)

  return {
    props: {
      database: {
        slug: database.slug
      },
      categorySlug,
      notFound: false
    }
  }
}

