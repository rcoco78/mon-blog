import { useEffect, useState } from 'react'

export default function ViewCounter({ slug }) {
  const [views, setViews] = useState(0)

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const response = await fetch(`/api/views/${slug}`)
        const data = await response.json()
        setViews(data.views)
      } catch (error) {
        console.error('Erreur lors de la récupération des vues:', error)
      }
    }

    fetchViews()
  }, [slug])

  return (
    <span className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
      {views} vues
    </span>
  )
} 