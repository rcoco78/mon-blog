// Page catch-all pour rediriger les anciennes URLs vers la nouvelle structure hiérarchique
// Gère : /marketplace/[slug] -> /marketplace/[category]/[slug]
// Utilise une redirection serveur (301) pour éviter les problèmes de contenu dupliqué dans Google Search Console

import { getDatabaseBySlug } from '../../lib/marketplace-databases'
import { categoryToSlug } from '../../lib/marketplace-helpers'

export default function MarketplaceRedirect() {
  // Cette page ne devrait jamais être rendue car la redirection se fait côté serveur
  return null
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
      redirect: {
        destination: '/marketplace',
        permanent: true
      }
    }
  }

  const database = await getDatabaseBySlug(slug)
  
  if (!database) {
    return {
      redirect: {
        destination: '/marketplace',
        permanent: true
      }
    }
  }

  const categorySlug = categoryToSlug(database.category)

  // Redirection serveur permanente (301) vers l'URL avec catégorie
  // Cela évite les problèmes de contenu dupliqué dans Google Search Console
  return {
    redirect: {
      destination: `/marketplace/${categorySlug}/${database.slug}`,
      permanent: true // 301 redirect
    }
  }
}

