import { useEffect, useState } from 'react'

export default function CaseStudyViewCounter({ slug, views: initialViews = null }) {
  const [views, setViews] = useState(initialViews)
  const [loading, setLoading] = useState(initialViews === null)

  useEffect(() => {
    // Si views est fourni en prop, on l'utilise directement (pas d'appel API)
    if (initialViews !== null) {
      setViews(initialViews)
      setLoading(false)
      return
    }

    // Sinon, on fait l'appel API pour récupérer les vues
    const fetchViews = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/case-studies-views/${slug}`)
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
  }, [slug, initialViews])

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

