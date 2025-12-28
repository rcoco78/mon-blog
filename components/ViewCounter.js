import { useEffect, useState } from 'react'

export default function ViewCounter({ slug }) {
  const [views, setViews] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchViews = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/views/${slug}`)
        const data = await response.json()
        setViews(data.views)
      } catch (error) {
        console.error('Erreur lors de la récupération des vues:', error)
        setViews(0)
      } finally {
        setLoading(false)
      }
    }

    fetchViews()
  }, [slug])

  if (loading) {
    return (
      <span className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
        <span className="inline-block h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></span>
      </span>
    )
  }

  return (
    <span className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
      {views} vues
    </span>
  )
} 