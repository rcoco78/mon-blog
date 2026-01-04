import { useEffect, useState } from 'react'

export default function CaseStudyViewCounter({ slug, increment = false, views: initialViews = null }) {
  const [views, setViews] = useState(initialViews)
  const [loading, setLoading] = useState(initialViews === null)

  useEffect(() => {
    // Si views est fourni en prop, on l'utilise directement (pas d'appel API)
    if (initialViews !== null) {
      setViews(initialViews)
      setLoading(false)
      return
    }

    // Sinon, on fait l'appel API (pour la rétrocompatibilité)
    const fetchViews = async () => {
      try {
        setLoading(true)
        // Si increment=true, on incrémente la vue (pour les pages de case study)
        // Sinon, on récupère juste le nombre (pour les listes)
        const url = increment 
          ? `/api/case-studies-views/${slug}?increment=true`
          : `/api/case-studies-views/${slug}`
        
        // Cache-busting pour forcer la récupération des données à jour
        const cacheBuster = `?t=${Date.now()}`
        const finalUrl = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}${cacheBuster}`
        
        const response = await fetch(finalUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })
        const data = await response.json()
        setViews(data.views || 0)
      } catch (error) {
        console.error('Erreur lors de la récupération des vues:', error)
        setViews(0)
      } finally {
        setLoading(false)
      }
    }

    fetchViews()
  }, [slug, increment, initialViews])

  if (loading) {
    return (
      <span className="text-xs text-neutral-500 dark:text-neutral-500 tabular-nums">
        <span className="inline-block h-3 w-10 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></span>
      </span>
    )
  }

  return (
    <span className="text-xs text-neutral-500 dark:text-neutral-500 tabular-nums">
      {views} {views === 0 || views === 1 ? 'vue' : 'vues'}
    </span>
  )
}

