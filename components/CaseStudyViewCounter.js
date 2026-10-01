import { useEffect, useState } from 'react'
import { QuietBone } from './QuietSkeleton'
import { formatViewCount } from '../lib/view-label'

/**
 * Affiche le nombre de vues d'un cas d'usage (comme ViewCounter pour le blog).
 * - views (prop) : utilise la valeur fournie (évite l'appel API)
 * - increment (prop) : si true, incrémente à chaque affichage + affiche (page détail)
 * - sector (prop) : passé avec increment=true pour l'API
 */
export default function CaseStudyViewCounter({ slug, sector, views: initialViews = null, increment = false }) {
  const [views, setViews] = useState(initialViews)
  const [loading, setLoading] = useState(initialViews === null)

  useEffect(() => {
    if (initialViews !== null && !increment) {
      setViews(initialViews)
      setLoading(false)
      return
    }

    const fetchViews = async () => {
      try {
        setLoading(true)
        let url = `/api/case-studies-views/${encodeURIComponent(slug)}`
        if (increment) {
          url += '?increment=true'
          if (sector) url += `&sector=${encodeURIComponent(sector)}`
        }
        const response = await fetch(url)
        const data = await response.json()
        setViews(data.views ?? 0)
      } catch (error) {
        console.error('Erreur récupération vues:', error)
        setViews(0)
      } finally {
        setLoading(false)
      }
    }

    if (slug) fetchViews()
  }, [slug, sector, initialViews, increment])

  if (loading) {
    return (
      <span className="text-xs text-neutral-500 dark:text-neutral-500 tabular-nums">
        <QuietBone inline className="h-2.5 w-8" />
      </span>
    )
  }

  return (
    <span className="text-xs text-neutral-500 dark:text-neutral-500 tabular-nums">
      {formatViewCount(views)}
    </span>
  )
}

