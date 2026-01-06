import { useEffect, useState } from 'react'

export default function MarketplaceViewCounter({ slug, category, increment = false }) {
  const [views, setViews] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchViews = async () => {
      try {
        setLoading(true)
        
        // Si increment=true, vérifier si on a déjà incrémenté dans cette session
        let shouldIncrement = increment
        if (increment && typeof window !== 'undefined') {
          const viewKey = `marketplace-view-${category || ''}-${slug}`
          const alreadyViewed = sessionStorage.getItem(viewKey)
          if (alreadyViewed) {
            // Déjà incrémenté dans cette session, ne pas réincrémenter
            shouldIncrement = false
          } else {
            // Marquer comme vu dans cette session
            sessionStorage.setItem(viewKey, 'true')
          }
        }
        
        const params = new URLSearchParams()
        if (shouldIncrement) {
          params.append('increment', 'true')
        }
        if (category) {
          params.append('category', category)
        }
        
        const url = `/api/marketplace-views/${slug}${params.toString() ? '?' + params.toString() : ''}`
        const response = await fetch(url, {
          cache: 'no-store', // Pas de cache pour avoir les données à jour
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache'
          }
        })
        const data = await response.json()
        setViews(data.views)
      } catch (error) {
        console.error('Erreur lors de la récupération des vues marketplace:', error)
        setViews(0)
      } finally {
        setLoading(false)
      }
    }

    fetchViews()
  }, [slug, category, increment])

  if (loading) {
    return (
      <span className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
        <span className="inline-block h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></span>
      </span>
    )
  }

  return (
    <span className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
      {views} {views <= 1 ? 'vue' : 'vues'}
    </span>
  )
}

